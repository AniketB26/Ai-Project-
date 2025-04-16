class ModernChatbot {
    constructor() {
        this.chatContainer = document.getElementById('chat-container');
        this.chatForm = document.getElementById('chat-form');
        this.userInput = document.getElementById('user-input');
        this.materialBtn = document.getElementById('material-btn');
        this.isMaterialMode = false;
        this.chatHistory = [];
        this.isTyping = false;
        this.userId = this.generateUserId();
        this.init();
    }

    generateUserId() {
        // Generate a simple random ID or use one from localStorage if present
        let userId = localStorage.getItem('chatbot_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('chatbot_user_id', userId);
        }
        return userId;
    }

    init() {
        this.addMessage('bot', 'Hello! I\'m your AI assistant. How can I help you today? 🤖');
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add clear chat functionality
        const clearChatButton = document.getElementById('clear-chat');
        if (clearChatButton) {
            clearChatButton.addEventListener('click', () => this.clearChat());
        }

        // Add material button functionality
        this.materialBtn.addEventListener('click', () => this.toggleMaterialMode());
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle enter key for sending messages
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.chatForm.dispatchEvent(new Event('submit'));
            }
        });

        // Auto-resize textarea
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = this.userInput.scrollHeight + 'px';
        });
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        if (type === 'bot') {
            messageDiv.innerHTML = this.formatBotMessage(content);
        } else {
            messageDiv.innerHTML = this.formatUserMessage(content);
        }
        
        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        
        // Add to chat history
        this.chatHistory.push({ type, content, timestamp: new Date() });
    }

    formatBotMessage(content) {
        return `
            <div class="message-content">
                <div class="message-avatar">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <div class="message-text">${this.formatMarkdown(content)}</div>
            </div>
        `;
    }

    formatUserMessage(content) {
        return `
            <div class="message-content user">
                <div class="message-avatar">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <div class="message-text">${this.escapeHtml(content)}</div>
            </div>
        `;
    }

    formatMarkdown(text) {
        // Simple markdown formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        this.isTyping = true;
        
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator message';
        indicator.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        this.chatContainer.appendChild(indicator);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        return indicator;
    }

    toggleMaterialMode() {
        this.isMaterialMode = !this.isMaterialMode;
        if (this.isMaterialMode) {
            this.materialBtn.classList.add('bg-green-600');
            this.userInput.placeholder = 'Enter materials (comma separated)...';
        } else {
            this.materialBtn.classList.remove('bg-green-600');
            this.userInput.placeholder = 'Type your message...';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        const userMessage = this.userInput.value.trim();
        if (!userMessage) return;

        // Clear input and reset height
        this.userInput.value = '';
        this.userInput.style.height = 'auto';

        // Add user message to chat
        this.addMessage('user', userMessage);

        // Show typing indicator
        const typingIndicator = this.showTypingIndicator();

        try {
            let response;
            if (this.isMaterialMode) {
                // Handle material input
                const materials = userMessage.split(',').map(m => m.trim());
                response = await this.fetchExperiments(materials);
                this.isMaterialMode = false;
                this.materialBtn.classList.remove('bg-green-600');
                this.userInput.placeholder = 'Type your message...';
            } else {
                // Handle normal chat
                response = await this.fetchResponse(userMessage);
            }
            
            typingIndicator.remove();
            this.isTyping = false;
            this.addMessage('bot', response);
        } catch (error) {
            typingIndicator.remove();
            this.isTyping = false;
            this.addMessage('bot', 'I apologize, but I encountered an error. Please try again.');
            console.error('Error:', error);
        }
    }

    async fetchResponse(message) {
        try {
            // Format all messages in the history for the API
            const apiMessages = this.chatHistory.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));

            // Add the new user message
            apiMessages.push({
                role: 'user',
                content: message
            });

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message, 
                    messages: apiMessages,
                    userId: this.userId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error fetching response:', error);
            throw error;
        }
    }

    async fetchExperiments(materials, category = 'all', retries = 3, delay = 1000) {
        const prompt = `
            You are a science experiment assistant. Suggest about 5 science experiments that can be performed using the following materials: ${materials.join(', ')}.
            ${category !== 'all' ? `Focus on experiments in the ${category} category.` : 'Experiments can be from any category (e.g., chemistry, physics, biology).'}
            For each experiment, provide:
            - A name
            - A brief description
            - The list of materials used (as an array)
            - The category of the experiment
            - A list of steps to perform the experiment (as an array of strings)
            If no experiments can be suggested with the given materials, return an empty experiments array: {"experiments": []}.
            Return the response in JSON format, enclosed in \`\`\`json and \`\`\` markers, with the following structure:
            \`\`\`json
            {
                "experiments": [
                    {
                        "name": "Experiment Name",
                        "description": "Description here",
                        "materials": ["material1", "material2"],
                        "category": "category",
                        "steps": ["Step 1: Do this", "Step 2: Do that"]
                    }
                ]
            }
            \`\`\`
        `;

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: prompt,
                        userId: this.userId
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data.response;
            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    clearChat() {
        // Clear UI
        this.chatContainer.innerHTML = '';
        
        // Keep only the system message if there is one
        const systemMessage = this.chatHistory.find(msg => msg.type === 'system');
        
        // Reset chat history
        this.chatHistory = systemMessage ? [systemMessage] : [];
        
        // Add welcome message
        this.addMessage('bot', 'Chat cleared. How can I help you today? 🤖');
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new ModernChatbot();
});

// Wrapper function for fetching experiments
async function fetchExperiments(materials, category = 'all', retries = 3, delay = 1000) {
    const prompt = `
        You are a science experiment assistant. Suggest about 5 science experiments that can be performed using the following materials: ${materials.join(', ')}.
        ${category !== 'all' ? `Focus on experiments in the ${category} category.` : 'Experiments can be from any category (e.g., chemistry, physics, biology).'}
        For each experiment, provide:
        - A name
        - A brief description
        - The list of materials used (as an array)
        - The category of the experiment
        - A list of steps to perform the experiment (as an array of strings)
        If no experiments can be suggested with the given materials, return an empty experiments array: {"experiments": []}.
        Return the response in JSON format, enclosed in \`\`\`json and \`\`\` markers, with the following structure:
        \`\`\`json
        {
            "experiments": [
                {
                    "name": "Experiment Name",
                    "description": "Description here",
                    "materials": ["material1", "material2"],
                    "category": "category",
                    "steps": ["Step 1: Do this", "Step 2: Do that"]
                }
            ]
        }
        \`\`\`
    `;

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: prompt,
                    userId: getUserId()
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Add material mode state
let isMaterialMode = false;

// Handle material button click
document.getElementById('material-btn').addEventListener('click', () => {
    isMaterialMode = !isMaterialMode;
    const materialBtn = document.getElementById('material-btn');
    const userInput = document.getElementById('user-input');
    
    if (isMaterialMode) {
        materialBtn.classList.add('bg-green-600');
        userInput.placeholder = 'Enter materials (comma separated)...';
    } else {
        materialBtn.classList.remove('bg-green-600');
        userInput.placeholder = 'Type your message...';
    }
});

// Modify the existing chat form submission
document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (!message) return;

    if (isMaterialMode) {
        // Handle material input
        const materials = message.split(',').map(m => m.trim());
        try {
            const experiments = await fetchExperiments(materials);
            addMessage('assistant', experiments);
        } catch (error) {
            console.error('Error fetching experiments:', error);
            addMessage('assistant', 'Sorry, I encountered an error while processing your materials.');
        }
        isMaterialMode = false;
        document.getElementById('material-btn').classList.remove('bg-green-600');
        userInput.placeholder = 'Type your message...';
    } else {
        // Handle normal chat
        addMessage('user', message);
        userInput.value = '';
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    userId: getUserId()
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            addMessage('assistant', data.response);
        } catch (error) {
            console.error('Error:', error);
            addMessage('assistant', 'Sorry, I encountered an error while processing your message.');
        }
    }
}); 