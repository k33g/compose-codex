#!/bin/bash
docker offload stop --force
docker compose -f compose.yml up --build