#!/bin/bash

set -eo pipefail

npm audit --production --json >> ./ci/scripts/report.json || true
node ./ci/scripts/audit-process.js || ( [ "$IGNORE_AUDIT" = "true" ] && true )
