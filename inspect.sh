#!/bin/bash

## list local env variables to be passed to container here
LENV=()
LENV+=("VMWUSER")
LENV+=("VMWPASS")

## get container env variable
CENV=$(docker inspect -f "{{json .Config.Env }}" vmw-cli | tr "," "\n")

## return specific container env value
cget() {
	for ITEM in ${CENV[@]}; do
		if [[ ${ITEM} =~ ([0-9a-zA-Z]+)=(.*)\" ]]; then
			if [[ "${BASH_REMATCH[1]}" == "${1}" ]]; then
				printf "${BASH_REMATCH[2]}"
			fi
		fi
	done
}

## compare defined local values against container
lget() {
	local PASS=1
	for ITEM in ${LENV[@]}; do
		local LVAL=${!ITEM}
		local CVAL=$(cget ${ITEM})
		if [[ -n ${LVAL} && ${LVAL} != ${CVAL} ]]; then
			PASS=0
		fi
		echo "LVAL: ${LVAL} >> CVAL: ${CVAL}" 1>&2
	done
	printf ${PASS}
}

if [[ $(lget) == 0 ]]; then
	echo "MATCH FAILED, RESTART CONTAINER"
fi
