#!/bin/bash

set -eo pipefail

FLAVOR="$(node -v | cut -d '.' -f 1 | tr -d v)-alpine"

docker build --no-cache --pull --build-arg FLAVOR="${FLAVOR}" -t zencash/staketool:latest ./ci/dockerfiles

export PKG_CACHE_PATH_HOST="${PKG_CACHE_PATH}"
export PKG_CACHE_PATH=/home/node/.pkgcache

docker run --rm -u "$(id -u)":"$(id -g)" -e IGNORE_AUDIT -e PKG_CACHE_PATH -v "${PKG_CACHE_PATH_HOST}":"${PKG_CACHE_PATH}" \
  -v "${TRAVIS_BUILD_DIR}:/build" zencash/staketool:latest /build/ci/scripts/build_alpine.sh
