# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a containerized development workspace system that creates Web IDEs for different programming languages (Go, Node.js) using Docker Compose. The project includes:

1. **MCP Server** (`main.go`) - A Model Context Protocol server that provides tools for workspace initialization
2. **Bot System** (`bot/`) - An interactive AI agent system that can create and manage development workspaces
3. **Workspace Templates** (`projects/`) - Pre-configured development environments for different languages

## Key Commands

### Development Commands
```bash
# Build and run the MCP server
go run main.go

# Run the bot system
cd bot && go run main.go

# Initialize a new workspace (requires config file)
./initialize-workspace.sh my.config.env

# Start a local workspace
./start-local-workspace.sh my.config.env

# Start with offload capability
./start-offload-workspace.sh my.config.env

# Stop workspace
./stop-workspace.sh my.config.env

# Reset workspace (removes all data)
./reset-workspace.sh my.config.env
```


## Architecture

### MCP Server (`main.go`)
- Implements Model Context Protocol server using `github.com/mark3labs/mcp-go`
- Provides `initializer_workspace` tool for creating development environments
- Runs HTTP server on configurable port (default 9090)
- Accepts workspace configuration parameters (SSH keys, Git settings, Docker settings)

### Bot System (`bot/`)
- **Main Entry** (`bot/main.go`) - Interactive CLI bot using OpenAI API
- **Agents** (`bot/agents/`) - Chat and tools detection agents
- **Config** (`bot/config/`) - Configuration management for model endpoints
- **Tools** (`bot/tools/`) - MCP client integration for tool execution
- **UI** (`bot/ui/`) - Terminal UI components using Charm bracelet libraries

### Workspace System
- **Templates**: Language-specific Dockerfiles (`golang.Dockerfile`, `nodejs.Dockerfile`)
- **Compose Files**: Docker Compose configurations with model integration
- **Initialization**: Automated Git setup, SSH key management, and project cloning
- **SSH Integration**: Manages SSH keys for Git repository access

## Configuration

### Environment Configuration
Create a `my.config.env` file with:
```env
KEY_NAME=github_perso                           # SSH key name (without .pub extension)
GIT_USER_EMAIL=user@example.com                # Git user email
GIT_USER_NAME=username                          # Git username
GIT_HOST=github.com                             # Git host
REPOSITORY=owner/repo.git                       # Repository to clone
WORKSPACE_NAME=workspace-name                   # Workspace directory name
PROJECTS_DIRECTORY=projects                     # Base projects directory
DOCKERFILE_NAME=golang.Dockerfile               # Dockerfile to use
COMPOSE_FILE_NAME=compose.yml                   # Compose file to use
OFFLOAD_OVERRIDE_NAME=compose.offload.yml       # Offload override file
HTTP_PORT=5555                                  # Web IDE port
```

### Bot Configuration
The bot system requires environment variables for:
- `MODEL_RUNNER_BASE_URL` - Base URL for the model API
- `MODEL_RUNNER_CHAT_MODEL` - Chat model name
- `MODEL_RUNNER_TOOLS_MODEL` - Tools model name
- `MCP_HOST_URL` - MCP server URL

## Workspace Lifecycle

1. **Initialization** (`initialize-workspace.sh`):
   - Creates workspace directory structure
   - Sets up Git configuration and SSH keys
   - Clones target repository
   - Copies Docker configuration files

2. **Start** (`start-local-workspace.sh`):
   - Runs Docker Compose to start Web IDE
   - Provides access URL with workspace path

3. **Management**: 
   - Web IDE accessible at `http://localhost:{HTTP_PORT}/?folder=/home/workspace/{PROJECT_NAME}`
   - Docker socket mounted for container operations within workspace
   - SSH keys mounted for Git operations

## Development Notes

- **Go Version**: Requires Go 1.24.0+
- **Docker**: Requires Docker with socket access (`/var/run/docker.sock`)
- **SSH Keys**: Must exist in `~/.ssh/` directory
- **Git Integration**: Automatic Git configuration with safe directory settings
- **Model Integration**: Supports local model runners via configurable endpoints

## File Structure Patterns

- `projects/{language}-workspace/` - Language-specific workspace templates
- `bot/` - All bot-related Go modules
- `tickets/` - Development tasks and feature requests
- Docker files follow pattern: `{language}.Dockerfile`