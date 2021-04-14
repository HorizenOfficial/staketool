#!/bin/bash

set -eo pipefail

export IS_VERIFIED_TAG="false"
export EXT=""

# check if tag is signed by maintainer
if [ ! -z "${TRAVIS_TAG}" ]; then
  if [ "$TRAVIS_TAG" != "$(npm version | grep staketool | cut -d "'" -f 2)" ]; then
    echo "Git tag and package.json version number out of sync, aborting."
    exit 1
  fi
  # fix broken dirmngr on MacOS by reinstalling gnupg
  if [ "${TRAVIS_OS_NAME}" = "osx" ]; then
    export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
    brew reinstall gnupg
  # install tools on Windows
  elif [ "${TRAVIS_OS_NAME}" = "windows" ]; then
    choco install -y gnupg openssl || ( cat /c/ProgramData/chocolatey/logs/chocolatey.log && exit 1 )
  fi
  if [ "${TRAVIS_OS_NAME}" = "osx" ] || [ "${TRAVIS_OS_NAME}" = "linux" ] || [ "${TRAVIS_OS_NAME}" = "windows" ]; then
    export GNUPGHOME="$(mktemp -d 2>/dev/null || mktemp -d -t 'GNUPGHOME')"
    # gpg: setting pinentry mode 'loopback' failed: Not supported https://www.fluidkeys.com/tweak-gpg-2.1.11/
    echo "allow-loopback-pinentry" > "${GNUPGHOME}/gpg-agent.conf"
    echo "Tagged build, fetching maintainer keys."
    gpg -v --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys $MAINTAINER_KEYS ||
      gpg -v --batch --keyserver hkp://ipv4.pool.sks-keyservers.net --recv-keys $MAINTAINER_KEYS ||
      gpg -v --batch --keyserver hkp://pgp.mit.edu:80 --recv-keys $MAINTAINER_KEYS ||
      gpg -v --batch --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys $MAINTAINER_KEYS
    if git verify-tag -v "${TRAVIS_TAG}"; then
      echo "Valid signed tag"
      export IS_VERIFIED_TAG="true"
      echo "Fetching gpg signing keys."
      curl -sLH "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3.raw" "$PGPKEY_ARCHIVE_URL" |
        openssl enc -d -aes-256-cbc -md sha256 -pass pass:$PGPKEY_ARCHIVE_PASSWORD |
        tar -xzf- -C "${HOME}"
      echo "Fetching codesigning keys."
      curl -sLH "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3.raw" "$CERT_ARCHIVE_URL" |
        openssl enc -d -aes-256-cbc -md sha256 -pass pass:$CERT_ARCHIVE_PASSWORD |
        tar -xzf- -C "${HOME}"
    fi
  fi
  if [ "${IS_VERIFIED_TAG}" = "true" ]; then
#    if [ "${TRAVIS_OS_NAME}" = "osx" ]; then
#      gpg --batch --fast-import "${HOME}/${PGP_KEY_FILE}"
#      signing of pkg created binaries broken on macos https://github.com/vercel/pkg/issues/128
#      source "${TRAVIS_BUILD_DIR}/ci/scripts/setup_macos_keychain.sh"
#    else
      gpg --batch --fast-import "${HOME}/${PGP_KEY_FILE}"
#    fi
  fi
fi

# set binary extension and default shell on windows
# https://github.com/npm/npm/issues/9420
if [ "${TRAVIS_OS_NAME}" = "windows" ]; then
  export EXT=".exe"
  npm config set script-shell "$(which bash)"
fi

# unset credentials if not publishing
if [ "${IS_VERIFIED_TAG}" = "false" ]; then
  export GITHUB_TOKEN=""
  export MAC_KEY_PASSWORD=""
  export MAC_KEY_FILE=""
  export WIN_KEY_PASSWORD=""
  export WIN_KEY_FILE=""
  export PGP_KEY_PASSWORD=""
  unset GITHUB_TOKEN
  unset MAC_KEY_PASSWORD
  unset MAC_KEY_FILE
  unset WIN_KEY_PASSWORD
  unset WIN_KEY_FILE
  unset PGP_KEY_PASSWORD
fi

# unset credentials after use
export CERT_ARCHIVE_PASSWORD=""
export CERT_ARCHIVE_URL=""
export PGPKEY_ARCHIVE_PASSWORD=""
export PGPKEY_ARCHIVE_URL=""
export PGP_KEY_FILE=""
unset CERT_ARCHIVE_PASSWORD
unset CERT_ARCHIVE_URL
unset PGPKEY_ARCHIVE_PASSWORD
unset PGPKEY_ARCHIVE_URL
unset PGP_KEY_FILE

set +eo pipefail
