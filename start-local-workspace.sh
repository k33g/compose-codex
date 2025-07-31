#!/bin/bash

cd ${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}
docker offload stop --force
docker compose -f compose.yml up --build -d
PROJECT_NAME=$(basename "$REPOSITORY" .git)
echo "✅ Local workspace started successfully. Access it at http://localhost:${HTTP_PORT}/?folder=/home/workspace/${PROJECT_NAME}"
