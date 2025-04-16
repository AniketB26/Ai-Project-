// Ollama API configuration
exports.OLLAMA_API_URL = 'http://localhost:11434/api/chat';

// Optional: Ollama configuration settings
exports.OLLAMA_CONFIG = {
    model: 'llama2',
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048
}; 