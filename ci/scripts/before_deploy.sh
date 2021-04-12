#!/bin/bash

set -eo pipefail

# codesign, checksums and packaging
if [ "${TRAVIS_OS_NAME}" = "osx" ]; then
  cd ./bin/"${TRAVIS_OS_NAME}"
#  signing of pkg created binaries broken on macos https://github.com/vercel/pkg/issues/128
#  for file in *; do
#    codesign --force --verbose --sign "Developer ID Application" "${file}"
#  done
  shasum -a256 * > checksums.sha256
  tar -czf "../staketool-${TRAVIS_OS_NAME}-${TRAVIS_TAG}.tar.gz" *
  cd ..
  shasum -a256 "staketool-${TRAVIS_OS_NAME}-${TRAVIS_TAG}.tar.gz" > "staketool-${TRAVIS_OS_NAME}-${TRAVIS_TAG}.tar.gz.sha256"
  cd ..
elif [ "${TRAVIS_OS_NAME}" = "windows" ]; then
  CERTPATH="$(sed 's|/c|c:|; s|/|\\|g' <<<"${HOME}/${WIN_KEY_FILE}")"
  powershell Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope LocalMachine
  powershell -file "${TRAVIS_BUILD_DIR}/ci/scripts/windows_import_cert.ps1" "${CERTPATH}" "${WIN_KEY_PASSWORD}"
  for file in "${TRAVIS_BUILD_DIR}/bin/${TRAVIS_OS_NAME}"/*; do
    FILE_TO_SIGN="$(sed 's|/c|c:|; s|/|\\|g' <<<"${file}")"
    powershell -file "${TRAVIS_BUILD_DIR}/ci/scripts/windows_sign.ps1" "${FILE_TO_SIGN}"
  done
  cd "${TRAVIS_BUILD_DIR}/bin/${TRAVIS_OS_NAME}"
  hashdeep -csha256 -l * | grep -v '#\|%' | cut -d ',' -f 2-3 | sed 's/,/  /g' > checksums.sha256
  7z a "../staketool-${TRAVIS_OS_NAME}-${TRAVIS_TAG}.zip" *
  cd ..
  hashdeep -csha256 -l "staketool-${TRAVIS_OS_NAME}-${TRAVIS_TAG}.zip" | grep -v '#\|%' | cut -d ',' -f 2-3 | sed 's/,/  /g' > "staketool-${TRAVIS_OS_NAME}-${TRAVIS_TAG}.zip.sha256"
  cd ..
else
  cd ./bin/"${TRAVIS_OS_NAME}"
  shasum -a256 * > checksums.sha256
  tar -czf "../staketool-${TRAVIS_OS_NAME}-${TRAVIS_TAG}.tar.gz" *
#  cd ../alpine
#  shasum -a256 * > checksums.sha256
#  tar -czf "../staketool-alpine-${TRAVIS_TAG}.tar.gz" *
  cd ..
  for file in *.tar.gz; do
    shasum -a256 "${file}" > "${file}.sha256"
  done
  cd ..
fi

# pgp sign
for file in $(find ./bin -maxdepth 1 -type f -name "*.zip" -o -name "*.tar.gz"); do
  gpg --batch --yes --detach-sign --passphrase-file <(echo "${PGP_KEY_PASSWORD}") --pinentry-mode loopback --output "${file}.asc" "${file}"
done

# stop gpg processes
gpgconf -v --kill dirmngr || true
gpgconf -v --kill gpg-agent || true
