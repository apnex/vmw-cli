#!/bin/bash

for LINE in $(docker inspect -f "{{json .Config.Env }}" vmw-cli | tr "," "\n"); do
	if [[ $LINE =~ ([A-Z]+)=(.*)\" ]]; then
		echo ${BASH_REMATCH[1]} :: ${BASH_REMATCH[2]}
	fi
done
