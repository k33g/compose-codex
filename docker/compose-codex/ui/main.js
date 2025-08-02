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
const regenerateWorkspacesListButton = document.getElementById('regenerateWorkspacesList');
const refreshWorkspaceStatusButton = document.getElementById('refreshWorkspaceStatus');
const startSelectedWorkspaceButton = document.getElementById('startSelectedWorkspace');
const stopSelectedWorkspaceButton = document.getElementById('stopSelectedWorkspace');
const removeSelectedWorkspaceButton = document.getElementById('removeSelectedWorkspace');
const clearFormButton = document.getElementById('clearForm');

// Modal elements
const buildProgressModal = document.getElementById('buildProgressModal');
const closeBuildModal = document.getElementById('closeBuildModal');
const buildProgressFill = document.getElementById('buildProgressFill');
const buildProgressText = document.getElementById('buildProgressText');

// Workspace access link
const workspaceAccessLink = document.getElementById('workspaceAccessLink');

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

// Modal control functions
let buildInProgress = false;

function showBuildModal() {
    buildProgressModal.style.display = 'block';
    buildProgressFill.style.width = '0%';
    buildProgressText.textContent = 'Initializing build...';
    buildInProgress = true;
    
    // Update close button to show it's disabled during build
    closeBuildModal.style.opacity = '0.5';
    closeBuildModal.style.cursor = 'not-allowed';
}

function hideBuildModal() {
    buildProgressModal.style.display = 'none';
    buildInProgress = false;
    
    // Restore close button
    closeBuildModal.style.opacity = '1';
    closeBuildModal.style.cursor = 'pointer';
}

function updateBuildProgress(progress, message) {
    buildProgressFill.style.width = progress + '%';
    buildProgressText.textContent = message;
    
    // Allow closing modal when build is complete
    if (progress >= 100) {
        buildInProgress = false;
        closeBuildModal.style.opacity = '1';
        closeBuildModal.style.cursor = 'pointer';
    }
}

// Modal event listeners
closeBuildModal.addEventListener('click', () => {
    if (!buildInProgress) {
        hideBuildModal();
    }
});

window.addEventListener('click', (event) => {
    if (event.target === buildProgressModal && !buildInProgress) {
        hideBuildModal();
    }
});

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
        console.log(`Populating workspace list with ${workspaces.length} workspaces`);
        
        // Clear existing options
        workspacesList.innerHTML = '';
        
        if (workspaces.length === 0) {
            console.log('No workspaces found in localStorage');
            workspacesList.innerHTML = '<option value="">No workspaces created yet...</option>';
            workspaceDetails.value = '';
            workspaceAccessLink.style.display = 'none';
            workspaceAccessLink.onclick = null;
            enableWorkspaceButtons(false);
            return;
        }
        
        // Add each workspace as an option
        workspaces.forEach((workspace, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.setAttribute('data-workspace-name', workspace.workspace_name);
            
            // Check if we have saved status
            if (workspace.status && workspace.last_status_check) {
                const statusIcon = workspace.status.is_running ? '🟢' : '🔴';
                const statusText = workspace.status.is_running ? 'Running' : 'Stopped';
                const lastCheck = new Date(workspace.last_status_check);
                const now = new Date();
                const ageMinutes = Math.floor((now - lastCheck) / (1000 * 60));
                
                option.textContent = `${workspace.workspace_name} (${workspace.repository}) - ${statusIcon} ${statusText}`;
                option.setAttribute('data-status', JSON.stringify(workspace.status));
                
                // If status is older than 2 minutes, mark it as stale
                if (ageMinutes > 2) {
                    option.textContent += ' (stale)';
                }
            } else {
                option.textContent = `${workspace.workspace_name} (${workspace.repository}) - Checking status...`;
            }
            
            workspacesList.appendChild(option);
        });
        
        // Only check status for workspaces that don't have recent status or are marked as stale
        const workspacesToCheck = workspaces.filter(workspace => {
            if (!workspace.status || !workspace.last_status_check) {
                return true; // No status, need to check
            }
            
            const lastCheck = new Date(workspace.last_status_check);
            const now = new Date();
            const ageMinutes = Math.floor((now - lastCheck) / (1000 * 60));
            
            return ageMinutes > 2; // Only check if status is older than 2 minutes
        });
        
        if (workspacesToCheck.length > 0) {
            console.log(`Checking status for ${workspacesToCheck.length} workspaces with stale status`);
            checkAllWorkspaceStatuses(workspacesToCheck);
        } else {
            console.log('All workspace statuses are recent, skipping status check');
        }
        
    } catch (error) {
        console.error('Error populating workspaces list:', error);
        workspacesList.innerHTML = '<option value="">Error loading workspaces...</option>';
        enableWorkspaceButtons(false);
    }
}

async function checkAllWorkspaceStatuses(workspaces) {
    const statusPromises = workspaces.map(async (workspace, index) => {
        try {
            const result = await ddClient.extension.vm.service.post('/workspace/status', {
                projects_directory: workspace.full_config.projects_directory,
                workspace_name: workspace.workspace_name
            });
            
            return {
                index: index,
                workspace: workspace,
                status: result
            };
        } catch (error) {
            console.error(`Error checking status for ${workspace.workspace_name}:`, error);
            return {
                index: index,
                workspace: workspace,
                status: {
                    status: 'error',
                    is_running: false,
                    container_info: 'Status check failed'
                }
            };
        }
    });
    
    // Wait for all status checks to complete
    const results = await Promise.all(statusPromises);
    
    // Update the workspace list with status information and save to localStorage
    // Use Promise.all to ensure all status updates are completed
    await Promise.all(results.map(async (result) => {
        // Update localStorage and UI using the centralized function
        await updateWorkspaceStatus(result.workspace.workspace_name, result.status);
    }));
}

async function updateWorkspaceStatus(workspaceName, newStatus) {
    try {
        console.log(`Updating status for ${workspaceName}:`, newStatus);
        
        // Get current workspaces from localStorage
        const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        
        // Find the workspace and update its status
        const workspaceIndex = workspaces.findIndex(ws => ws.workspace_name === workspaceName);
        if (workspaceIndex >= 0) {
            // Add/update status in the workspace object
            workspaces[workspaceIndex].status = newStatus;
            workspaces[workspaceIndex].last_status_check = new Date().toISOString();
            
            // Save back to localStorage
            localStorage.setItem('composeCodexWorkspaces', JSON.stringify(workspaces));
            console.log(`Status saved to localStorage for ${workspaceName} - Running: ${newStatus.is_running}`);
        } else {
            console.warn(`Workspace ${workspaceName} not found in localStorage`);
        }
        
        // Update the UI list option
        const listOption = Array.from(workspacesList.children).find(option => 
            option.getAttribute('data-workspace-name') === workspaceName
        );
        
        if (listOption) {
            const workspace = workspaces[workspaceIndex];
            const statusIcon = newStatus.is_running ? '🟢' : '🔴';
            const statusText = newStatus.is_running ? 'Running' : 'Stopped';
            
            listOption.textContent = `${workspace.workspace_name} (${workspace.repository}) - ${statusIcon} ${statusText}`;
            listOption.setAttribute('data-status', JSON.stringify(newStatus));
        }
        
        // If this workspace is currently selected, update the details view
        const selectedIndex = parseInt(workspacesList.value);
        if (!isNaN(selectedIndex) && workspaces[selectedIndex] && workspaces[selectedIndex].workspace_name === workspaceName) {
            showWorkspaceDetails(selectedIndex);
        }
        
    } catch (error) {
        console.error('Error updating workspace status:', error);
    }
}

function saveAllWorkspaceStatuses() {
    try {
        const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        console.log('Manually saving all workspace statuses to localStorage');
        localStorage.setItem('composeCodexWorkspaces', JSON.stringify(workspaces));
        return true;
    } catch (error) {
        console.error('Error manually saving workspace statuses:', error);
        return false;
    }
}

function cleanupDuplicateWorkspaces() {
    try {
        const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        const uniqueWorkspaces = [];
        const seenNames = new Set();
        
        for (const workspace of workspaces) {
            if (!seenNames.has(workspace.workspace_name)) {
                seenNames.add(workspace.workspace_name);
                uniqueWorkspaces.push(workspace);
            } else {
                console.log(`Removing duplicate workspace: ${workspace.workspace_name}`);
            }
        }
        
        if (uniqueWorkspaces.length !== workspaces.length) {
            console.log(`Cleaned up ${workspaces.length - uniqueWorkspaces.length} duplicate workspaces`);
            localStorage.setItem('composeCodexWorkspaces', JSON.stringify(uniqueWorkspaces));
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error cleaning up duplicate workspaces:', error);
        return false;
    }
}

async function refreshWorkspaceStatuses() {
    try {
        // Disable button and show loading state
        refreshWorkspaceStatusButton.disabled = true;
        refreshWorkspaceStatusButton.textContent = '⚡ Checking...';
        
        const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        
        if (workspaces.length === 0) {
            alert('No workspaces to check status for.');
            return;
        }
        
        // Update all workspace options to show "Checking..."
        Array.from(workspacesList.children).forEach((option, index) => {
            if (workspaces[index]) {
                option.textContent = `${workspaces[index].workspace_name} (${workspaces[index].repository}) - Checking status...`;
            }
        });
        
        // Check statuses
        await checkAllWorkspaceStatuses(workspaces);
        
    } catch (error) {
        console.error('Error refreshing workspace statuses:', error);
        alert('Error refreshing workspace statuses. Check the console for details.');
        
    } finally {
        // Re-enable button
        refreshWorkspaceStatusButton.disabled = false;
        refreshWorkspaceStatusButton.textContent = 'Refresh Status';
    }
}

function showWorkspaceDetails(index) {
    try {
        const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
        
        if (index >= 0 && index < workspaces.length) {
            const workspace = workspaces[index];
            
            // Generate access URL
            const projectName = workspace.full_config.repository ? 
                workspace.full_config.repository.split('/').pop().replace('.git', '') : 
                workspace.workspace_name;
            const accessURL = `http://localhost:${workspace.full_config.http_port}/?folder=/home/workspace/${projectName}`;
            
            // Get status information from the workspace object or selected option
            let statusInfo = 'Status: Unknown';
            
            if (workspace.status) {
                // Use saved status from localStorage
                const statusIcon = workspace.status.is_running ? '🟢' : '🔴';
                const lastCheck = workspace.last_status_check ? 
                    new Date(workspace.last_status_check).toLocaleString() : 'Never';
                statusInfo = `Status: ${statusIcon} ${workspace.status.is_running ? 'Running' : 'Stopped'} (${workspace.status.container_info})
Last checked: ${lastCheck}`;
            } else {
                // Fallback to option data
                const selectedOption = workspacesList.children[index];
                const statusData = selectedOption ? selectedOption.getAttribute('data-status') : null;
                
                if (statusData) {
                    try {
                        const status = JSON.parse(statusData);
                        const statusIcon = status.is_running ? '🟢' : '🔴';
                        statusInfo = `Status: ${statusIcon} ${status.is_running ? 'Running' : 'Stopped'} (${status.container_info})`;
                    } catch (e) {
                        statusInfo = 'Status: Checking...';
                    }
                }
            }
            
            // Show and configure the access link
            workspaceAccessLink.style.display = 'inline-block';
            workspaceAccessLink.href = accessURL;
            workspaceAccessLink.title = `Open ${workspace.workspace_name} Web IDE`;
            
            // Debug logging
            console.log('Setting workspace access link:', accessURL);
            
            // Remove any existing click handlers and add a new one
            workspaceAccessLink.onclick = function(e) {
                e.preventDefault();
                console.log('Workspace access link clicked:', accessURL);
                
                // Try different methods to open the URL
                try {
                    // Method 1: Try using Docker Desktop client API if available
                    if (ddClient && ddClient.host && ddClient.host.openExternal) {
                        ddClient.host.openExternal(accessURL);
                    } else {
                        // Method 2: Direct window.open
                        const newWindow = window.open(accessURL, '_blank', 'noopener,noreferrer');
                        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                            // Method 3: Create a temporary link and click it
                            const tempLink = document.createElement('a');
                            tempLink.href = accessURL;
                            tempLink.target = '_blank';
                            tempLink.rel = 'noopener noreferrer';
                            document.body.appendChild(tempLink);
                            tempLink.click();
                            document.body.removeChild(tempLink);
                        }
                    }
                } catch (error) {
                    console.error('Error opening workspace URL:', error);
                    // Show a user-friendly modal or alert with the URL
                    if (confirm(`Unable to automatically open the workspace. Would you like to copy the URL to clipboard?\n\nURL: ${accessURL}`)) {
                        navigator.clipboard.writeText(accessURL).then(() => {
                            alert('URL copied to clipboard!');
                        }).catch(() => {
                            prompt('Please copy this URL manually:', accessURL);
                        });
                    }
                }
            };
            
            // Format workspace details
            const details = `Workspace Name: ${workspace.workspace_name}
Repository: ${workspace.repository}
Created: ${new Date(workspace.created_at).toLocaleString()}
${statusInfo}
Access URL: ${accessURL}

Full Configuration:
${JSON.stringify(workspace.full_config, null, 2)}`;
            
            workspaceDetails.value = details;
        } else {
            workspaceDetails.value = '';
            workspaceAccessLink.style.display = 'none';
            workspaceAccessLink.onclick = null; // Clean up click handler
        }
        
    } catch (error) {
        console.error('Error showing workspace details:', error);
        workspaceDetails.value = 'Error loading workspace details...';
        workspaceAccessLink.style.display = 'none';
        workspaceAccessLink.onclick = null; // Clean up click handler
    }
}

function clearWorkspacesList() {
    if (confirm('Are you sure you want to clear all workspace records? This will not delete the actual workspaces, only the list.')) {
        localStorage.removeItem('composeCodexWorkspaces');
        populateWorkspacesList();
        workspaceDetails.value = '';
        workspaceAccessLink.style.display = 'none';
        workspaceAccessLink.onclick = null;
    }
}

async function regenerateWorkspacesList() {
    try {
        // Disable button and show loading state
        regenerateWorkspacesListButton.disabled = true;
        regenerateWorkspacesListButton.textContent = 'Loading...';
        
        // Get projects directory from form or use default
        const projectsDirectory = document.getElementById('projectsDirectory').value || 'projects';
        
        console.log('Regenerating workspaces list for directory:', projectsDirectory);
        
        // Send POST request to /workspace/list endpoint
        const result = await ddClient.extension.vm.service.post('/workspace/list', {
            projects_directory: projectsDirectory
        });
        
        console.log('Workspace list response:', result);
        
        if (result && result.status === 'success' && result.workspaces) {
            // Parse the workspaces JSON string
            const workspacesList = JSON.parse(result.workspaces);
            
            if (Array.isArray(workspacesList) && workspacesList.length > 0) {
                // Get existing workspaces to preserve any existing configuration
                const existingWorkspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
                const existingWorkspaceMap = new Map();
                existingWorkspaces.forEach(ws => {
                    existingWorkspaceMap.set(ws.workspace_name, ws);
                });
                
                // Create workspace entries for localStorage
                const regeneratedWorkspaces = workspacesList.map(workspaceName => {
                    const existingWorkspace = existingWorkspaceMap.get(workspaceName);
                    
                    // If workspace exists, preserve its configuration AND status
                    if (existingWorkspace) {
                        return {
                            ...existingWorkspace,
                            created_at: existingWorkspace.created_at || new Date().toISOString(), // Preserve original creation date
                            status: existingWorkspace.status, // Preserve status
                            last_status_check: existingWorkspace.last_status_check // Preserve last check time
                        };
                    }
                    
                    // Create new workspace entry with default values
                    return {
                        workspace_name: workspaceName,
                        repository: 'unknown', // We don't have this info from the list endpoint
                        created_at: new Date().toISOString(),
                        full_config: {
                            workspace_name: workspaceName,
                            projects_directory: projectsDirectory,
                            repository: 'unknown',
                            http_port: 8080 + Math.floor(Math.random() * 1000), // Random port between 8080-9080
                            dockerfile_name: '_.Dockerfile',
                            compose_file_name: 'compose.yml',
                            offload_override_name: 'compose.offload.yml',
                            key_name: '',
                            git_user_email: '',
                            git_user_name: '',
                            git_host: 'github.com',
                            mcp_server_url: 'http://host.docker.internal:9090/mcp'
                        }
                    };
                });
                
                // Remove any potential duplicates by workspace name
                const uniqueWorkspaces = [];
                const seenNames = new Set();
                
                for (const workspace of regeneratedWorkspaces) {
                    if (!seenNames.has(workspace.workspace_name)) {
                        seenNames.add(workspace.workspace_name);
                        uniqueWorkspaces.push(workspace);
                    }
                }
                
                console.log(`Filtered ${regeneratedWorkspaces.length} workspaces down to ${uniqueWorkspaces.length} unique workspaces`);
                
                // Save to localStorage
                localStorage.setItem('composeCodexWorkspaces', JSON.stringify(uniqueWorkspaces));
                
                // Refresh the workspaces list display
                populateWorkspacesList();
                
                const newWorkspaces = uniqueWorkspaces.filter(ws => !existingWorkspaceMap.has(ws.workspace_name));
                const preservedWorkspaces = uniqueWorkspaces.filter(ws => existingWorkspaceMap.has(ws.workspace_name));
                
                let message = `Successfully regenerated workspace list with ${uniqueWorkspaces.length} workspace(s).`;
                if (newWorkspaces.length > 0) {
                    message += `\n- New workspaces found: ${newWorkspaces.length}`;
                }
                if (preservedWorkspaces.length > 0) {
                    message += `\n- Existing configurations preserved: ${preservedWorkspaces.length}`;
                }
                message += `\n\nChecking workspace statuses...`;
                alert(message);
            } else {
                alert('No workspaces found in the projects directory.');
            }
        } else {
            throw new Error(result?.message || 'Invalid response from server');
        }
        
    } catch (error) {
        console.error('Failed to regenerate workspaces list:', error);
        alert(`Error regenerating workspace list: ${error.message || 'Unknown error occurred'}`);
        
    } finally {
        // Re-enable button
        regenerateWorkspacesListButton.disabled = false;
        regenerateWorkspacesListButton.textContent = 'Rebuild';
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
    
    let pollInterval; // Declare in function scope
    
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

        // Show the build progress modal
        showBuildModal();

        console.log('Starting selected workspace with build progress modal...', workspace.full_config.workspace_name);

        // Since Docker extension doesn't support EventSource directly, we'll use polling instead
        let currentProgress = 0;
        
        const progressMessages = [
            'Initializing workspace...',
            'Preparing Docker build context...',
            'Building Docker image...',
            'Downloading base images...',
            'Installing dependencies...',
            'Setting up development environment...',
            'Starting containers...',
            'Configuring workspace settings...',
            'Almost ready...',
            'Finalizing setup...'
        ];
        
        let messageIndex = 0;
        
        const pollProgress = async () => {
            try {
                // Simulate progress updates while calling the regular start endpoint
                if (currentProgress < 90) {
                    currentProgress += Math.random() * 15 + 5; // Random increment between 5-20%
                    if (currentProgress > 90) currentProgress = 90;
                    
                    // Update message occasionally
                    if (Math.random() < 0.4 && messageIndex < progressMessages.length - 1) {
                        messageIndex++;
                    }
                    
                    updateBuildProgress(currentProgress, progressMessages[messageIndex]);
                }
            } catch (error) {
                console.error('Progress polling error:', error);
            }
        };
        
        // Start polling progress every 800ms for more realistic timing
        pollInterval = setInterval(pollProgress, 800);
        
        try {
            // Send the actual start request
            const startData = {
                projects_directory: workspace.full_config.projects_directory,
                workspace_name: workspace.full_config.workspace_name,
                repository: workspace.full_config.repository,
                http_port: workspace.full_config.http_port,
                mcp_server_url: workspace.full_config.mcp_server_url || 'http://host.docker.internal:9090/mcp'
            };
            
            const result = await ddClient.extension.vm.service.post('/workspace/start', startData);
            
            // Clear polling and show completion
            clearInterval(pollInterval);
            updateBuildProgress(100, 'Workspace started successfully!');
            
            // Display the response
            workspaceDetails.value = `Start Result:\n${JSON.stringify(result, null, 2)}`;
            
            // Update workspace status to running
            const runningStatus = {
                status: 'success',
                is_running: true,
                container_info: 'Started successfully',
                workspace_name: workspace.workspace_name
            };
            await updateWorkspaceStatus(workspace.workspace_name, runningStatus);
            
            setTimeout(() => {
                hideBuildModal();
            }, 2000);
            
        } catch (error) {
            clearInterval(pollInterval);
            throw error;
        }
        
    } catch (error) {
        // Display error
        workspaceDetails.value = `Error starting workspace: ${error.message || 'Unknown error occurred'}`;
        console.error('Start workspace failed:', error);
        hideBuildModal();
        
        // Update workspace status to error
        try {
            const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
            const workspace = workspaces[selectedIndex];
            if (workspace) {
                const errorStatus = {
                    status: 'error',
                    is_running: false,
                    container_info: 'Start failed: ' + (error.message || 'Unknown error'),
                    workspace_name: workspace.workspace_name
                };
                await updateWorkspaceStatus(workspace.workspace_name, errorStatus);
            }
        } catch (statusError) {
            console.error('Error updating status after start failure:', statusError);
        }
        
    } finally {
        // Clear any ongoing polling intervals
        if (pollInterval) {
            clearInterval(pollInterval);
        }
        // Re-enable button
        startSelectedWorkspaceButton.disabled = false;
        startSelectedWorkspaceButton.textContent = 'Start';
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
        
        // Update workspace status to stopped
        const stoppedStatus = {
            status: 'success',
            is_running: false,
            container_info: 'Stopped successfully',
            workspace_name: workspace.workspace_name
        };
        await updateWorkspaceStatus(workspace.workspace_name, stoppedStatus);
        
    } catch (error) {
        // Display error
        workspaceDetails.value = `Error stopping workspace: ${error.message || 'Unknown error occurred'}`;
        console.error('Stop workspace failed:', error);
        
        // Update workspace status to error
        try {
            const errorStatus = {
                status: 'error',
                is_running: false, // Assume stopped on error
                container_info: 'Stop failed: ' + (error.message || 'Unknown error'),
                workspace_name: workspace.workspace_name
            };
            await updateWorkspaceStatus(workspace.workspace_name, errorStatus);
        } catch (statusError) {
            console.error('Error updating status after stop failure:', statusError);
        }
        
    } finally {
        // Re-enable button
        stopSelectedWorkspaceButton.disabled = false;
        stopSelectedWorkspaceButton.textContent = 'Stop';
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
        removeSelectedWorkspaceButton.textContent = 'Remove';
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
        workspaceAccessLink.style.display = 'none';
        workspaceAccessLink.onclick = null;
        enableWorkspaceButtons(false);
    }
});

clearWorkspacesListButton.addEventListener('click', clearWorkspacesList);
regenerateWorkspacesListButton.addEventListener('click', regenerateWorkspacesList);
refreshWorkspaceStatusButton.addEventListener('click', refreshWorkspaceStatuses);
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

// Clean up any duplicate workspaces first
cleanupDuplicateWorkspaces();

// Debug: Log current workspace status from localStorage
const currentWorkspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
console.log('Loaded workspaces from localStorage:', currentWorkspaces.map(ws => ({
    name: ws.workspace_name,
    hasStatus: !!ws.status,
    isRunning: ws.status?.is_running,
    lastCheck: ws.last_status_check
})));

// Populate Dockerfiles dropdown on page load
populateDockerfilesDropdown();

// Populate workspaces list on page load
populateWorkspacesList();

// Save workspace statuses before user leaves the page
window.addEventListener('beforeunload', () => {
    console.log('Page unloading, ensuring workspace statuses are saved');
    saveAllWorkspaceStatuses();
});

// Also save periodically (every 30 seconds)
setInterval(() => {
    console.log('Periodic save of workspace statuses');
    saveAllWorkspaceStatuses();
}, 30000);

// Repopulate workspace list when user comes back to this tab/extension
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('Page became visible, repopulating workspace list');
        populateWorkspacesList();
    }
});

// Also listen for focus events
window.addEventListener('focus', () => {
    console.log('Window gained focus, repopulating workspace list');
    populateWorkspacesList();
});

// Debug function to check localStorage state (can be called from browser console)
window.debugWorkspaces = function() {
    const workspaces = JSON.parse(localStorage.getItem('composeCodexWorkspaces') || '[]');
    console.log('=== Workspace Debug Info ===');
    console.log(`Total workspaces in localStorage: ${workspaces.length}`);
    workspaces.forEach((ws, index) => {
        console.log(`${index + 1}. ${ws.workspace_name}`, {
            repository: ws.repository,
            hasStatus: !!ws.status,
            isRunning: ws.status?.is_running,
            lastCheck: ws.last_status_check,
            created: ws.created_at
        });
    });
    console.log('=== End Debug Info ===');
    return workspaces;
};