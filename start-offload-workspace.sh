#!/bin/bash
source $1

# Check if the configuration file exists
if [ ! -f "$1" ]; then
    echo "❌ Error: $1 file not found"
    exit 1
fi
cd ${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}
docker offload start --gpu --account docker

docker compose -f compose.yml -f compose.offload.yml up --build -d
PROJECT_NAME=$(basename "$REPOSITORY" .git)
echo "✅ Local workspace started successfully. Access it at http://localhost:${HTTP_PORT}/?folder=/home/workspace/${PROJECT_NAME}"
