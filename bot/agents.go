package main

import (
	"bot/agents"
	"bot/config"
	"bot/data"
	"bot/tools"
	"context"

	"github.com/openai/openai-go"
)

func GetChatAgent(ctx context.Context, name string, appConfig config.Config, contentData data.PromptData, clientEngine openai.Client) (*agents.Agent, error) {
	chatAgent, err := agents.NewAgent(ctx, name,
		agents.WithClientEngine(clientEngine),
		agents.WithParams(openai.ChatCompletionNewParams{
			Model:       appConfig.ModelRunnerChatModel,
			Temperature: openai.Opt(0.5),
			Messages: []openai.ChatCompletionMessageParamUnion{
				//openai.SystemMessage("CONTEXT:\n" ),
				openai.SystemMessage(contentData.SystemInstructions),
			},
		}),
	)
	if err != nil {
		return nil, err
	}
	return chatAgent, nil
}

func GetToolsAgent(ctx context.Context, name string, appConfig config.Config, clientEngine openai.Client, mcpClient *tools.MCPClient) (*agents.Agent, error) {
	toolsAgent, err := agents.NewAgent(ctx, name,
		agents.WithClientEngine(clientEngine),
		agents.WithParams(openai.ChatCompletionNewParams{
			Model:             appConfig.ModelRunnerToolsModel,
			Temperature:       openai.Opt(0.0),
			Messages:          []openai.ChatCompletionMessageParamUnion{},
			ParallelToolCalls: openai.Bool(false),
			Tools:             mcpClient.OpenAITools(),
		}),
	)
	if err != nil {
		return nil, err
	}
	return toolsAgent, nil
}
