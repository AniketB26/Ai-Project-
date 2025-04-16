const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

const logService = {
    logUserMessage: (userId, message) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            userId,
            type: 'user',
            message
        };
        appendToLog(logEntry);
    },

    logAIResponse: (userId, message) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            userId,
            type: 'ai',
            message
        };
        appendToLog(logEntry);
    },

    logError: (userId, error, context) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            userId,
            type: 'error',
            error: error.message || String(error),
            context
        };
        appendToLog(logEntry);
    }
};

function appendToLog(logEntry) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(logsDir, `chat_log_${date}.json`);
    
    let logs = [];
    
    // Read existing logs if file exists
    if (fs.existsSync(logFile)) {
        try {
            const fileContent = fs.readFileSync(logFile, 'utf8');
            logs = JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading log file:', error);
        }
    }
    
    // Add new log entry
    logs.push(logEntry);
    
    // Write updated logs back to file
    try {
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

module.exports = logService; 