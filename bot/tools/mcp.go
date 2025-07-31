package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/openai/openai-go"
)

type MCPClient struct {
	mcpclient   *client.Client
	ToolsResult *mcp.ListToolsResult
}

func NewMCPClient(ctx context.Context, mcpHostURL string) (*MCPClient, error) {
	mcpClient, err := client.NewStreamableHttpClient(
		mcpHostURL, // Use environment variable for MCP host
	)
	//defer mcpClient.Close()
	if err != nil {
		return nil, err
	}
	// Start the connection to the server
	err = mcpClient.Start(ctx)
	if err != nil {
		return nil, err
	}

	initRequest := mcp.InitializeRequest{}
	initRequest.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initRequest.Params.ClientInfo = mcp.Implementation{
		Name:    "bob",
		Version: "0.0.0",
	}
	result, err := mcpClient.Initialize(ctx, initRequest)
	if err != nil {
		return nil, err
	}
	fmt.Println("Streamable HTTP client connected & initialized with server!", result)

	toolsRequest := mcp.ListToolsRequest{}
	mcpTools, err := mcpClient.ListTools(ctx, toolsRequest)
	if err != nil {
		return nil, err
	}

	return &MCPClient{
		mcpclient:   mcpClient,
		ToolsResult: mcpTools,
	}, nil
}

func (c *MCPClient) OpenAITools() []openai.ChatCompletionToolParam {
	return convertMCPToolsToOpenAITools(c.ToolsResult)
}

func (c *MCPClient) Close() error {
	if c.mcpclient != nil {
		return c.mcpclient.Close()
	}
	return nil
}

func (c *MCPClient) CallTool(ctx context.Context, functionName string, arguments string) (*mcp.CallToolResult, error) {

	// Parse the tool arguments from JSON string
	var args map[string]any
	args, _ = JsonStringToMap(arguments)
	// TODO: check if this is useful for the request

	// NOTE: Call the MCP tool with the arguments
	request := mcp.CallToolRequest{}
	request.Params.Name = functionName
	request.Params.Arguments = args

	// NOTE: Call the tool using the MCP client
	toolResponse, err := c.mcpclient.CallTool(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("error calling tool %s: %w", functionName, err)
	}
	if toolResponse == nil || len(toolResponse.Content) == 0 {
		return nil, fmt.Errorf("no content returned from tool %s", functionName)
	}

	return toolResponse, nil
}

func convertMCPToolsToOpenAITools(tools *mcp.ListToolsResult) []openai.ChatCompletionToolParam {
	openAITools := make([]openai.ChatCompletionToolParam, len(tools.Tools))
	for i, tool := range tools.Tools {

		openAITools[i] = openai.ChatCompletionToolParam{
			Function: openai.FunctionDefinitionParam{
				Name:        tool.Name,
				Description: openai.String(tool.Description),
				Parameters: openai.FunctionParameters{
					"type":       "object",
					"properties": tool.InputSchema.Properties,
					"required":   tool.InputSchema.Required,
				},
			},
		}
	}
	return openAITools
}

func JsonStringToMap(jsonString string) (map[string]any, error) {
	var result map[string]any
	err := json.Unmarshal([]byte(jsonString), &result)
	if err != nil {
		return nil, err
	}
	return result, nil
}
