import { createDockerDesktopClient } from './docker-extension-api-client.js';

// Create Docker Desktop client
const ddClient = createDockerDesktopClient();

// Get DOM elements
const callBackendButton = document.getElementById('callBackend');
const responseTextarea = document.getElementById('response');
const configForm = document.getElementById('configForm');
const configResponseTextarea = document.getElementById('configResponse');
const submitConfigButton = document.getElementById('submitConfig');
const clearTestResponseButton = document.getElementById('clearTestResponse');
const clearConfigResponseButton = document.getElementById('clearConfigResponse');
const loadDockerfilesButton = document.getElementById('loadDockerfiles');
const dockerfilesResponseTextarea = document.getElementById('dockerfilesResponse');
const clearDockerfilesResponseButton = document.getElementById('clearDockerfilesResponse');
const dockerfileNameSelect = document.getElementById('dockerfileName');
const refreshDockerfilesButton = document.getElementById('refreshDockerfiles');
const workspacesList = document.getElementById('workspacesList');
const workspaceDetails = document.getElementById('workspaceDetails');
const clearWorkspacesListButton = document.getElementById('clearWorkspacesList');
const startSelectedWorkspaceButton = document.getElementById('startSelectedWorkspace');
const stopSelectedWorkspaceButton = document.getElementById('stopSelectedWorkspace');
const removeSelectedWorkspaceButton = document.getElementById('removeSelectedWorkspace');
const clearFormButton = document.getElementById('clearForm');

// Tab switching functionality
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs and tab contents
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
});

// Handle backend test button click
callBackendButton.addEventListener('click', async () => {
    try {
        // Disable button and show loading state
        callBackendButton.disabled = true;
        callBackendButton.textContent = 'Loading...';
        responseTextarea.value = 'Calling backend...';

        // Call the backend service
        const result = await ddClient.extension.vm.service.get('/hello');
        
        // Display the response
        responseTextarea.value = JSON.stringify(result, null, 2);
        
    } catch (error) {
        // Display error
        responseTextarea.value = `Error: ${error.message || 'Unknown error occurred'}`;
        console.error('Backend call failed:', error);
        
    } finally {
        // Re-enable button
        callBackendButton.disabled = false;
        callBackendButton.textContent = 'Call Backend';
    }
});

// Handle create workspace button click
submitConfigButton.addEventListener('click', async () => {
    try {
        // Validate form before proceeding
        const validationResult = validateWorkspaceForm();
        if (!validationResult.isValid) {
            configResponseTextarea.value = `❌ Validation Error: ${validationResult.message}`;
            configResponseTextarea.style.color = '#dc3545';
            return;
        }

        // Reset textarea style
        configResponseTextarea.style.color = '';

        // Disable button and show loading state
        submitConfigButton.disabled = true;
        submitConfigButton.textContent = 'Initializing...';
        configResponseTextarea.value = 'Initializing workspace...';

        // Collect form data
        const configData = getConfigData();
        console.log('Sending config:', configData);

        // Send POST request to /workspace/initialize endpoint
        const result = await ddClient.extension.vm.service.post('/workspace/initialize', configData);
        
        // Display the response
        configResponseTextarea.value = JSON.stringify(result, null, 2);
        
        // If initialization was successful, save workspace to list and clear form
        if (result && result.status === 'success') {
            saveWorkspaceToList(configData);
            clearFormFields();
        }
        
    } catch (error) {
        // Display error
        configResponseTextarea.value = `Error: ${error.message || 'Unknown error occurred'}`;
        console.error('Config submission failed:', error);
        
    } finally {
        // Re-enable button
        submitConfigButton.disabled = false;
        submitConfigButton.textContent = 'Initialize Workspace';
    }
});

// Helper function to collect form data
function getConfigData() {
    const configData = {};
    
    // Get all form inputs including disabled ones
    const allInputs = configForm.querySelectorAll('input, select');
    
    allInputs.forEach(input => {
        const name = input.name;
        const value = input.value;
        
        if (name && value !== '') {
            // Convert http_port to number
            if (name === 'http_port') {
                configData[name] = parseInt(value, 10);
            } else {
                configData[name] = value;
            }
        }
    });
    
    return configData;
}


// Handle clear buttons
clearTestResponseButton.addEventListener('click', () => {
    responseTextarea.value = '';
});

clearConfigResponseButton.addEventListener('click', () => {
    configResponseTextarea.value = '';
});


clearDockerfilesResponseButton.addEventListener('click', () => {
    dockerfilesResponseTextarea.value = '';
});

// Handle load dockerfiles button click
loadDockerfilesButton.addEventListener('click', async () => {
    try {
        // Disable button and show loading state
        loadDockerfilesButton.disabled = true;
        loadDockerfilesButton.textContent = 'Loading...';
        dockerfilesResponseTextarea.value = 'Loading Dockerfiles...';

        // Get MCP server URL from form (use the same config data approach)
        const configData = getConfigData();
        
        // Send POST request to /workspace/dockerfiles/list endpoint with MCP server URL
        const result = await ddClient.extension.vm.service.post('/workspace/dockerfiles/list', {
            mcp_server_url: configData.mcp_server_url
        });
        
        // Display the response
        if (result && result.dockerfiles) {
            // Parse the dockerfiles JSON string and format it nicely
            try {
                const dockerfilesList = JSON.parse(result.dockerfiles);
                if (Array.isArray(dockerfilesList) && dockerfilesList.length > 0) {
                    dockerfilesResponseTextarea.value = `Found ${dockerfilesList.length} Dockerfile(s):\n\n` + 
                        dockerfilesList.map((file, index) => `${index + 1}. ${file}`).join('\n');
                } else {
                    dockerfilesResponseTextarea.value = 'No Dockerfile files found in the current directory.';
                }
            } catch (parseError) {
                // If parsing fails, show the raw response
                dockerfilesResponseTextarea.value = `Response: ${result.message || 'Unknown response'}\nDockerfiles: ${result.dockerfiles}`;
            }
        } else {
            dockerfilesResponseTextarea.value = JSON.stringify(result, null, 2);
        }
        
    } catch (error) {
        // Display error
        dockerfilesResponseTextarea.value = `Error: ${error.message || 'Unknown error occurred'}`;
        console.error('Load dockerfiles failed:', error);
        
    } finally {
        // Re-enable button
        loadDockerfilesButton.disabled = false;
        loadDockerfilesButton.textContent = 'Load Dockerfiles';
    }
});


// Function to populate Dockerfile dropdown
async function populateDockerfilesDropdown() {
    try {
        // Get MCP server URL from form
        const mcpServerUrl = document.getElementById('mcpServerUrl').value || 'http://host.docker.internal:9090/mcp';
        
        // Disable refresh button
        refreshDockerfilesButton.disabled = true;
        refreshDockerfilesButton.textContent = '⏳';
        
        // Update dropdown to show loading
        dockerfileNameSelect.innerHTML = '<option value="">Loading...</option>';
        
        // Send POST request to get Dockerfiles list
        const result = await ddClient.extension.vm.service.post('/workspace/dockerfiles/list', {
            mcp_server_url: mcpServerUrl
        });
        
        if (result && result.dockerfiles) {
            // Parse the dockerfiles JSON string
            const dockerfilesList = JSON.parse(result.dockerfiles);
            
            // Clear existing options
            dockerfileNameSelect.innerHTML = '';
            
            if (Array.isArray(dockerfilesList) && dockerfilesList.length > 0) {
                // Check if we need to preserve current selection (_.Dockerfile)
                const currentSelection = dockerfileNameSelect.value;
                
                // Add default option
                dockerfileNameSelect.innerHTML = '<option value="">Select a Dockerfile...</option>';
                
                // Add each Dockerfile as an option
                dockerfilesList.forEach(dockerfile => {
                    const option = document.createElement('option');
                    option.value = dockerfile;
                    option.textContent = dockerfile;
                    
                    // Preserve current selection if it was _.Dockerfile, otherwise default to _.Dockerfile
                    if (currentSelection === '_.Dockerfile' && dockerfile === '_.Dockerfile') {
                        option.selected = true;
                    } else if (currentSelection !== '_.Dockerfile' && dockerfile === '_.Dockerfile') {
                        option.selected = true;
                    }
                    
                    dockerfileNameSelect.appendChild(option);
                });
                
                // If _.Dockerfile was selected but not found in the list, add it and select it
                if (currentSelection === '_.Dockerfile' && !dockerfilesList.includes('_.Dockerfile')) {
                    const option = document.createElement('option');
                    option.value = '_.Dockerfile';
                    option.textContent = '_.Dockerfile';
                    option.selected = true;
                    dockerfileNameSelect.appendChild(option);
                }
            } else {
                dockerfileNameSelect.innerHTML = '<option value="">No Dockerfiles found</option>';
            }
        } else {
            dockerfileNameSelect.innerHTML = '<option value="">Error loading Dockerfiles</option>';
        }
        
    } catch (error) {
        console.error('Failed to populate Dockerfiles dropdown:', error);
        dockerfileNameSelect.innerHTML = '<option value="">Error loading Dockerfiles</option>';
        
    } finally {
        // Re-enable refresh button
        refreshDockerfilesButton.disabled = false;
        refreshDockerfilesButton.textContent = '🔄';
    }
}

// Handle refresh dockerfiles button click
refreshDockerfilesButton.addEventListener('click', populateDockerfilesDropdown);

// Workspace management functions
function saveWorkspaceToList(workspaceData) {
    try {
        // Get existing workspaces from localStorage
        const existingWorkspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        
        // Create workspace entry
        const workspaceEntry = {
            workspace_name: workspaceData.workspace_name,
            repository: workspaceData.repository,
            created_at: new Date().toISOString(),
            full_config: workspaceData
        };
        
        // Check if workspace already exists (by name)
        const existingIndex = existingWorkspaces.findIndex(ws => ws.workspace_name === workspaceData.workspace_name);
        
        if (existingIndex >= 0) {
            // Update existing workspace
            existingWorkspaces[existingIndex] = workspaceEntry;
        } else {
            // Add new workspace
            existingWorkspaces.push(workspaceEntry);
        }
        
        // Save back to localStorage
        localStorage.setItem('composeCodexWorkspaces', JSON.stringify(existingWorkspaces));
        console.log('Workspace saved to list:', workspaceEntry.workspace_name);
        
        // Refresh the workspaces list if on that tab
        populateWorkspacesList();
        
    } catch (error) {
        console.error('Error saving workspace to list:', error);
    }
}

function populateWorkspacesList() {
    try {
        const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        
        // Clear existing options
        workspacesList.innerHTML = '';
        
        if (workspaces.length === 0) {
            workspacesList.innerHTML = '<option value="">No workspaces created yet...</option>';
            workspaceDetails.value = '';
            enableWorkspaceButtons(false);
            return;
        }
        
        // Add each workspace as an option
        workspaces.forEach((workspace, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${workspace.workspace_name} (${workspace.repository})`;
            workspacesList.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error populating workspaces list:', error);
        workspacesList.innerHTML = '<option value="">Error loading workspaces...</option>';
        enableWorkspaceButtons(false);
    }
}

function showWorkspaceDetails(index) {
    try {
        const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        
        if (index >= 0 && index < workspaces.length) {
            const workspace = workspaces[index];
            
            // Format workspace details
            const details = `Workspace Name: ${workspace.workspace_name}
Repository: ${workspace.repository}
Created: ${new Date(workspace.created_at).toLocaleString()}

Full Configuration:
${JSON.stringify(workspace.full_config, null, 2)}`;
            
            workspaceDetails.value = details;
        } else {
            workspaceDetails.value = '';
        }
        
    } catch (error) {
        console.error('Error showing workspace details:', error);
        workspaceDetails.value = 'Error loading workspace details...';
    }
}

function clearWorkspacesList() {
    if (confirm('Are you sure you want to clear all workspace records? This will not delete the actual workspaces, only the list.')) {
        localStorage.removeItem('composeCodexWorkspaces');
        populateWorkspacesList();
        workspaceDetails.value = '';
    }
}

function enableWorkspaceButtons(enabled) {
    startSelectedWorkspaceButton.disabled = !enabled;
    stopSelectedWorkspaceButton.disabled = !enabled;
    removeSelectedWorkspaceButton.disabled = !enabled;
}

async function startSelectedWorkspace() {
    const selectedIndex = parseInt(workspacesList.value);
    if (isNaN(selectedIndex)) return;
    
    try {
        const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        const workspace = workspaces[selectedIndex];
        
        if (!workspace) {
            workspaceDetails.value = 'Error: Workspace not found';
            return;
        }
        
        // Disable button and show loading state
        startSelectedWorkspaceButton.disabled = true;
        startSelectedWorkspaceButton.textContent = 'Starting...';
        workspaceDetails.value = 'Starting workspace...';

        // Extract the necessary data for starting the workspace
        const startData = {
            projects_directory: workspace.full_config.projects_directory,
            workspace_name: workspace.full_config.workspace_name,
            repository: workspace.full_config.repository,
            http_port: workspace.full_config.http_port,
            mcp_server_url: workspace.full_config.mcp_server_url || 'http://host.docker.internal:9090/mcp'
        };

        console.log('Starting selected workspace with data:', startData);

        // Send POST request to /workspace/start endpoint
        const result = await ddClient.extension.vm.service.post('/workspace/start', startData);
        
        // Display the response
        workspaceDetails.value = `Start Result:\n${JSON.stringify(result, null, 2)}`;
        
    } catch (error) {
        // Display error
        workspaceDetails.value = `Error starting workspace: ${error.message || 'Unknown error occurred'}`;
        console.error('Start workspace failed:', error);
        
    } finally {
        // Re-enable button
        startSelectedWorkspaceButton.disabled = false;
        startSelectedWorkspaceButton.textContent = 'Start Workspace';
    }
}

async function stopSelectedWorkspace() {
    const selectedIndex = parseInt(workspacesList.value);
    if (isNaN(selectedIndex)) return;
    
    try {
        const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        const workspace = workspaces[selectedIndex];
        
        if (!workspace) {
            workspaceDetails.value = 'Error: Workspace not found';
            return;
        }
        
        // Disable button and show loading state
        stopSelectedWorkspaceButton.disabled = true;
        stopSelectedWorkspaceButton.textContent = 'Stopping...';
        workspaceDetails.value = 'Stopping workspace...';

        // Extract the necessary data for stopping the workspace
        const stopData = {
            projects_directory: workspace.full_config.projects_directory,
            workspace_name: workspace.full_config.workspace_name,
            mcp_server_url: workspace.full_config.mcp_server_url || 'http://host.docker.internal:9090/mcp'
        };

        console.log('Stopping selected workspace with data:', stopData);

        // Send POST request to /workspace/stop endpoint
        const result = await ddClient.extension.vm.service.post('/workspace/stop', stopData);
        
        // Display the response
        workspaceDetails.value = `Stop Result:\n${JSON.stringify(result, null, 2)}`;
        
    } catch (error) {
        // Display error
        workspaceDetails.value = `Error stopping workspace: ${error.message || 'Unknown error occurred'}`;
        console.error('Stop workspace failed:', error);
        
    } finally {
        // Re-enable button
        stopSelectedWorkspaceButton.disabled = false;
        stopSelectedWorkspaceButton.textContent = 'Stop Workspace';
    }
}

async function removeSelectedWorkspace() {
    const selectedIndex = parseInt(workspacesList.value);
    if (isNaN(selectedIndex)) return;
    
    try {
        const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        const workspace = workspaces[selectedIndex];
        
        if (!workspace) {
            workspaceDetails.value = 'Error: Workspace not found';
            return;
        }
        
        // Confirm removal with user
        if (!confirm(`Are you sure you want to remove workspace "${workspace.workspace_name}"? This action cannot be undone and will delete all workspace files.`)) {
            return;
        }
        
        // Disable button and show loading state
        removeSelectedWorkspaceButton.disabled = true;
        removeSelectedWorkspaceButton.textContent = 'Removing...';
        workspaceDetails.value = 'Removing workspace...';

        // Extract the necessary data for removing the workspace
        const removeData = {
            projects_directory: workspace.full_config.projects_directory,
            workspace_name: workspace.full_config.workspace_name,
            mcp_server_url: workspace.full_config.mcp_server_url || 'http://host.docker.internal:9090/mcp'
        };

        console.log('Removing selected workspace with data:', removeData);

        // Send POST request to /workspace/remove endpoint
        const result = await ddClient.extension.vm.service.post('/workspace/remove', removeData);
        
        // Display the response
        workspaceDetails.value = `Remove Result:\n${JSON.stringify(result, null, 2)}`;
        
        // If removal was successful, remove from localStorage and refresh list
        if (result && result.status === 'success') {
            // Remove from localStorage
            workspaces.splice(selectedIndex, 1);
            localStorage.setItem('composeCodexWorkspaces', JSON.stringify(workspaces));
            
            // Refresh the workspaces list
            populateWorkspacesList();
            
            workspaceDetails.value += '\n\nWorkspace removed from local list.';
        }
        
    } catch (error) {
        // Display error
        workspaceDetails.value = `Error removing workspace: ${error.message || 'Unknown error occurred'}`;
        console.error('Remove workspace failed:', error);
        
    } finally {
        // Re-enable button
        removeSelectedWorkspaceButton.disabled = false;
        removeSelectedWorkspaceButton.textContent = 'Remove Workspace';
    }
}

// Event handlers for workspace list
workspacesList.addEventListener('change', (e) => {
    const selectedIndex = parseInt(e.target.value);
    if (!isNaN(selectedIndex)) {
        showWorkspaceDetails(selectedIndex);
        enableWorkspaceButtons(true);
    } else {
        workspaceDetails.value = '';
        enableWorkspaceButtons(false);
    }
});

clearWorkspacesListButton.addEventListener('click', clearWorkspacesList);
startSelectedWorkspaceButton.addEventListener('click', startSelectedWorkspace);
stopSelectedWorkspaceButton.addEventListener('click', stopSelectedWorkspace);
removeSelectedWorkspaceButton.addEventListener('click', removeSelectedWorkspace);

// Form clearing functionality
function clearFormFields() {
    // Clear workspace name
    document.getElementById('workspaceName').value = '';
    
    // Clear repository
    document.getElementById('repository').value = '';
    
    // Clear HTTP port (set to 0)
    document.getElementById('httpPort').value = '0';
    
    // Reset Dockerfile dropdown to _.Dockerfile
    dockerfileNameSelect.innerHTML = '<option value="_.Dockerfile">_.Dockerfile</option>';
    dockerfileNameSelect.value = '_.Dockerfile';
    
    // Re-populate Dockerfile dropdown (will add other options but keep _.Dockerfile selected)
    populateDockerfilesDropdown();
    
    // Note: SSH key name, Git user email, Git user name, and MCP server URL are preserved
    // Projects Directory, Git Host, Compose File, Offload Override are disabled and keep their values
    
    // Update localStorage to sync with cleared fields
    saveFormData();
    
    console.log('Form fields cleared and localStorage updated');
}

clearFormButton.addEventListener('click', clearFormFields);

// LocalStorage functions for form data
function saveFormData() {
    const configData = getConfigData();
    localStorage.setItem('composeCodexConfig', JSON.stringify(configData));
    console.log('Form data saved to localStorage');
}

function loadFormData() {
    try {
        const savedData = localStorage.getItem('composeCodexConfig');
        if (savedData) {
            const configData = JSON.parse(savedData);
            
            // Populate form fields with saved data
            Object.keys(configData).forEach(key => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = configData[key];
                }
            });
            
            console.log('Form data loaded from localStorage');
        }
    } catch (error) {
        console.error('Error loading form data from localStorage:', error);
    }
}

// Auto-save form data when inputs change
function setupAutoSave() {
    const formInputs = configForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
        input.addEventListener('input', saveFormData);
        input.addEventListener('change', saveFormData);
    });
}

// Form validation functionality
function validateWorkspaceForm() {
    const requiredFields = [
        { id: 'keyName', name: 'SSH Key Name' },
        { id: 'workspaceName', name: 'Workspace Name' },
        { id: 'gitUserEmail', name: 'Git User Email' },
        { id: 'gitUserName', name: 'Git Username' },
        { id: 'repository', name: 'Repository' },
        { id: 'dockerfileName', name: 'Dockerfile Name' },
        { id: 'httpPort', name: 'HTTP Port' }
    ];

    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        const value = element.value.trim();
        
        if (!value || value === '') {
            return {
                isValid: false,
                message: `${field.name} is required and cannot be empty.`
            };
        }
    }

    // Additional validation for HTTP port
    const httpPort = parseInt(document.getElementById('httpPort').value);
    if (isNaN(httpPort) || httpPort < 0 || httpPort > 65535) {
        return {
            isValid: false,
            message: 'HTTP Port must be a number between 0 and 65535.'
        };
    }
    
    // Check if port is 0 (not allowed for workspace creation)
    if (httpPort === 0) {
        return {
            isValid: false,
            message: 'HTTP Port cannot be 0. Please specify a valid port number (1000-65535 recommended).'
        };
    }

    // Additional validation for email format
    const email = document.getElementById('gitUserEmail').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            message: 'Git User Email must be a valid email address.'
        };
    }

    return { isValid: true, message: '' };
}

// Initialize
console.log('Compose Codex extension loaded');

// Load saved form data and setup auto-save
loadFormData();
setupAutoSave();

// Populate Dockerfiles dropdown on page load
populateDockerfilesDropdown();

// Populate workspaces list on page load
populateWorkspacesList();