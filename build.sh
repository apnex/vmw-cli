#!/bin/bash
docker rmi -f apnex/vmw-cli 2>/dev/null

docker build --no-cache -t docker.io/apnex/vmw-cli https://github.com/apnex/vmw-cli.git
#docker build --no-cache -t apnex/vmw-cli:ubuntu -f docker.ubuntu .
docker rmi -f $(docker images -q --filter label=stage=intermediate)
