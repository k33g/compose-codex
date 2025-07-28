FROM --platform=$BUILDPLATFORM gitpod/openvscode-server:latest

LABEL maintainer="@k33g_org"

ARG TARGETOS
ARG TARGETARCH

ARG USER_NAME=openvscode-server

USER root

# ------------------------------------
# Install Tools
# ------------------------------------
RUN <<EOF
apt-get update
apt-get install -y openssh-client curl wget git fonts-powerline
EOF

# ------------------------------------
# Install Go
# ------------------------------------
ARG GO_VERSION=1.24.4

RUN <<EOF
wget https://go.dev/dl/go${GO_VERSION}.linux-${TARGETARCH}.tar.gz
tar -xzf go${GO_VERSION}.linux-${TARGETARCH}.tar.gz -C /usr/local
rm go${GO_VERSION}.linux-${TARGETARCH}.tar.gz
EOF

# Set Go environment variables
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/go"
ENV GOROOT="/usr/local/go"

RUN <<EOF
go install -v golang.org/x/tools/gopls@latest
EOF

RUN <<EOF
mkdir -p /go/pkg/mod
mkdir -p /go/bin
chown -R ${USER_NAME}:${USER_NAME} /go
EOF

RUN <<EOF
go version
go install -v golang.org/x/tools/gopls@latest
go install -v github.com/ramya-rao-a/go-outline@latest
go install -v github.com/stamblerre/gocode@v1.0.0
go install -v github.com/mgechev/revive@v1.3.2
EOF

# ------------------------------------
# Install Docker
# ------------------------------------
RUN <<EOF
# Add Docker's official GPG key:
apt-get update
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-model-plugin docker-compose-plugin
EOF

#  Add new user `${USER_NAME}` to docker group
RUN adduser ${USER_NAME} docker

RUN <<EOF
groupadd docker
usermod -aG docker ${USER_NAME}
newgrp docker
EOF

# Switch to the specified user
USER ${USER_NAME}

