package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func main() {

	// Create MCP server
	s := server.NewMCPServer(
		"mcp-compose-codex",
		"0.0.0",
	)

	// =================================================
	// TOOLS:
	// =================================================
	initializeWokspace := mcp.NewTool("initializer_workspace",
		mcp.WithDescription("Create a workspace for the user with the provided informations."),
		mcp.WithString("key_name",
			mcp.Required(),
			mcp.Description("The name of the SSH key to use for the workspace. The key must be available in the keys directory."),
		),
		mcp.WithString("git_user_email",
			mcp.Required(),
			mcp.Description("The email of the git user to use for the workspace. The email will be used to clone the repository and to commit changes. It can be your GitHub or GitLab email."),
		),
		mcp.WithString("git_user_name",
			mcp.Required(),
			mcp.Description("The name of the git user to use for the workspace. The user name will be used to clone the repository and to commit changes."),
		),
		mcp.WithString("git_host",
			mcp.Required(),
			mcp.Description("The git host to use for the workspace. The host will be used to clone the repository and to commit changes. It can be github.com, gitlab.com, etc."),
		),
		mcp.WithString("repository",
			mcp.Required(),
			mcp.Description("The repository to clone for the workspace. The repository must be available on the git host. It can be a public or private repository."),
		),
		mcp.WithString("workspace_name",
			mcp.Required(),
			mcp.Description("The name of the workspace to create. The workspace will be created in the projects directory. It can be any name you want."),
		),
		mcp.WithString("projects_directory",
			mcp.Required(),
			mcp.Description("The directory where the workspace will be created. The directory must be available in the current directory. It can be any name you want."),
		),
		mcp.WithString("dockerfile_name",
			mcp.Required(),
			mcp.Description("The name of the Dockerfile to use for the workspace. The Dockerfile must be available in the current directory. It can be any name you want."),
		),
		mcp.WithString("compose_file_name",
			mcp.Required(),
			mcp.Description("The name of the compose file to use for the workspace. The compose file must be available in the current directory. It can be any name you want."),
		),
		mcp.WithString("offload_override_name",
			mcp.Required(),
			mcp.Description("The name of the offload override file to use for the workspace. The offload override file must be available in the current directory. It can be any name you want."),
		),
		mcp.WithString("http_port",
			mcp.Required(),
			mcp.Description("The port to use for the web IDE. The port must be available in the current directory. It can be any port you want."),
		),
	)
	s.AddTool(initializeWokspace, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args := request.GetArguments()
		// Check if the required arguments are provided
		if len(args) == 0 {
			return mcp.NewToolResultText("Please provide the required arguments: key_name, git_user_email, git_user_name, git_host, repository, workspace_name, projects_directory, dockerfile_name, compose_file_name, offload_override_name, http_port"), nil
		}
		// Extract the arguments
		keyName, _ := args["key_name"].(string)
		gitUserEmail, _ := args["git_user_email"].(string)
		gitUserName, _ := args["git_user_name"].(string)
		gitHost, _ := args["git_host"].(string)
		repository, _ := args["repository"].(string)
		workspaceName, _ := args["workspace_name"].(string)
		projectsDirectory, _ := args["projects_directory"].(string)
		dockerfileName, _ := args["dockerfile_name"].(string)
		composeFileName, _ := args["compose_file_name"].(string)
		offloadOverrideName, _ := args["offload_override_name"].(string)
		httpPort, _ := args["http_port"].(string)
		// Check if the required arguments are provided
		if keyName == "" || gitUserEmail == "" || gitUserName == "" || gitHost == "" ||
			repository == "" || workspaceName == "" || projectsDirectory == "" ||
			dockerfileName == "" || composeFileName == "" || offloadOverrideName == "" || httpPort == "" {
			return mcp.NewToolResultText("Please provide all the required arguments: key_name, git_user_email, git_user_name, git_host, repository, workspace_name, projects_directory, dockerfile_name, compose_file_name, offload_override_name, http_port"), nil
		}
		// Create the workspace
		log.Println("Creating workspace", workspaceName, "in directory", projectsDirectory)
		log.Println("Using Dockerfile", dockerfileName, "and compose file", composeFileName)
		log.Println("Using offload override file", offloadOverrideName)
		log.Println("Using HTTP port", httpPort)
		log.Println("Using SSH key", keyName)
		log.Println("Using Git user email", gitUserEmail, "and user name", gitUserName)
		log.Println("Using Git host", gitHost)
		log.Println("Using repository", repository)

		// Set environment variables for the script
		env := os.Environ()
		env = append(env, "KEY_NAME="+keyName)
		env = append(env, "GIT_USER_EMAIL="+gitUserEmail)
		env = append(env, "GIT_USER_NAME="+gitUserName)
		env = append(env, "GIT_HOST="+gitHost)
		env = append(env, "REPOSITORY="+repository)
		env = append(env, "WORKSPACE_NAME="+workspaceName)
		env = append(env, "PROJECTS_DIRECTORY="+projectsDirectory)
		env = append(env, "DOCKERFILE_NAME="+dockerfileName)
		env = append(env, "COMPOSE_FILE_NAME="+composeFileName)
		env = append(env, "OFFLOAD_OVERRIDE_NAME="+offloadOverrideName)
		env = append(env, "HTTP_PORT="+httpPort)

		// Execute the initialize-workspace.sh script
		cmd := exec.Command("./initialize-workspace.sh")
		cmd.Env = env

		output, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("Error executing initialize-workspace.sh: %v", err)
			log.Printf("Script output: %s", string(output))
			return mcp.NewToolResultText(fmt.Sprintf("Failed to create workspace: %v\nOutput: %s", err, string(output))), nil
		}

		log.Printf("Workspace creation successful. Script output: %s", string(output))
		return mcp.NewToolResultText(fmt.Sprintf("Workspace %s created successfully!\n\nScript output:\n%s", workspaceName, string(output))), nil
	})

	// =================================================
	// START WORKSPACE TOOL:
	// =================================================
	startWorkspace := mcp.NewTool("start_workspace",
		mcp.WithDescription("Start a local workspace that has been previously initialized."),
		mcp.WithString("projects_directory",
			mcp.Required(),
			mcp.Description("The directory where the workspace is located."),
		),
		mcp.WithString("workspace_name",
			mcp.Required(),
			mcp.Description("The name of the workspace to start."),
		),
		mcp.WithString("http_port",
			mcp.Required(),
			mcp.Description("The port to use for the web IDE. The port must be available in the current directory. It can be any port you want."),
		),
	)
	s.AddTool(startWorkspace, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args := request.GetArguments()
		// Check if the required arguments are provided
		if len(args) == 0 {
			return mcp.NewToolResultText("Please provide the required arguments: projects_directory, workspace_name"), nil
		}
		// Extract the arguments
		projectsDirectory, _ := args["projects_directory"].(string)
		workspaceName, _ := args["workspace_name"].(string)
		httpPort, _ := args["http_port"].(string)

		// Check if the required arguments are provided
		if projectsDirectory == "" || workspaceName == "" || httpPort == "" {
			return mcp.NewToolResultText("Please provide all the required arguments: projects_directory, workspace_name"), nil
		}

		// Start the workspace
		log.Println("Starting workspace", workspaceName, "in directory", projectsDirectory)

		// Set environment variables for the script
		env := os.Environ()
		env = append(env, "PROJECTS_DIRECTORY="+projectsDirectory)
		env = append(env, "WORKSPACE_NAME="+workspaceName)
		env = append(env, "HTTP_PORT="+httpPort)

		// Execute the start-local-workspace.sh script
		cmd := exec.Command("./start-local-workspace.sh")
		cmd.Env = env

		output, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("Error executing start-local-workspace.sh: %v", err)
			log.Printf("Script output: %s", string(output))
			return mcp.NewToolResultText(fmt.Sprintf("Failed to start workspace: %v\nOutput: %s", err, string(output))), nil
		}

		log.Printf("Workspace start successful. Script output: %s", string(output))
		return mcp.NewToolResultText(fmt.Sprintf("Workspace %s started successfully!\n\nScript output:\n%s", workspaceName, string(output))), nil
	})

	// =================================================
	// STOP WORKSPACE TOOL:
	// =================================================
	stopWorkspace := mcp.NewTool("stop_workspace",
		mcp.WithDescription("Stop a running workspace."),
		mcp.WithString("projects_directory",
			mcp.Required(),
			mcp.Description("The directory where the workspace is located."),
		),
		mcp.WithString("workspace_name",
			mcp.Required(),
			mcp.Description("The name of the workspace to stop."),
		),
	)
	s.AddTool(stopWorkspace, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args := request.GetArguments()
		// Check if the required arguments are provided
		if len(args) == 0 {
			return mcp.NewToolResultText("Please provide the required arguments: projects_directory, workspace_name"), nil
		}
		// Extract the arguments
		projectsDirectory, _ := args["projects_directory"].(string)
		workspaceName, _ := args["workspace_name"].(string)
		// Check if the required arguments are provided
		if projectsDirectory == "" || workspaceName == "" {
			return mcp.NewToolResultText("Please provide all the required arguments: projects_directory, workspace_name"), nil
		}
		
		// Stop the workspace
		log.Println("Stopping workspace", workspaceName, "in directory", projectsDirectory)
		
		// Set environment variables for the script
		env := os.Environ()
		env = append(env, "PROJECTS_DIRECTORY="+projectsDirectory)
		env = append(env, "WORKSPACE_NAME="+workspaceName)

		// Execute the stop-workspace.sh script
		cmd := exec.Command("./stop-workspace.sh")
		cmd.Env = env
		
		output, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("Error executing stop-workspace.sh: %v", err)
			log.Printf("Script output: %s", string(output))
			return mcp.NewToolResultText(fmt.Sprintf("Failed to stop workspace: %v\nOutput: %s", err, string(output))), nil
		}
		
		log.Printf("Workspace stop successful. Script output: %s", string(output))
		return mcp.NewToolResultText(fmt.Sprintf("Workspace %s stopped successfully!\n\nScript output:\n%s", workspaceName, string(output))), nil
	})

	// =================================================
	// REMOVE WORKSPACE TOOL:
	// =================================================
	removeWorkspace := mcp.NewTool("remove_workspace",
		mcp.WithDescription("Remove a workspace and clean up all associated resources."),
		mcp.WithString("projects_directory",
			mcp.Required(),
			mcp.Description("The directory where the workspace is located."),
		),
		mcp.WithString("workspace_name",
			mcp.Required(),
			mcp.Description("The name of the workspace to remove."),
		),
	)
	s.AddTool(removeWorkspace, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args := request.GetArguments()
		// Check if the required arguments are provided
		if len(args) == 0 {
			return mcp.NewToolResultText("Please provide the required arguments: projects_directory, workspace_name"), nil
		}
		// Extract the arguments
		projectsDirectory, _ := args["projects_directory"].(string)
		workspaceName, _ := args["workspace_name"].(string)
		// Check if the required arguments are provided
		if projectsDirectory == "" || workspaceName == "" {
			return mcp.NewToolResultText("Please provide all the required arguments: projects_directory, workspace_name"), nil
		}
		
		// Remove the workspace
		log.Println("Removing workspace", workspaceName, "in directory", projectsDirectory)
		
		// Set environment variables for the script
		env := os.Environ()
		env = append(env, "PROJECTS_DIRECTORY="+projectsDirectory)
		env = append(env, "WORKSPACE_NAME="+workspaceName)

		// Execute the remove-workspace.sh script
		cmd := exec.Command("./remove-workspace.sh")
		cmd.Env = env
		
		output, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("Error executing remove-workspace.sh: %v", err)
			log.Printf("Script output: %s", string(output))
			return mcp.NewToolResultText(fmt.Sprintf("Failed to remove workspace: %v\nOutput: %s", err, string(output))), nil
		}
		
		log.Printf("Workspace removal successful. Script output: %s", string(output))
		return mcp.NewToolResultText(fmt.Sprintf("Workspace %s removed successfully!\n\nScript output:\n%s", workspaceName, string(output))), nil
	})

	// =================================================
	// GET DOCKERFILES LIST TOOL:
	// =================================================
	getDockerfilesList := mcp.NewTool("get_dockerfiles_list",
		mcp.WithDescription("Get list of all Dockerfile files (*.Dockerfile) in the current directory."),
	)
	s.AddTool(getDockerfilesList, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		// Get all *.Dockerfile files in current directory
		files, err := filepath.Glob("*.Dockerfile")
		if err != nil {
			log.Printf("Error getting Dockerfile list: %v", err)
			return mcp.NewToolResultText(fmt.Sprintf("Failed to get Dockerfile list: %v", err)), nil
		}

		if len(files) == 0 {
			return mcp.NewToolResultText("No Dockerfile files found in the current directory."), nil
		}

		// Convert to JSON for structured response
		jsonFiles, err := json.Marshal(files)
		if err != nil {
			log.Printf("Error marshaling Dockerfile list: %v", err)
			return mcp.NewToolResultText(fmt.Sprintf("Found Dockerfiles: %v", files)), nil
		}

		log.Printf("Found %d Dockerfile(s): %v", len(files), files)
		return mcp.NewToolResultText(string(jsonFiles)), nil
	})

	// =================================================
	// GET WORKSPACES LIST TOOL:
	// =================================================
	getWorkspacesList := mcp.NewTool("get_workspaces_list",
		mcp.WithDescription("Get list of workspace directories in the specified projects directory (first level only)."),
		mcp.WithString("projects_directory",
			mcp.Required(),
			mcp.Description("The projects directory path to list workspaces from."),
		),
	)
	s.AddTool(getWorkspacesList, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args := request.GetArguments()
		// Check if the required arguments are provided
		if len(args) == 0 {
			return mcp.NewToolResultText("Please provide the required argument: projects_directory"), nil
		}
		
		// Extract the arguments
		projectsDirectory, _ := args["projects_directory"].(string)
		
		// Check if the required arguments are provided
		if projectsDirectory == "" {
			return mcp.NewToolResultText("Please provide the required argument: projects_directory"), nil
		}

		// Check if directory exists
		if _, err := os.Stat(projectsDirectory); os.IsNotExist(err) {
			return mcp.NewToolResultText(fmt.Sprintf("Projects directory does not exist: %s", projectsDirectory)), nil
		}

		// Read directory entries
		entries, err := os.ReadDir(projectsDirectory)
		if err != nil {
			log.Printf("Error reading projects directory %s: %v", projectsDirectory, err)
			return mcp.NewToolResultText(fmt.Sprintf("Failed to read projects directory: %v", err)), nil
		}

		// Filter only directories
		var directories []string
		for _, entry := range entries {
			if entry.IsDir() {
				directories = append(directories, entry.Name())
			}
		}

		if len(directories) == 0 {
			return mcp.NewToolResultText(fmt.Sprintf("No workspace directories found in: %s", projectsDirectory)), nil
		}

		// Convert to JSON for structured response
		jsonDirs, err := json.Marshal(directories)
		if err != nil {
			log.Printf("Error marshaling workspace list: %v", err)
			return mcp.NewToolResultText(fmt.Sprintf("Found workspaces: %v", directories)), nil
		}

		log.Printf("Found %d workspace(s) in %s: %v", len(directories), projectsDirectory, directories)
		return mcp.NewToolResultText(string(jsonDirs)), nil
	})

	// Start the HTTP server
	httpPort := os.Getenv("HTTP_PORT")
	if httpPort == "" {
		httpPort = "9090"
	}

	log.Println("MCP StreamableHTTP server is running on port", httpPort)

	server.NewStreamableHTTPServer(s,
		server.WithEndpointPath("/mcp"),
	).Start(":" + httpPort)
}
