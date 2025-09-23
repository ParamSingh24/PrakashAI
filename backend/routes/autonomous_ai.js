const express = require('express');
const router = express.Router();
const { runAutonomousAnalysis, getAutonomousStats, loadAutonomousLog } = require('../autonomous_ai/autonomous_gemini');

// Trigger autonomous analysis manually
router.post('/analyze', async (req, res) => {
    try {
        console.log('[API] Manual autonomous analysis triggered');
        const result = await runAutonomousAnalysis();
        res.json({
            success: true,
            message: 'Autonomous analysis completed',
            result: result
        });
    } catch (error) {
        console.error('Error running autonomous analysis:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to run autonomous analysis',
            details: error.message 
        });
    }
});

// Get autonomous AI statistics
router.get('/stats', (req, res) => {
    try {
        const stats = getAutonomousStats();
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Error getting autonomous AI stats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get autonomous AI statistics' 
        });
    }
});

// Get autonomous AI execution log
router.get('/log', (req, res) => {
    try {
        const log = loadAutonomousLog();
        res.json({
            success: true,
            log: log,
            total: log.length
        });
    } catch (error) {
        console.error('Error getting autonomous AI log:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get autonomous AI log' 
        });
    }
});

// Get recent autonomous AI log entries
router.get('/log/recent/:count', (req, res) => {
    try {
        const count = parseInt(req.params.count) || 10;
        const log = loadAutonomousLog();
        const recentEntries = log.slice(-count);
        
        res.json({
            success: true,
            log: recentEntries,
            total: recentEntries.length,
            totalEntries: log.length
        });
    } catch (error) {
        console.error('Error getting recent autonomous AI log:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get recent autonomous AI log' 
        });
    }
});

// Get autonomous AI status
router.get('/status', (req, res) => {
    try {
        const stats = getAutonomousStats();
        const log = loadAutonomousLog();
        
        const status = {
            isActive: true,
            lastExecution: stats.lastExecution,
            totalExecutions: stats.totalExecutions,
            successRate: stats.totalExecutions > 0 ? 
                ((stats.successfulExecutions / stats.totalExecutions) * 100).toFixed(2) + '%' : '0%',
            averageToolCalls: stats.averageToolCallsPerExecution,
            nextScheduledRun: 'Every hour',
            recentActivity: log.slice(-5).map(entry => ({
                timestamp: entry.timestamp,
                action: entry.action,
                toolCalls: entry.tool_calls ? entry.tool_calls.length : 0
            }))
        };
        
        res.json({
            success: true,
            status: status
        });
    } catch (error) {
        console.error('Error getting autonomous AI status:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get autonomous AI status' 
        });
    }
});

// Test tool definitions (for debugging)
router.get('/test-tools', (req, res) => {
    try {
        const { autonomousTools, autonomousToolDefinitions } = require('../autonomous_ai/autonomous_tools');
        
        const toolTest = {
            toolDefinitionsStructure: {
                type: typeof autonomousToolDefinitions,
                hasFunctionDeclarations: autonomousToolDefinitions.hasOwnProperty('functionDeclarations'),
                functionCount: autonomousToolDefinitions.functionDeclarations ? autonomousToolDefinitions.functionDeclarations.length : 0
            },
            toolsObject: {
                toolCount: Object.keys(autonomousTools).length,
                toolNames: Object.keys(autonomousTools)
            },
            definitionNames: autonomousToolDefinitions.functionDeclarations ? 
                autonomousToolDefinitions.functionDeclarations.map(f => f.name) : [],
            structureValid: autonomousToolDefinitions.functionDeclarations && 
                           autonomousToolDefinitions.functionDeclarations.length > 0
        };
        
        res.json({
            success: true,
            toolTest: toolTest
        });
    } catch (error) {
        console.error('Error testing tools:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to test tools',
            details: error.message 
        });
    }
});

module.exports = router;