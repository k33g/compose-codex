# compose-pod-4-go

How to create a Web IDE for Golang + DMR Support

## 1. build the image

The `01-build-image` directory contains the Dockerfile and the `docker-bake.hcl` file to build the image.

```bash
cd 01-build-image
docker buildx bake --push --file docker-bake.hcl
```

## 2. start a project

### Git configuration



> Create a `.env` file with the above variables:
```bash
echo "SSH_PUBLIC_KEY=$(cat $HOME/.ssh/id_ed25519.pub)" > project.env
echo "SSH_PRIVATE_KEY=$(cat $HOME/.ssh/id_ed25519 | base64 -w 0)" >> project.env
```

```bash
SSH_PUBLIC_KEY="ssh-ed25519 ... your.name@gmail.com"
SSH_PRIVATE_KEY="LS0t ..."
GIT_USER_EMAIL="your.name@gmail.com"
GIT_USER_NAME="k33g"
GIT_HOST="github.com"
PROJECT_NAME="bob-agent"
```

if the repository already exists on GitHub:
```bash
git init
git add .
git commit -m "first commit"
git remote add origin git@github.com:k33g/my-little-demo.git
git push -u origin main
```

## FAQ

> How to run the container with Docker socket access?
```bash
sudo chmod 666 /var/run/docker.sock
```