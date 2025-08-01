FROM golang:1.24-alpine AS builder
ENV CGO_ENABLED=0
WORKDIR /backend
COPY backend/go.* .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download
COPY backend/. .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -ldflags="-s -w" -o bin/service

FROM alpine AS client-builder
WORKDIR /ui
# copy ui files
COPY ui /ui

FROM alpine
LABEL org.opencontainers.image.title="Compose Codex" \
    org.opencontainers.image.description="Spawn web IDE in a glitch" \
    org.opencontainers.image.vendor="@k33g_org" \
    com.docker.desktop.extension.api.version="0.4.2" \
    com.docker.extension.screenshots="" \
    com.docker.desktop.extension.icon="" \
    com.docker.extension.detailed-description="" \
    com.docker.extension.publisher-url="" \
    com.docker.extension.additional-urls="" \
    com.docker.extension.categories="" \
    com.docker.extension.changelog=""

COPY --from=builder /backend/bin/service /
COPY docker-compose.yaml .
COPY metadata.json .
COPY docker.svg .
COPY --from=client-builder /ui ui
CMD ["/service", "-socket", "/run/guest-services/backend.sock"]
