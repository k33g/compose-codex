package config

import (
	"errors"
	"os"
)

type Config struct {
	ModelRunnerBaseUrl    string `json:"model_runner_base_url"`
	ModelRunnerChatModel  string `json:"model_runner_chat_model"`
	ModelRunnerToolsModel string `json:"model_runner_tools_model"`

	MCPHostUrl string `json:"mcp_base_url"`
}

func GetConfig() (Config, error) {

	modelRunnerBaseUrl := os.Getenv("MODEL_RUNNER_BASE_URL")

	if modelRunnerBaseUrl == "" {
		return Config{}, errors.New("MODEL_RUNNER_BASE_URL is not set")
	}
	modelRunnerChatModel := os.Getenv("MODEL_RUNNER_CHAT_MODEL")
	if modelRunnerChatModel == "" {
		return Config{}, errors.New("MODEL_RUNNER_CHAT_MODEL is not set")
	}
	modelRunnerToolsModel := os.Getenv("MODEL_RUNNER_TOOLS_MODEL")
	if modelRunnerToolsModel == "" {
		return Config{}, errors.New("MODEL_RUNNER_TOOLS_MODEL is not set")
	}
	mcpHostUrl := os.Getenv("MCP_HOST_URL")
	if mcpHostUrl == "" {
		return Config{}, errors.New("MCP_HOST_URL is not set")
	}

	return Config{
		ModelRunnerBaseUrl:    modelRunnerBaseUrl,
		ModelRunnerChatModel:  modelRunnerChatModel,
		ModelRunnerToolsModel: modelRunnerToolsModel,
		MCPHostUrl:            mcpHostUrl,
	}, nil
}
