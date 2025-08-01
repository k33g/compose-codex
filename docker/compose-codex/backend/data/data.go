package data

type PromptData struct {
	SystemInstructions             string
	SystemToolsInstructions        string
	SystemToolsInstructionsForChat string
}

func GetPromptData() (PromptData, error) {

	systemInstructions := `You are a helpful AI assistant that can run tools to perform tasks.`

	systemToolsInstructions := ` 
	Your job is to understand the user prompt and decide if you need to use tools to run external commands.
	Ignore all things not related to the usage of a tool
	`

	systemToolsInstructionsForChat := ` 
	If you detect that the user prompt is related to a tool, 
	ignore this part and focus on the other parts.
	`

	return PromptData{
		SystemInstructions:             systemInstructions,
		SystemToolsInstructions:        systemToolsInstructions,
		SystemToolsInstructionsForChat: systemToolsInstructionsForChat,
	}, nil
}
