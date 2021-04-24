#!/bin/bash

set -eo pipefail

# for best formatting on github set the console width to 133
gh_cols="133"
orig_cols="$(stty size | cut -d ' ' -f 2)"
stty cols $gh_cols

SCRIPTPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
ROOTFOLDER="$(readlink -f "${SCRIPTPATH}/../../")"
USAGEFILE="${ROOTFOLDER}/USAGE.md"

# $1 = executable, $2 = args(csv)
generate_usage () {
  local binary="${ROOTFOLDER}/bin/linux/$1"
  local args=()
  while read -rd,; do
    args+=("$REPLY")
  done <<< "${2},"
  if [ ! -f "${binary}" ]; then
    cd "${ROOTFOLDER}"
    npm run makebins-linux > /dev/null 2>&1
  fi
  cd "${ROOTFOLDER}/bin/linux"
  echo "## $(basename "${binary}")"
  echo "\`\`\`"
  for arg in "${args[@]}"; do
    echo -e "\n\$ ./$(basename "${binary}") ${arg}"
    "${binary}" ${arg}
  done
  echo  "\`\`\`"
}

echo "# USAGE" > "${USAGEFILE}"
generate_usage staketool "help,help createstakeverification,help sendtxandstakeverification,help cancelstakeverification,help liststakes,help getbalance,help help" |
  sed -r "s/\x1B\[([0-9]{1,3}(;[0-9]{1,2})?)?[mGK]//g" >> "${USAGEFILE}"
generate_usage signtxtool "help,help signverificationtransaction,help keysfromseed,help help" |
  sed -r "s/\x1B\[([0-9]{1,3}(;[0-9]{1,2})?)?[mGK]//g" >> "${USAGEFILE}"

# restore original tty size
stty cols $orig_cols
reset -w
