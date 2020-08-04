#!/bin/bash

set -eo pipefail

mkdir -p /tmp/node
export HOME=/tmp/node
OS="alpine"
npm config set script-shell "$(which bash)"
npm ci
npm run test
npm run "makebins-${OS}"
"./bin/${OS}/staketool"
"./bin/${OS}/signtxtool"
