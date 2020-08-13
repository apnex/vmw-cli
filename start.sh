#!/bin/sh

function start {
	vmw-cli
}

#if [ -z "$1" ]; then
#	start "${@}"
#else
	case ${1} in
		shell)
			cat /root/vmw-cli
		;;
		complete)
			cat /root/vmw.complete
		;;
		*)
			start "${@}"
		;;
	esac
#fi
