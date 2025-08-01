import { createDockerDesktopClient } from './docker-extension-api-client.js';

// Create Docker Desktop client
const ddClient = createDockerDesktopClient();

// Get DOM elements
const callBackendButton = document.getElementById('callBackend');
const responseTextarea = document.getElementById('response');
const configForm = document.getElementById('configForm');
const configResponseTextarea = document.getElementById('configResponse');
const submitConfigButton = document.getElementById('submitConfig');
const startWorkspaceButton = document.getElementById('startWorkspace');
const stopWorkspaceButton = document.getElementById('stopWorkspace');
const clearTestResponseButton = document.getElementById('clearTestResponse');
const clearConfigResponseButton = document.getElementById('clearConfigResponse');
const chatQuestionTextarea = document.getElementById('chatQuestion');
const chatResponseTextarea = document.getElementById('chatResponse');
const askQuestionButton = document.getElementById('askQuestion');
const clearChatResponseButton = document.getElementById('clearChatResponse');

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
        // Disable button and show loading state
        submitConfigButton.disabled = true;
        submitConfigButton.textContent = 'Creating Workspace...';
        configResponseTextarea.value = 'Sending configuration...';

        // Collect form data
        const configData = getConfigData();
        console.log('Sending config:', configData);

        // Send POST request to /config endpoint
        const result = await ddClient.extension.vm.service.post('/config', configData);
        
        // Display the response
        configResponseTextarea.value = JSON.stringify(result, null, 2);
        
    } catch (error) {
        // Display error
        configResponseTextarea.value = `Error: ${error.message || 'Unknown error occurred'}`;
        console.error('Config submission failed:', error);
        
    } finally {
        // Re-enable button
        submitConfigButton.disabled = false;
        submitConfigButton.textContent = 'Create Workspace';
    }
});

// Helper function to collect form data
function getConfigData() {
    const formData = new FormData(configForm);
    const configData = {};
    
    for (const [key, value] of formData.entries()) {
        // Convert http_port to number
        if (key === 'http_port') {
            configData[key] = parseInt(value, 10);
        } else {
            configData[key] = value;
        }
    }
    
    return configData;
}

// Handle start workspace button click
startWorkspaceButton.addEventListener('click', async () => {
    try {
        // Disable button and show loading state
        startWorkspaceButton.disabled = true;
        startWorkspaceButton.textContent = 'Starting...';
        configResponseTextarea.value = 'Starting workspace...';

        // Collect form data
        const configData = getConfigData();
        console.log('Starting workspace with config:', configData);

        // Send POST request to /workspace/start endpoint
        const result = await ddClient.extension.vm.service.post('/workspace/start', configData);
        
        // Display the response
        configResponseTextarea.value = JSON.stringify(result, null, 2);
        
    } catch (error) {
        // Display error
        configResponseTextarea.value = `Error: ${error.message || 'Unknown error occurred'}`;
        console.error('Start workspace failed:', error);
        
    } finally {
        // Re-enable button
        startWorkspaceButton.disabled = false;
        startWorkspaceButton.textContent = 'Start Workspace';
    }
});

// Handle stop workspace button click
stopWorkspaceButton.addEventListener('click', async () => {
    try {
        // Disable button and show loading state
        stopWorkspaceButton.disabled = true;
        stopWorkspaceButton.textContent = 'Stopping...';
        configResponseTextarea.value = 'Stopping workspace...';

        // Collect form data
        const configData = getConfigData();
        console.log('Stopping workspace with config:', configData);

        // Send POST request to /workspace/stop endpoint
        const result = await ddClient.extension.vm.service.post('/workspace/stop', configData);
        
        // Display the response
        configResponseTextarea.value = JSON.stringify(result, null, 2);
        
    } catch (error) {
        // Display error
        configResponseTextarea.value = `Error: ${error.message || 'Unknown error occurred'}`;
        console.error('Stop workspace failed:', error);
        
    } finally {
        // Re-enable button
        stopWorkspaceButton.disabled = false;
        stopWorkspaceButton.textContent = 'Stop Workspace';
    }
});

// Handle clear buttons
clearTestResponseButton.addEventListener('click', () => {
    responseTextarea.value = '';
});

clearConfigResponseButton.addEventListener('click', () => {
    configResponseTextarea.value = '';
});

clearChatResponseButton.addEventListener('click', () => {
    chatResponseTextarea.value = '';
});

// Handle ask question button click
askQuestionButton.addEventListener('click', async () => {
    const question = chatQuestionTextarea.value.trim();
    
    if (!question) {
        chatResponseTextarea.value = 'Please enter a question first.';
        return;
    }
    
    try {
        // Disable button and show loading state
        askQuestionButton.disabled = true;
        askQuestionButton.textContent = 'Asking...';
        chatResponseTextarea.value = 'Processing your question...';

        // Send POST request to /chat endpoint
        const result = await ddClient.extension.vm.service.post('/chat', {
            question: question
        });
        
        // Display the response
        if (result && result.answer) {
            chatResponseTextarea.value = result.answer;
        } else {
            chatResponseTextarea.value = JSON.stringify(result, null, 2);
        }
        
    } catch (error) {
        // Display error
        chatResponseTextarea.value = `Error: ${error.message || 'Unknown error occurred'}`;
        console.error('Chat request failed:', error);
        
    } finally {
        // Re-enable button
        askQuestionButton.disabled = false;
        askQuestionButton.textContent = 'Ask Question';
    }
});

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
    const formInputs = configForm.querySelectorAll('input');
    formInputs.forEach(input => {
        input.addEventListener('input', saveFormData);
        input.addEventListener('change', saveFormData);
    });
}

// Initialize
console.log('Compose Codex extension loaded');

// Load saved form data and setup auto-save
loadFormData();
setupAutoSave();