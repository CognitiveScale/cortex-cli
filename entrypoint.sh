#!/bin/bash

function error_exit {
    echo "$1" >&2
    exit "${2:-1}"  ## Return a code specified by $2 or 1 by default.
}

case $1 in
	bootstrap)
		VERSION=$(cat /from_ci_cd_build/version.txt)
		>&2 echo "Boostrapping Version[${VERSION}] of Cortex Executable."
		cat /from_ci_cd_build/scripts/cortex | sed "s/<<VERSION>>/${VERSION}/g"
	;;
	*)
		cortex $@
	;;
esac