#!/bin/bash
CNAME='apnex/vmw-cli'
docker rm -f ${CNAME} 2>/dev/null
docker rm -v $(docker ps -qa -f name=${CNAME} -f status=exited) 2>/dev/null
docker rmi -f ${CNAME} 2>/dev/null

docker build --no-cache -t docker.io/apnex/vmw-cli https://github.com/apnex/vmw-cli.git
#docker build --no-cache -t docker.io/apnex/vmw-cli -f dockerfile .
docker rmi -f $(docker images -q --filter label=stage=intermediate)
