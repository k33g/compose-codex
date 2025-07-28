#!/bin/bash
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
mkdir -p keys

USER_NAME=openvscode-server
PRIVATE_KEY_NAME=git_repository_key
PUBLIC_KEY_NAME=git_repository_key.pub
echo "🚀 Initializing the environment..."

echo "🤗 Configuring Git $USER_NAME"
if [ -f "./workspace/.ssh/config" ]; then
    echo "🙂 Git configuration already exists"
else
    
    echo "📦 Configuring git user"

    echo "[user]" > ./workspace/.gitconfig
    echo "    email = ${GIT_USER_EMAIL}" >> ./workspace/.gitconfig
    echo "    name = ${GIT_USER_NAME}" >> ./workspace/.gitconfig
    echo "[safe]" >> ./workspace/.gitconfig
    #TODO: how to add the projects
    #echo "    directory = ./workspace/${PROJECT_NAME}" >> ./workspace/.gitconfig
    echo "[http]" >> ./workspace/.gitconfig
    echo "    postBuffer = 524288000" >> ./workspace/.gitconfig
    echo "    lowSpeedLimit = 1000" >> ./workspace/.gitconfig
    echo "    lowSpeedTime = 300" >> ./workspace/.gitconfig
    echo "[init]" >> ./workspace/.gitconfig
    echo "    defaultBranch = main" >> ./workspace/.gitconfig

    chmod 644 ./workspace/.gitconfig
    
    echo "🤗 Configuring Git"

    # ./workspace/keys maps on ./workspace/.ssh
    echo "Host $GIT_HOST" > ./keys/config
    echo "    HostName $GIT_HOST" >> ./keys/config
    echo "    User git" >> ./keys/config
    echo "    IdentityFile ~/.ssh/$PRIVATE_KEY_NAME" >> ./keys/config
    echo "    StrictHostKeyChecking no" >> ./keys/config

    chmod 600 ./keys/config

    [[ ! -z $SSH_PUBLIC_KEY  ]] &&
    echo $SSH_PUBLIC_KEY > ./keys/$PUBLIC_KEY_NAME &&
    [[ ! -z $SSH_PRIVATE_KEY  ]] &&
    echo $SSH_PRIVATE_KEY | base64 -d > ./keys/$PRIVATE_KEY_NAME &&
    chmod 600 ./keys/$PRIVATE_KEY_NAME

fi