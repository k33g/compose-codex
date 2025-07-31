#!/bin/bash
: <<'COMMENT'
This script will create a workspace directory, 
set up the necessary environment variables, and configure Git.
The script is started by the MCP server.
COMMENT

# --------------------------------------
# Initialize workspace 
# --------------------------------------

mkdir -p ${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace

cat > "${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.bashrc" << 'EOF'
sudo chmod 666 /var/run/docker.sock

parse_git_branch() {
    git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/'
}

# Prompt avec couleurs
export PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[01;31m\]$(parse_git_branch)\[\033[00m\]\$ '
EOF

echo "✅ Workspace initialized with .bashrc"

# --------------------------------------
#  Generate project.env 
# --------------------------------------


echo "SSH_PUBLIC_KEY=$(cat $HOME/.ssh/${KEY_NAME}.pub)" > project.env
echo "SSH_PRIVATE_KEY=$(cat $HOME/.ssh/${KEY_NAME} | base64 -w 0)" >> project.env
echo "GIT_USER_EMAIL=${GIT_USER_EMAIL}" >> project.env
echo "GIT_USER_NAME=${GIT_USER_NAME}" >> project.env
echo "GIT_HOST=${GIT_HOST}" >> project.env

echo "✅ project.env file created"

# --------------------------------------
# Git configuration
# --------------------------------------

# Check if project.env exists
if [ ! -f "project.env" ]; then
    echo "❌ Error: project.env file not found"
    exit 1
fi

source project.env

# Create keys directory if it doesn't exist
mkdir -p ${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/keys


USER_NAME=openvscode-server
PRIVATE_KEY_NAME=git_repository_key
PUBLIC_KEY_NAME=git_repository_key.pub
echo "🚀 Initializing the environment..."

echo "🤗 Configuring Git $USER_NAME"
if [ -f "./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.ssh/config" ]; then
    echo "🙂 Git configuration already exists"
else
    
    echo "📦 Configuring git user"

    echo "[user]" > ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig
    echo "    email = ${GIT_USER_EMAIL}" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig
    echo "    name = ${GIT_USER_NAME}" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig
    echo "[safe]" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig
    #TODO: how to add the projects
    #echo "    directory = ./workspace/${PROJECT_NAME}" >> ./workspace/.gitconfig
    echo "[http]" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig
    echo "    postBuffer = 524288000" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig
    echo "    lowSpeedLimit = 1000" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig
    echo "    lowSpeedTime = 300" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig
    echo "[init]" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig
    echo "    defaultBranch = main" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig

    chmod 644 ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace/.gitconfig
    
    echo "🤗 Configuring Git"

    # ./workspace/keys maps on ./workspace/.ssh
    echo "Host $GIT_HOST" > ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/keys/config
    echo "    HostName $GIT_HOST" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/keys/config
    echo "    User git" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/keys/config
    echo "    IdentityFile ~/.ssh/$PRIVATE_KEY_NAME" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/keys/config
    echo "    StrictHostKeyChecking no" >> ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/keys/config

    chmod 600 ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/keys/config

    # [[ ! -z $SSH_PUBLIC_KEY  ]] &&
    echo $SSH_PUBLIC_KEY > ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/keys/$PUBLIC_KEY_NAME
    # [[ ! -z $SSH_PRIVATE_KEY  ]] &&
    echo $SSH_PRIVATE_KEY | base64 -d > ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/keys/$PRIVATE_KEY_NAME
    chmod 600 ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/keys/$PRIVATE_KEY_NAME

fi

# --------------------------------------
# Clone the project repository
# --------------------------------------
cd ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/workspace
git clone git@github.com:${REPOSITORY} || {
    echo "❌ Error: Failed to clone repository ${REPOSITORY}"
    exit 1
}

echo "✅ Project ${REPOSITORY} cloned into workspace"

# --------------------------------------
# Copy Dockerfile and compose files
# --------------------------------------
cd ../../..
cp ./${DOCKERFILE_NAME} ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/Dockerfile
cp ./${COMPOSE_FILE_NAME} ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}
cp ./${OFFLOAD_OVERRIDE_NAME} ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}
echo "✅ Dockerfile and compose files copied to workspace"

echo "HTTP_PORT=${HTTP_PORT}" > ./${PROJECTS_DIRECTORY}/${WORKSPACE_NAME}/.env

# --------------------------------------
# Remove the project.env file
# --------------------------------------
rm -f project.env
echo "✅ project.env file removed"
