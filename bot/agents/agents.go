package agents

import (
	"context"
	"errors"

	"github.com/openai/openai-go"
)

type Agent struct {
	ctx    context.Context
	client openai.Client
	Params openai.ChatCompletionNewParams
	Name   string
	Avatar string
	Color  string // used for UI display

	// TODO: handle this for every option
	errors []error // to store errors that occur during operations
}

type AgentOption func(*Agent)

func NewAgent(ctx context.Context, name string, options ...AgentOption) (*Agent, error) {

	agent := &Agent{}
	agent.Name = name
	agent.ctx = ctx
	// Apply all options
	for _, option := range options {
		option(agent)
	}

	return agent, nil
}

func WithClientEngine(client openai.Client) AgentOption {
	return func(a *Agent) {
		a.client = client
	}
}

func WithParams(params openai.ChatCompletionNewParams) AgentOption {
	return func(a *Agent) {
		a.Params = params
	}
}

// ChatCompletion handles the chat completion request using the DMR client.
// It sends the parameters set in the Agent and returns the response content or an error.
// It is a synchronous operation that waits for the completion to finish.
func (agent *Agent) ChatCompletion() (string, error) {
	completion, err := agent.client.Chat.Completions.New(agent.ctx, agent.Params)

	if err != nil {
		return "", err
	}

	if len(completion.Choices) > 0 {
		return completion.Choices[0].Message.Content, nil
	} else {
		return "", errors.New("no choices found")

	}
}

// ChatCompletionStream handles the chat completion request using the DMR client in a streaming manner.
// It takes a callback function that is called for each chunk of content received.
// The callback function receives the Agent instance, the content of the chunk, and any error that occurred.
// It returns the accumulated response content and any error that occurred during the streaming process.
// The callback function should return an error if it wants to stop the streaming process.
func (agent *Agent) ChatCompletionStream(callBack func(self *Agent, content string, err error) error) (string, error) {
	response := ""
	stream := agent.client.Chat.Completions.NewStreaming(agent.ctx, agent.Params)
	var cbkRes error

	for stream.Next() {
		chunk := stream.Current()
		// Stream each chunk as it arrives
		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			cbkRes = callBack(agent, chunk.Choices[0].Delta.Content, nil)
			response += chunk.Choices[0].Delta.Content
		}

		if cbkRes != nil {
			break
		}
	}
	if cbkRes != nil {
		return response, cbkRes
	}
	if err := stream.Err(); err != nil {
		return response, err
	}
	if err := stream.Close(); err != nil {
		return response, err
	}

	return response, nil
}

// ToolsCompletion handles the tool calls completion request using the DMR client.
// It sends the parameters set in the Agent and returns the detected tool calls or an error.
// It is a synchronous operation that waits for the completion to finish.
func (agent *Agent) ToolsCompletion() ([]openai.ChatCompletionMessageToolCall, error) {

	completion, err := agent.client.Chat.Completions.New(agent.ctx, agent.Params)
	if err != nil {
		return nil, err
	}
	detectedToolCalls := completion.Choices[0].Message.ToolCalls
	if len(detectedToolCalls) == 0 {
		return nil, errors.New("no tool calls detected")
	}
	return detectedToolCalls, nil
}
