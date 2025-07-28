#!/bin/bash

mkdir -p workspace

cat > "workspace/.bashrc" << 'EOF'
sudo chmod 666 /var/run/docker.sock

parse_git_branch() {
    git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/'
}

# Prompt avec couleurs
export PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[01;31m\]$(parse_git_branch)\[\033[00m\]\$ '
EOF

echo "Workspace initialized with .bashrc"