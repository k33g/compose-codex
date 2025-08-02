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

ARG GO_VERSION=1.24.4
ARG TINYGO_VERSION=0.37.0
ARG EXTISM_VERSION=1.6.2 

# ------------------------------------
# Install Go
# ------------------------------------
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

# ------------------------------------
# Install TinyGo
# ------------------------------------
RUN <<EOF
wget https://github.com/tinygo-org/tinygo/releases/download/v${TINYGO_VERSION}/tinygo_${TINYGO_VERSION}_${TARGETARCH}.deb
dpkg -i tinygo_${TINYGO_VERSION}_${TARGETARCH}.deb
rm tinygo_${TINYGO_VERSION}_${TARGETARCH}.deb
EOF

# ------------------------------------
# Install Extism CLI
# ------------------------------------
RUN <<EOF
wget https://github.com/extism/cli/releases/download/v${EXTISM_VERSION}/extism-v${EXTISM_VERSION}-linux-${TARGETARCH}.tar.gz
    
tar -xf extism-v${EXTISM_VERSION}-linux-${TARGETARCH}.tar.gz -C /usr/bin
rm extism-v${EXTISM_VERSION}-linux-${TARGETARCH}.tar.gz
    
#extism --version
EOF

# Switch to the specified user
USER ${USER_NAME}

