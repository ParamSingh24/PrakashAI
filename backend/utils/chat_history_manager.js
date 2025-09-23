const fs = require('fs');
const path = require('path');

class ChatHistoryManager {
    constructor() {
        this.chatHistoryPath = path.join(__dirname, '../data/chat_history.json');
    }

    // Load chat history from file
    loadChatHistory() {
        try {
            if (fs.existsSync(this.chatHistoryPath)) {
                const data = fs.readFileSync(this.chatHistoryPath, 'utf-8');
                return data.trim() === '' ? [] : JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error('Error loading chat history:', error);
            return [];
        }
    }

    // Save chat history to file
    saveChatHistory(history) {
        try {
            fs.writeFileSync(this.chatHistoryPath, JSON.stringify(history, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving chat history:', error);
            return false;
        }
    }

    // Add a new chat entry
    addChatEntry(userMessage, aiResponse, toolCalls = []) {
        const chatEntry = {
            timestamp: new Date().toISOString(),
            user_message: userMessage,
            ai_response: aiResponse,
            tool_calls: toolCalls,
            session_id: Date.now().toString()
        };

        const chatHistory = this.loadChatHistory();
        chatHistory.push(chatEntry);

        // Keep only the last 1000 entries
        if (chatHistory.length > 1000) {
            chatHistory.splice(0, chatHistory.length - 1000);
        }

        return this.saveChatHistory(chatHistory);
    }

    // Get recent chat entries
    getRecentChats(count = 10) {
        const chatHistory = this.loadChatHistory();
        return chatHistory.slice(-count);
    }

    // Search chat history
    searchChats(query) {
        const chatHistory = this.loadChatHistory();
        const lowerQuery = query.toLowerCase();
        
        return chatHistory.filter(chat => 
            chat.user_message.toLowerCase().includes(lowerQuery) || 
            chat.ai_response.toLowerCase().includes(lowerQuery) ||
            (chat.tool_calls && chat.tool_calls.some(tool => 
                tool.tool_name.toLowerCase().includes(lowerQuery)
            ))
        );
    }

    // Get chat statistics
    getStats() {
        const chatHistory = this.loadChatHistory();
        
        const stats = {
            totalChats: chatHistory.length,
            totalToolCalls: chatHistory.reduce((sum, chat) => sum + (chat.tool_calls?.length || 0), 0),
            averageToolCallsPerChat: 0,
            mostUsedTools: {},
            chatsByDate: {},
            averageResponseLength: 0,
            totalConversationTime: 0
        };

        if (chatHistory.length > 0) {
            // Calculate averages
            stats.averageToolCallsPerChat = (stats.totalToolCalls / chatHistory.length).toFixed(2);
            
            const totalResponseLength = chatHistory.reduce((sum, chat) => sum + chat.ai_response.length, 0);
            stats.averageResponseLength = Math.round(totalResponseLength / chatHistory.length);

            // Analyze tool usage
            chatHistory.forEach(chat => {
                if (chat.tool_calls && chat.tool_calls.length > 0) {
                    chat.tool_calls.forEach(toolCall => {
                        const toolName = toolCall.tool_name;
                        stats.mostUsedTools[toolName] = (stats.mostUsedTools[toolName] || 0) + 1;
                    });
                }
                
                // Group by date
                const date = new Date(chat.timestamp).toDateString();
                stats.chatsByDate[date] = (stats.chatsByDate[date] || 0) + 1;
            });

            // Calculate conversation timespan
            if (chatHistory.length > 1) {
                const firstChat = new Date(chatHistory[0].timestamp);
                const lastChat = new Date(chatHistory[chatHistory.length - 1].timestamp);
                stats.totalConversationTime = Math.round((lastChat - firstChat) / (1000 * 60 * 60 * 24)); // days
            }
        }

        return stats;
    }

    // Clear all chat history
    clearHistory() {
        return this.saveChatHistory([]);
    }

    // Export chat history with metadata
    exportHistory() {
        const chatHistory = this.loadChatHistory();
        const stats = this.getStats();
        
        return {
            exportDate: new Date().toISOString(),
            metadata: {
                totalEntries: chatHistory.length,
                dateRange: chatHistory.length > 0 ? {
                    from: chatHistory[0].timestamp,
                    to: chatHistory[chatHistory.length - 1].timestamp
                } : null,
                statistics: stats
            },
            chatHistory: chatHistory
        };
    }

    // Convert chat history to Gemini conversation format
    toGeminiFormat(maxEntries = 10) {
        const chatHistory = this.loadChatHistory();
        const recentChats = chatHistory.slice(-maxEntries);
        const geminiHistory = [];
        
        recentChats.forEach(chat => {
            geminiHistory.push({ role: "user", parts: [{ text: chat.user_message }] });
            geminiHistory.push({ role: "model", parts: [{ text: chat.ai_response }] });
        });
        
        return geminiHistory;
    }
}

module.exports = ChatHistoryManager;