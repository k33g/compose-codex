#!/bin/bash

cd ${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}

docker compose down
echo "✅ Local workspace stopped successfully."
