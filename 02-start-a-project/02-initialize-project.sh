#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <project-name>"
    exit 1
fi

PROJECT_NAME="$1"

mkdir -p workspace
mkdir -p "workspace/$PROJECT_NAME"
mkdir -p "workspace/$PROJECT_NAME/.vscode"

cat > "workspace/$PROJECT_NAME/.vscode/settings.json" << 'EOF'
{
    "workbench.iconTheme": "material-icon-theme",
    "workbench.colorTheme": "Default Light Modern",
    "editor.fontSize": 13,
    "terminal.integrated.fontSize": 13,
    "editor.insertSpaces": true,
    "editor.tabSize": 4,
    "editor.detectIndentation": true,
    "files.autoSave": "afterDelay",
    "files.autoSaveDelay": 1000,
    "editor.fontFamily": "Menlo",
    "window.zoomLevel": 0.5
}
EOF

cat > "workspace/$PROJECT_NAME/.vscode/extensions.json" << 'EOF'
{
    "recommendations": [
        "pkief.material-icon-theme",
        "pkief.material-product-icons",
        "aaron-bond.better-comments",
        "golang.go"
    ]
}
EOF

cat > "workspace/$PROJECT_NAME/README.md" << EOF
# $PROJECT_NAME
EOF

cat > "workspace/$PROJECT_NAME/main.go" << 'EOF'
package main

import "fmt"

func main() {
    fmt.Println("Hello")
}
EOF

cat > "workspace/$PROJECT_NAME/go.mod" << EOF
module $PROJECT_NAME

go 1.24.4
EOF

echo "Project '$PROJECT_NAME' initialized with VS Code configuration, README.md, main.go, and go.mod"
