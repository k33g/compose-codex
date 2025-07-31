#!/bin/bash
MODEL_RUNNER_BASE_URL=http://localhost:12434/engines/llama.cpp/v1 \
MODEL_RUNNER_CHAT_MODEL=hf.co/menlo/lucy-128k-gguf:q4_k_m \
MODEL_RUNNER_TOOLS_MODEL=hf.co/menlo/lucy-128k-gguf:q4_k_m \
MCP_HOST_URL=http://localhost:9090/mcp  \
go run agents.go main.go
