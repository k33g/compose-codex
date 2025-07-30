# compose-pod-4-go

How to create a Web IDE for Golang
> 🚧 work in progress

**Create a `gitconfig.env` file with the above variables**:
```bash
KEY_NAME=github_perso # the name of the ssh key you want to use
GIT_USER_EMAIL="bob.morane@gmail.com" # your email
GIT_USER_NAME="bob_morane" # your github handle
GIT_HOST="github.com" # the git provider (not yet test with gitlab.com)
REPOSITORY="whales-collective/demo-go-agent.git" # the repository you want to clone
```
> To get the list of the keys available on your machine: `ls $HOME/.ssh/*` and use only the prefix of the file name (not the `.pub` extension)

Then:
- start your web IDE with `start-local-workspace.sh`

## FAQ

> How to run the container with Docker socket access?
```bash
sudo chmod 666 /var/run/docker.sock
```