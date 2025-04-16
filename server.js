const http = require('http');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Import Ollama configuration
const { OLLAMA_API_URL, OLLAMA_CONFIG } = require('./config');
// Import logging service
const logService = require('./logService');

const server = http.createServer((req, res) => {
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const requestData = JSON.parse(body);
                const { message, messages } = requestData;
                const userId = requestData.userId || 'anonymous';
                
                console.log('Querying Ollama with message:', message);
                // Log user message
                logService.logUserMessage(userId, message);
                
                // Use the full conversation history if available, otherwise just the single message
                const ollamaMessages = messages || [
                    {
                        role: "user",
                        content: message
                    }
                ];
                
                const response = await fetch(OLLAMA_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: OLLAMA_CONFIG.model,
                        messages: ollamaMessages,
                        stream: false,
                        temperature: OLLAMA_CONFIG.temperature,
                        top_p: OLLAMA_CONFIG.top_p,
                        max_tokens: OLLAMA_CONFIG.max_tokens
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                if (!data.message || !data.message.content) {
                    throw new Error('Invalid response format from AI');
                }

                const aiResponseText = data.message.content.trim();
                console.log('Response received from Ollama');
                
                // Log AI response
                logService.logAIResponse(userId, aiResponseText);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response: aiResponseText }));
                
            } catch (error) {
                console.error('Error:', error);
                // Log error
                logService.logError('anonymous', error, 'Error in chat API endpoint');
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
            }
        });
        return;
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './chatbot.html';
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
}); 