package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/charmbracelet/huh"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"

	"bot/agents"
	"bot/config"
	"bot/data"
	"bot/tools"
	"bot/ui"
)

func main() {

	appConfig, err := config.GetConfig()
	if err != nil {
		panic(err)
	}

	ui.Println(ui.Blue, strings.Repeat("=", 80))
	ui.Println(ui.Blue, "Model Runner Base URL:", appConfig.ModelRunnerBaseUrl)
	ui.Println(ui.Blue, "Model Runner Chat Model:", appConfig.ModelRunnerChatModel)
	ui.Println(ui.Blue, "Model Runner Tools Model:", appConfig.ModelRunnerToolsModel)
	ui.Println(ui.Blue, "MCP Host URL:", appConfig.MCPHostUrl)

	ui.Println(ui.Blue, strings.Repeat("=", 80))

	contentData, err := data.GetPromptData()
	if err != nil {
		panic(err)
	}

	ctx := context.Background()

	clientEngine := openai.NewClient(
		option.WithBaseURL(appConfig.ModelRunnerBaseUrl),
		option.WithAPIKey(""),
	)

	// --- [CHAT AGENT] ---
	chatAgent, err := GetChatAgent(ctx, "DM Chat Agent", appConfig, contentData, clientEngine)
	if err != nil {
		fmt.Println("😡 Failed to create chat agent:", err)
		panic(err)
	}

	// --- [MCP CLIENT] ---
	mcpClient, err := tools.NewMCPClient(ctx, appConfig.MCPHostUrl)
	if err != nil {
		fmt.Println("😡 Failed to create MCP client:", err)
		panic(err)
	}

	// --- [TOOLS AGENT] ---
	toolsAgent, err := GetToolsAgent(ctx, "DM Tools Agent", appConfig, clientEngine, mcpClient)
	if err != nil {
		fmt.Println("😡 Failed to create tools agent:", err)
		panic(err)
	}

	promptConfig := ui.PromptConfig{
		StartingMessage:       "🐙 hello, I'm here to improve your DX",
		ExplanationMessage:    "Type '/bye' to quit.",
		PromptTitle:           "✋ Query",
		ThinkingPrompt:        "⏳",
		InterruptInstructions: "(Press Ctrl+C to interrupt)",
		GoodbyeMessage:        "👋 Bye!",
	}

	//reader := bufio.NewScanner(os.Stdin)
	fmt.Println(promptConfig.StartingMessage)
	fmt.Println(promptConfig.ExplanationMessage)

	for {
		fmt.Print(promptConfig.ThinkingPrompt)
		fmt.Println(promptConfig.InterruptInstructions)

		var userInput string

		form := huh.NewForm(
			huh.NewGroup(
				huh.NewText().
					Title(promptConfig.PromptTitle).
					Placeholder("Type your question here...").
					Value(&userInput).
					ExternalEditor(false),
			),
		)

		// Run the form
		err := form.Run()
		if err != nil {
			// TODO: handle error
		}

		// Trim whitespace
		userInput = strings.TrimSpace(userInput)

		// Check for empty input
		if userInput == "" {
			continue
		}

		// Check for /bye command
		if userInput == "/bye" {
			fmt.Println(promptConfig.GoodbyeMessage)
			break
		}

		// [TOOLS DETECTION]
		fmt.Println("🚀 Starting tools detection...")
		toolsAgent.Params.Messages = []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(contentData.SystemToolsInstructions),
			openai.UserMessage(userInput),
		}

		// [TOOLS COMPLETION]
		fmt.Println("⏳ Running tools completion...")
		detectedToolCalls, err := toolsAgent.ToolsCompletion()

		//completion, err := clientEngine.Chat.Completions.New(ctx, toolsCompletionParams)
		if err != nil {
			fmt.Printf("😡 Tools completion error: %v\n", err)
			continue
		}

		fmt.Println("🛠️ Tools completion received")
		//detectedToolCalls := completion.Choices[0].Message.ToolCalls

		firstCompletionResult := ""
		// Return early if there are no tool calls
		if len(detectedToolCalls) == 0 {
			fmt.Println("✋ No function call")
			fmt.Println()
			//continue
		} else {
			// [TOOL CALLS]

			for _, toolCall := range detectedToolCalls {

				fmt.Println("💡 tool detection:", toolCall.Function.Name, toolCall.Function.Arguments)
				// NOTE: Call the tool using the MCP client
				toolResponse, err := mcpClient.CallTool(ctx, toolCall.Function.Name, toolCall.Function.Arguments)

				if err != nil {
					fmt.Println("😡 Error calling tool:", err)
					continue
				} else {
					if toolResponse != nil && len(toolResponse.Content) > 0 {
						result := toolResponse.Content[0].(mcp.TextContent).Text
						fmt.Printf("✅ Tool %s executed successfully, result: %s\n", toolCall.Function.Name, result)
						firstCompletionResult += result + "\n"
					}
				}
			}

			fmt.Println("🎉 Tools calls executed!")
		}

		fmt.Println("🤖 Starting chat completion...")
		fmt.Println(strings.Repeat("=", 80))

		// [CHAT COMPLETION]
		chatAgent.Params.Messages = append(chatAgent.Params.Messages,
			openai.SystemMessage(firstCompletionResult), // NOTE: could be empty
			openai.SystemMessage(contentData.SystemToolsInstructionsForChat),
			openai.UserMessage(userInput),
		)

		_, errStream := chatAgent.ChatCompletionStream(func(self *agents.Agent, content string, err error) error {
			fmt.Print(content)
			return nil
		})
		if errStream != nil {
			fmt.Printf("😡 Chat completion error: %v\n", errStream)
		}

		fmt.Println("\n" + strings.Repeat("=", 80))
		fmt.Println()
	}

}
