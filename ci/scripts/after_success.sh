#!/bin/bash

set -eo pipefail

# stop gpg processes
if [ "${IS_VERIFIED_TAG}" = "false" ]; then
   gpgconf -v --kill dirmngr || true
   gpgconf -v --kill gpg-agent || true
fi

