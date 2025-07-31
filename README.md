# compose-pod-4-go

How to create a Web IDE for Golang
> 🚧 work in progress

**Create a `my.config.env` file with the above variables**:
```bash
KEY_NAME=github_perso # the name of the ssh key you want to use
GIT_USER_EMAIL="bob.morane@gmail.com" # your email
GIT_USER_NAME="bob_morane" # your github handle
GIT_HOST="github.com" # the git provider (not yet test with gitlab.com)
REPOSITORY="whales-collective/demo-go-agent.git" # the repository you want to clone
WORKSPACE_NAME="myworkspace" # the name of the workspace you want to create
PROJECTS_DIRECTORY="projects" # the directory where the workspace will be created
DOCKERFILE_NAME="runtime.Dockerfile" # the name of the Dockerfile to use
COMPOSE_FILE_NAME="compose.yml" # the name of the compose file to use
OFFLOAD_OVERRIDE_NAME="compose.offload.yml" # the name of the offload override file to use
HTTP_PORT=5555 # the port to use for the web IDE
```
> To get the list of the ssh keys available on your machine: `ls $HOME/.ssh/*` and use only the prefix of the file name (not the `.pub` extension)

Then:
- start your web IDE with `start-local-workspace.sh my.config.env`

## FAQ

> How to run the container with Docker socket access?
```bash
sudo chmod 666 /var/run/docker.sock
```