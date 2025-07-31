#!/bin/bash
: <<'COMMENT'
Run this script to reset the workspace.
```
./reset-workspace.sh config_file.env
```
For example:
```
./reset-workspace.sh gitconfig.env
```
COMMENT

source $1

# Check if the configuration file exists
if [ ! -f "$1" ]; then
    echo "❌ Error: $1 file not found"
    exit 1
fi

rm -rf ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}
