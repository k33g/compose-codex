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
# Install NodeJS
# ------------------------------------
ARG NODE_MAJOR=22

RUN <<EOF
apt-get update && apt-get install -y ca-certificates curl gnupg
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update && apt-get install nodejs -y
EOF

# Switch to the specified user
USER ${USER_NAME}
