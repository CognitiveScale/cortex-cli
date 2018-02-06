#!/bin/bash

function error_exit {
    echo "$1" >&2
    exit "${2:-1}"  ## Return a code specified by $2 or 1 by default.
}

case $1 in
	bootstrap)
		echo "Boostrapping Version[$(cat /from_ci_cd_build/version.txt)] of Cortex Executable."
		test -d /bootstrap_bin_path || error_exit "Docker volume mount to /bootstrap_bin_path required."
		cp /from_ci_cd_build/scripts/cortex /bootstrap_bin_path/cortex
	;;
	*)
		cortex $@
	;;
esac