package main

import (
	"context"
	"log"
	"os"
	"strings"

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
		// Here you would implement the logic to create the workspace
		// For now, we just return a success message
		return mcp.NewToolResultText("Workspace "+workspaceName+" created successfully in directory "+projectsDirectory+
			" using Dockerfile "+dockerfileName+" and compose file "+composeFileName+
			" with offload override file "+offloadOverrideName+" and HTTP port "+httpPort+
			" using SSH key "+keyName+" and Git user email "+gitUserEmail+" and user name "+gitUserName+
			" and Git host "+gitHost+" and repository "+repository), nil
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

func chooseCharacterBySpeciesHandler(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := request.GetArguments()
	// Check if the species_name argument is provided
	if len(args) == 0 {
		return mcp.NewToolResultText("zephyr"), nil
	}
	var content = "zephyr" // default character
	if speciesName, ok := args["species_name"]; ok {

		switch strings.ToLower(speciesName.(string)) {
		case "humain":
			content = "aldric"
		case "orc":
			content = "grash"
		case "nain":
			content = "thorin"
		case "elfe", "elf":
			content = "lyralei"
		default:
			content = "zephyr"
		}
	}
	return mcp.NewToolResultText(content), nil

}
