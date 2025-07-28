#!/bin/bash
docker offload start --gpu --account docker

docker compose -f compose.yml -f compose.offload.yml up --build
