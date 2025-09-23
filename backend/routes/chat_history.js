const express = require('express');
const router = express.Router();
const ChatHistoryManager = require('../utils/chat_history_manager');

const chatHistoryManager = new ChatHistoryManager();

// Get all chat history
router.get('/', (req, res) => {
    try {
        const chatHistory = chatHistoryManager.loadChatHistory();
        res.json({ chatHistory, total: chatHistory.length });
    } catch (error) {
        console.error('Error reading chat history:', error);
        res.status(500).json({ error: 'Failed to read chat history' });
    }
});

// Get recent chat history (last N messages)
router.get('/recent/:count', (req, res) => {
    try {
        const count = parseInt(req.params.count) || 10;
        const recentChats = chatHistoryManager.getRecentChats(count);
        res.json({ chatHistory: recentChats, total: recentChats.length });
    } catch (error) {
        console.error('Error reading recent chat history:', error);
        res.status(500).json({ error: 'Failed to read recent chat history' });
    }
});

// Clear chat history
router.delete('/', (req, res) => {
    try {
        chatHistoryManager.clearHistory();
        res.json({ message: 'Chat history cleared successfully' });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
});

// Get chat statistics
router.get('/stats', (req, res) => {
    try {
        const stats = chatHistoryManager.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting chat statistics:', error);
        res.status(500).json({ error: 'Failed to get chat statistics' });
    }
});

// Export chat history as JSON file
router.get('/export', (req, res) => {
    try {
        const exportData = chatHistoryManager.exportHistory();
        
        if (exportData.chatHistory.length === 0) {
            return res.status(404).json({ error: 'No chat history found' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="chat_history_${new Date().toISOString().split('T')[0]}.json"`);
        res.json(exportData);
    } catch (error) {
        console.error('Error exporting chat history:', error);
        res.status(500).json({ error: 'Failed to export chat history' });
    }
});

// Search chat history
router.get('/search/:query', (req, res) => {
    try {
        const query = req.params.query;
        const results = chatHistoryManager.searchChats(query);
        res.json({ results, total: results.length, query });
    } catch (error) {
        console.error('Error searching chat history:', error);
        res.status(500).json({ error: 'Failed to search chat history' });
    }
});

module.exports = router;