#!/bin/bash
source $1

# Check if the configuration file exists
if [ ! -f "$1" ]; then
    echo "❌ Error: $1 file not found"
    exit 1
fi
cd ${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}

docker compose down
echo "✅ Local workspace stopped successfully."
