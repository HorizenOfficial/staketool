#!/bin/bash

set -eo pipefail

npm run test
npm run "makebins-${TRAVIS_OS_NAME}"
"${TRAVIS_BUILD_DIR}/bin/${TRAVIS_OS_NAME}/staketool${EXT}"
"${TRAVIS_BUILD_DIR}/bin/${TRAVIS_OS_NAME}/signtxtool${EXT}"
#if [ "${TRAVIS_OS_NAME}" = "linux" ]; then
#  ./ci/scripts/docker_alpine.sh;
#fi
