package main

import (
	"flag"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/sirupsen/logrus"
)

var logger = logrus.New()

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
	router.POST("/config", configHandler)
	router.POST("/workspace/start", startWorkspaceHandler)
	router.POST("/workspace/stop", stopWorkspaceHandler)
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

	logger.Infof("Received config: %+v", config)

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

	// TODO: Implement workspace start logic here
	// This would typically involve:
	// - Setting environment variables from config
	// - Running the start-local-workspace.sh script
	// - Or calling Docker Compose directly

	response := WorkspaceResponse{
		Status:    "success",
		Message:   "Workspace started successfully",
		Config:    config,
		Action:    "start",
		AccessURL: fmt.Sprintf("http://localhost:%d/?folder=/home/workspace/%s", config.HTTPPort, config.WorkspaceName),
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

	// TODO: Implement workspace stop logic here
	// This would typically involve:
	// - Setting environment variables from config
	// - Running the stop-workspace.sh script
	// - Or calling Docker Compose down directly

	response := WorkspaceResponse{
		Status:  "success",
		Message: "Workspace stopped successfully",
		Config:  config,
		Action:  "stop",
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
