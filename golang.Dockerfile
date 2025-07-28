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
mkdir -p /go/pkg/mod
mkdir -p /go/bin
chown -R ${USER_NAME}:${USER_NAME} /go
EOF

# Switch to the specified user
USER ${USER_NAME}

