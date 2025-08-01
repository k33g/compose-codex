package main

import (
	"compose-codex/agents"
	"compose-codex/data"
	"compose-codex/tools"
	"path/filepath"

	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/openai/openai-go"
	"github.com/sirupsen/logrus"
	"honnef.co/go/tools/config"
)

var logger = logrus.New()
var mcpCtx = context.Background()

func main() {

	var socketPath string
	flag.StringVar(&socketPath, "socket", "/run/guest-services/backend.sock", "Unix domain socket to listen on")
	flag.Parse()

	_ = os.RemoveAll(socketPath)

	logger.SetOutput(os.Stdout)

	logMiddleware := middleware.LoggerWithConfig(middleware.LoggerConfig{
		Skipper: middleware.DefaultSkipper,
		Format: `{"time":"${time_rfc3339_nano}","id":"${id}",` +
			`"method":"${method}","uri":"${uri}",` +
			`"status":${status},"error":"${error}"` +
			`}` + "\n",
		CustomTimeFormat: "2006-01-02 15:04:05.00000",
		Output:           logger.Writer(),
	})

	logger.Infof("Starting listening on %s\n", socketPath)
	router := echo.New()
	router.HideBanner = true
	router.Use(logMiddleware)
	startURL := ""

	ln, err := listen(socketPath)
	if err != nil {
		logger.Fatal(err)
	}
	router.Listener = ln

	router.GET("/hello", hello)
	router.POST("/workspace/initialize", configHandler)
	router.POST("/workspace/start", startWorkspaceHandler)
	router.POST("/workspace/stop", stopWorkspaceHandler)
	router.POST("/workspace/remove", removeWorkspaceHandler)
	router.POST("/workspace/dockerfiles/list", dockerfilesListHandler)
	router.POST("/workspace/list", workspacesListHandler)
	router.POST("/chat", chatHandler)

	logger.Fatal(router.Start(startURL))
}

func listen(path string) (net.Listener, error) {
	return net.Listen("unix", path)
}

func hello(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, HTTPMessageBody{Message: "👋 hello world 🌍 🙂"})
}

func configHandler(ctx echo.Context) error {
	var config ConfigPayload
	if err := ctx.Bind(&config); err != nil {
		logger.Errorf("Failed to bind config payload: %v", err)
		return ctx.JSON(http.StatusBadRequest, HTTPMessageBody{Message: "Invalid JSON payload"})
	}

	// --- [MCP CLIENT] ---
	mcpClient, err := tools.NewMCPClient(mcpCtx, config.MCPServerURL)
	if err != nil {
		logger.Errorf("Failed to create MCP client: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to create MCP client"})
	}

	// Create jsonStringArguments with the specific format required (http_port as string)
	configMap := map[string]interface{}{
		"compose_file_name":     config.ComposeFileName,
		"dockerfile_name":       config.DockerfileName,
		"git_host":              config.GitHost,
		"git_user_email":        config.GitUserEmail,
		"git_user_name":         config.GitUserName,
		"http_port":             fmt.Sprintf("%d", config.HTTPPort), // Convert to string
		"key_name":              config.KeyName,
		"offload_override_name": config.OffloadOverride,
		"projects_directory":    config.ProjectsDirectory,
		"repository":            config.Repository,
		"workspace_name":        config.WorkspaceName,
	}

	jsonStringArguments, err := json.Marshal(configMap)
	if err != nil {
		logger.Errorf("Failed to marshal config to JSON: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to marshal config to JSON"})
	}

	toolResponse, err := mcpClient.CallTool(mcpCtx, "initializer_workspace", string(jsonStringArguments))
	if err != nil {
		logger.Errorf("Failed to call MCP tool: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to call MCP tool"})
	}
	if toolResponse == nil || len(toolResponse.Content) == 0 {
		logger.Error("No content returned from MCP tool")
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "No content returned from MCP tool"})
	}

	logger.Infof("🟢 Received config: %+v", config)
	logger.Infof("🟠 Received toolResponse: %+v", toolResponse)

	// Process the config here (placeholder for actual implementation)
	response := ConfigResponse{
		Status:  "success",
		Message: "Configuration received and processed",
		Config:  config,
	}

	return ctx.JSON(http.StatusOK, response)
}

func startWorkspaceHandler(ctx echo.Context) error {
	var config ConfigPayload
	if err := ctx.Bind(&config); err != nil {
		logger.Errorf("Failed to bind config payload for start workspace: %v", err)
		return ctx.JSON(http.StatusBadRequest, HTTPMessageBody{Message: "Invalid JSON payload"})
	}

	logger.Infof("Starting workspace with config: %+v", config)

	// --- [MCP CLIENT] ---
	mcpClient, err := tools.NewMCPClient(mcpCtx, config.MCPServerURL)
	if err != nil {
		logger.Errorf("Failed to create MCP client: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to create MCP client"})
	}

	// Create jsonStringArguments with the specific format required (http_port as string)
	configMap := map[string]interface{}{
		"http_port":          fmt.Sprintf("%d", config.HTTPPort), // Convert to string
		"projects_directory": config.ProjectsDirectory,
		"repository":         config.Repository,
		"workspace_name":     config.WorkspaceName,
	}

	jsonStringArguments, err := json.Marshal(configMap)
	if err != nil {
		logger.Errorf("Failed to marshal config to JSON: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to marshal config to JSON"})
	}

	toolResponse, err := mcpClient.CallTool(mcpCtx, "start_workspace", string(jsonStringArguments))
	if err != nil {
		logger.Errorf("Failed to call MCP tool: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to call MCP tool"})
	}
	if toolResponse == nil || len(toolResponse.Content) == 0 {
		logger.Error("No content returned from MCP tool")
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "No content returned from MCP tool"})
	}

	logger.Infof("🟢 Received config: %+v", config)
	logger.Infof("🟠 Received toolResponse: %+v", toolResponse)

	projectName := strings.TrimSuffix(filepath.Base(config.Repository), ".git")

	response := WorkspaceResponse{
		Status:    "success",
		Message:   "Workspace started successfully",
		Config:    config,
		Action:    "start",
		AccessURL: fmt.Sprintf("http://localhost:%d/?folder=/home/workspace/%s", config.HTTPPort, projectName),
	}

	return ctx.JSON(http.StatusOK, response)
}

func stopWorkspaceHandler(ctx echo.Context) error {
	var config ConfigPayload
	if err := ctx.Bind(&config); err != nil {
		logger.Errorf("Failed to bind config payload for stop workspace: %v", err)
		return ctx.JSON(http.StatusBadRequest, HTTPMessageBody{Message: "Invalid JSON payload"})
	}

	logger.Infof("Stopping workspace with config: %+v", config)

	// --- [MCP CLIENT] ---
	mcpClient, err := tools.NewMCPClient(mcpCtx, config.MCPServerURL)
	if err != nil {
		logger.Errorf("Failed to create MCP client: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to create MCP client"})
	}

	// Create jsonStringArguments with the specific format required (http_port as string)
	configMap := map[string]interface{}{
		"projects_directory": config.ProjectsDirectory,
		"workspace_name":     config.WorkspaceName,
	}

	jsonStringArguments, err := json.Marshal(configMap)
	if err != nil {
		logger.Errorf("Failed to marshal config to JSON: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to marshal config to JSON"})
	}

	toolResponse, err := mcpClient.CallTool(mcpCtx, "stop_workspace", string(jsonStringArguments))
	if err != nil {
		logger.Errorf("Failed to call MCP tool: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to call MCP tool"})
	}
	if toolResponse == nil || len(toolResponse.Content) == 0 {
		logger.Error("No content returned from MCP tool")
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "No content returned from MCP tool"})
	}

	logger.Infof("🟢 Received config: %+v", config)
	logger.Infof("🟠 Received toolResponse: %+v", toolResponse)

	response := WorkspaceResponse{
		Status:  "success",
		Message: "Workspace stopped successfully",
		Config:  config,
		Action:  "stop",
	}

	return ctx.JSON(http.StatusOK, response)
}

func removeWorkspaceHandler(ctx echo.Context) error {
	var config ConfigPayload
	if err := ctx.Bind(&config); err != nil {
		logger.Errorf("Failed to bind config payload for remove workspace: %v", err)
		return ctx.JSON(http.StatusBadRequest, HTTPMessageBody{Message: "Invalid JSON payload"})
	}

	logger.Infof("Removing workspace with config: %+v", config)

	// --- [MCP CLIENT] ---
	mcpClient, err := tools.NewMCPClient(mcpCtx, config.MCPServerURL)
	if err != nil {
		logger.Errorf("Failed to create MCP client: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to create MCP client"})
	}

	// Create jsonStringArguments with the specific format required
	configMap := map[string]interface{}{
		"projects_directory": config.ProjectsDirectory,
		"workspace_name":     config.WorkspaceName,
	}

	jsonStringArguments, err := json.Marshal(configMap)
	if err != nil {
		logger.Errorf("Failed to marshal config to JSON: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to marshal config to JSON"})
	}

	toolResponse, err := mcpClient.CallTool(mcpCtx, "remove_workspace", string(jsonStringArguments))
	if err != nil {
		logger.Errorf("Failed to call MCP tool: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to call MCP tool"})
	}
	if toolResponse == nil || len(toolResponse.Content) == 0 {
		logger.Error("No content returned from MCP tool")
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "No content returned from MCP tool"})
	}

	logger.Infof("🟢 Received config: %+v", config)
	logger.Infof("🟠 Received toolResponse: %+v", toolResponse)

	response := WorkspaceResponse{
		Status:  "success",
		Message: "Workspace removed successfully",
		Config:  config,
		Action:  "remove",
	}

	return ctx.JSON(http.StatusOK, response)
}

func chatHandler(ctx echo.Context) error {
	var chatRequest ChatRequest
	if err := ctx.Bind(&chatRequest); err != nil {
		logger.Errorf("Failed to bind chat request: %v", err)
		return ctx.JSON(http.StatusBadRequest, HTTPMessageBody{Message: "Invalid JSON payload"})
	}

	logger.Infof("Received chat question: %s", chatRequest.Question)

	// TODO: Implement actual chat/AI logic here
	// This could integrate with OpenAI, Claude, or other AI services
	// For now, return a placeholder response based on the question

	var responseText string
	question := strings.ToLower(chatRequest.Question)

	if strings.Contains(question, "workspace") || strings.Contains(question, "docker") {
		responseText = "I can help you with workspace management! You can create, start, and stop development workspaces using Docker Compose. What specific workspace task would you like help with?"
	} else if strings.Contains(question, "help") {
		responseText = "I'm here to help with Compose Codex! You can:\n- Create development workspaces\n- Start and stop workspaces\n- Configure workspace settings\n- Get help with Docker and development environments"
	} else {
		responseText = fmt.Sprintf("Thanks for your question: '%s'. This is a placeholder response. In the future, this will be powered by an AI assistant to help with workspace management and development tasks.", chatRequest.Question)
	}

	response := ChatResponse{
		Question: chatRequest.Question,
		Answer:   responseText,
		Status:   "success",
	}

	return ctx.JSON(http.StatusOK, response)
}

func dockerfilesListHandler(ctx echo.Context) error {
	var config ConfigPayload
	if err := ctx.Bind(&config); err != nil {
		logger.Errorf("Failed to bind config payload for dockerfiles list: %v", err)
		return ctx.JSON(http.StatusBadRequest, HTTPMessageBody{Message: "Invalid JSON payload"})
	}

	// --- [MCP CLIENT] ---
	mcpClient, err := tools.NewMCPClient(mcpCtx, config.MCPServerURL)
	if err != nil {
		logger.Errorf("Failed to create MCP client: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to create MCP client"})
	}

	// Call the get_dockerfiles_list MCP tool (no arguments needed)
	toolResponse, err := mcpClient.CallTool(mcpCtx, "get_dockerfiles_list", "")
	if err != nil {
		logger.Errorf("Failed to call get_dockerfiles_list MCP tool: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to get Dockerfiles list"})
	}
	if toolResponse == nil || len(toolResponse.Content) == 0 {
		logger.Error("No content returned from get_dockerfiles_list MCP tool")
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "No content returned from MCP tool"})
	}

	//logger.Infof("🟢 Dockerfiles list response: %+v", toolResponse)
	/*
		&{Result:{Meta:map[]} Content:[{Annotated:{Annotations:<nil>} Type:text Text:[\"golang.Dockerfile\",\"nodejs.Dockerfile\"]}] StructuredContent:<nil> IsError:false}"
	*/
	dockerFilesList := toolResponse.Content[0].(mcp.TextContent).Text
	logger.Infof("🐳 Dockerfiles list: %v", dockerFilesList)

	response := DockerfilesListResponse{
		Status:      "success",
		Message:     "Dockerfiles list retrieved successfully",
		Dockerfiles: dockerFilesList,
	}

	return ctx.JSON(http.StatusOK, response)
}

func workspacesListHandler(ctx echo.Context) error {
	var request WorkspaceListRequest
	if err := ctx.Bind(&request); err != nil {
		logger.Errorf("Failed to bind workspace list request: %v", err)
		return ctx.JSON(http.StatusBadRequest, HTTPMessageBody{Message: "Invalid JSON payload"})
	}

	if request.ProjectsDirectory == "" {
		return ctx.JSON(http.StatusBadRequest, HTTPMessageBody{Message: "projects_directory is required"})
	}

	// --- [MCP CLIENT] ---
	mcpClient, err := tools.NewMCPClient(mcpCtx, "http://host.docker.internal:9090/mcp")
	if err != nil {
		logger.Errorf("Failed to create MCP client: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to create MCP client"})
	}

	// Create arguments for get_workspaces_list MCP tool
	argsMap := map[string]interface{}{
		"projects_directory": request.ProjectsDirectory,
	}

	jsonStringArguments, err := json.Marshal(argsMap)
	if err != nil {
		logger.Errorf("Failed to marshal workspace list args to JSON: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to marshal arguments"})
	}

	// Call the get_workspaces_list MCP tool
	toolResponse, err := mcpClient.CallTool(mcpCtx, "get_workspaces_list", string(jsonStringArguments))
	if err != nil {
		logger.Errorf("Failed to call get_workspaces_list MCP tool: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to get workspaces list"})
	}
	if toolResponse == nil || len(toolResponse.Content) == 0 {
		logger.Error("No content returned from get_workspaces_list MCP tool")
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "No content returned from MCP tool"})
	}

	logger.Infof("🟢 Workspaces list response: %+v", toolResponse)

	// Return the response from MCP tool
	jsonResponse, err := json.Marshal(toolResponse.Content[0])
	if err != nil {
		logger.Errorf("Failed to marshal Dockerfiles list response: %v", err)
		return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: "Failed to marshal response"})
	}

	// Return the response from MCP tool
	response := WorkspacesListResponse{
		Status:            "success",
		Message:           "Workspaces list retrieved successfully",
		ProjectsDirectory: request.ProjectsDirectory,
		Workspaces:        string(jsonResponse),
	}

	return ctx.JSON(http.StatusOK, response)
}

type HTTPMessageBody struct {
	Message string
}

type ConfigPayload struct {
	KeyName           string `json:"key_name"`
	GitUserEmail      string `json:"git_user_email"`
	GitUserName       string `json:"git_user_name"`
	GitHost           string `json:"git_host"`
	Repository        string `json:"repository"`
	WorkspaceName     string `json:"workspace_name"`
	ProjectsDirectory string `json:"projects_directory"`
	DockerfileName    string `json:"dockerfile_name"`
	ComposeFileName   string `json:"compose_file_name"`
	OffloadOverride   string `json:"offload_override_name"`
	HTTPPort          int    `json:"http_port"`
	MCPServerURL      string `json:"mcp_server_url"`
}

type ConfigResponse struct {
	Status  string        `json:"status"`
	Message string        `json:"message"`
	Config  ConfigPayload `json:"config"`
}

type WorkspaceResponse struct {
	Status    string        `json:"status"`
	Message   string        `json:"message"`
	Config    ConfigPayload `json:"config"`
	Action    string        `json:"action"`
	AccessURL string        `json:"access_url,omitempty"`
}

type ChatRequest struct {
	Question string `json:"question"`
}

type ChatResponse struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
	Status   string `json:"status"`
}

type WorkspaceListRequest struct {
	ProjectsDirectory string `json:"projects_directory"`
}

type DockerfilesListResponse struct {
	Status      string `json:"status"`
	Message     string `json:"message"`
	Dockerfiles string `json:"dockerfiles"`
}

type WorkspacesListResponse struct {
	Status            string `json:"status"`
	Message           string `json:"message"`
	ProjectsDirectory string `json:"projects_directory"`
	Workspaces        string `json:"workspaces"`
}

func GetChatAgent(ctx context.Context, name string, appConfig config.Config, contentData data.PromptData, clientEngine openai.Client) (*agents.Agent, error) {
	chatAgent, err := agents.NewAgent(ctx, name,
		agents.WithClientEngine(clientEngine),
		agents.WithParams(openai.ChatCompletionNewParams{
			Model:       "hf.co/menlo/lucy-128k-gguf:q4_k_m",
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
			Model:             "hf.co/menlo/lucy-128k-gguf:q4_k_m",
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
