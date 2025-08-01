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
# Install Python
# ------------------------------------
RUN <<EOF
apt-get update
apt-get install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update
apt-get install -y python3.9 python3.9-distutils python3.9-dev python3.9-venv
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.9
# Create symlinks
ln -sf /usr/bin/python3.9 /usr/bin/python3
ln -sf /usr/bin/python3.9 /usr/bin/python
ln -sf /usr/local/bin/pip3.9 /usr/local/bin/pip3
ln -sf /usr/local/bin/pip3.9 /usr/local/bin/pip
EOF

# Switch to the specified user
USER ${USER_NAME}

