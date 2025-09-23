require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { autonomousTools, autonomousToolDefinitions } = require('./autonomous_tools');
const ChatHistoryManager = require('../utils/chat_history_manager');

// Initialize the Google Generative AI model with separate API key
const genAI = new GoogleGenerativeAI(process.env.AUTONOMOUS_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: autonomousToolDefinitions,
});

// Initialize chat history manager for autonomous AI
const chatHistoryManager = new ChatHistoryManager();

const autonomous_system_prompt = `You are EcosyncAutonomous, an advanced autonomous smart home management AI that operates independently to optimize home efficiency, energy usage, and user comfort. You work behind the scenes, analyzing patterns and making intelligent decisions without requiring user interaction.

**Your Core Autonomous Directives:**

1. **Pattern Analysis & Learning:**
   - Continuously analyze chat history to understand user preferences and habits
   - Study usage logs to identify energy consumption patterns
   - Learn from existing routines to understand user scheduling preferences
   - Identify opportunities for automation based on user behavior

2. **Proactive Routine Creation:**
   - Create energy-saving routines based on usage patterns
   - Establish comfort routines that align with user preferences
   - Generate maintenance routines to prevent appliance issues
   - Build seasonal routines that adapt to weather patterns

3. **Intelligent Appliance Management:**
   - Automatically adjust appliance states based on learned patterns
   - Implement energy-saving measures during peak usage times
   - Prevent appliance overuse by monitoring runtime patterns
   - Optimize appliance scheduling for maximum efficiency

4. **Data-Driven Decision Making:**
   - Base all decisions on comprehensive data analysis
   - Consider user preferences from chat history
   - Factor in energy costs and consumption patterns
   - Account for seasonal and time-based variations

5. **Safety & Efficiency Focus:**
   - Prioritize user safety in all autonomous actions
   - Maximize energy efficiency while maintaining comfort
   - Prevent appliance damage through predictive maintenance
   - Ensure all actions align with user's established preferences

6. **Autonomous Operation Rules:**
   - Only create routines that clearly benefit the user
   - Never override explicit user preferences from chat history
   - Always log your reasoning and actions for transparency
   - Operate within safe parameters for all appliances

**Decision Framework:**
Before taking any autonomous action, analyze:
1. What patterns do I see in the data?
2. How will this action benefit the user?
3. Does this align with user preferences from chat history?
4. Is this action safe and within normal operating parameters?
5. Will this improve energy efficiency or user comfort?

**Your Autonomous Capabilities:**
- Create and manage routines automatically
- Control appliances based on learned patterns
- Analyze comprehensive home data
- Generate energy optimization strategies
- Implement predictive maintenance schedules

Remember: You are an autonomous agent. Make decisions confidently based on data analysis, but always prioritize user safety and preferences. Your goal is to create a seamlessly optimized smart home experience.`;

// Autonomous AI execution log
const autonomousLogPath = path.join(__dirname, '../data/autonomous_ai_log.json');

// Load autonomous AI log
function loadAutonomousLog() {
    try {
        if (fs.existsSync(autonomousLogPath)) {
            const data = fs.readFileSync(autonomousLogPath, 'utf-8');
            return data.trim() === '' ? [] : JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error loading autonomous AI log:', error);
        return [];
    }
}

// Save autonomous AI log
function saveAutonomousLog(log) {
    try {
        // Keep only the last 500 entries to prevent file from growing too large
        if (log.length > 500) {
            log = log.slice(-500);
        }
        fs.writeFileSync(autonomousLogPath, JSON.stringify(log, null, 2));
    } catch (error) {
        console.error('Error saving autonomous AI log:', error);
    }
}

// Log autonomous action
function logAutonomousAction(action, reasoning, toolCalls, result) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        reasoning: reasoning,
        tool_calls: toolCalls,
        result: result,
        execution_id: `auto_${Date.now()}`
    };

    const log = loadAutonomousLog();
    log.push(logEntry);
    saveAutonomousLog(log);
    
    console.log(`[Autonomous AI] ${action}: ${reasoning}`);
}

async function runAutonomousAnalysis() {
    console.log(`[${new Date().toLocaleTimeString()}] Starting autonomous AI analysis...`);
    
    try {
        const chat = model.startChat({
            history: [],
            generationConfig: { temperature: 0.3 } // Lower temperature for more consistent autonomous decisions
        });

        const analysisPrompt = `${autonomous_system_prompt}

AUTONOMOUS ANALYSIS REQUEST:
Perform a comprehensive analysis of the smart home system and take autonomous actions to optimize efficiency and user comfort.

Your tasks:
1. Analyze all available data (chat history, usage logs, routines, user preferences)
2. Identify patterns and optimization opportunities
3. Create beneficial routines or modify appliance states as needed
4. Focus on energy savings and user comfort improvements
5. Ensure all actions align with user preferences from chat history

Begin your autonomous analysis and optimization now.`;

        let result = await chat.sendMessage(analysisPrompt);
        let allToolCalls = [];
        let reasoning = "";

        while (true) {
            const response = result.response;
            const functionCalls = response.functionCalls();

            if (!functionCalls || functionCalls.length === 0) {
                const responseText = response.text();
                reasoning = responseText;
                
                // Log the autonomous action
                logAutonomousAction(
                    "Autonomous Analysis Complete",
                    reasoning,
                    allToolCalls,
                    "Analysis completed successfully"
                );
                
                console.log(`[Autonomous AI] Analysis complete. Tool calls: ${allToolCalls.length}`);
                return {
                    success: true,
                    reasoning: responseText,
                    toolCalls: allToolCalls
                };
            }

            console.log(`[Autonomous AI] Executing tools: ${functionCalls.map(t => t.name).join(', ')}`);

            const toolExecutionPromises = functionCalls.map(async (call) => {
                const functionToCall = autonomousTools[call.name];
                if (functionToCall) {
                    const startTime = Date.now();
                    let toolResponse = await functionToCall(call.args);
                    const endTime = Date.now();

                    if (Array.isArray(toolResponse)) {
                        toolResponse = { data: toolResponse };
                    }

                    // Log tool call details
                    const toolCallEntry = {
                        tool_name: call.name,
                        arguments: call.args,
                        response: toolResponse,
                        execution_time_ms: endTime - startTime,
                        timestamp: new Date().toISOString()
                    };
                    
                    allToolCalls.push(toolCallEntry);
                    console.log(`[Autonomous AI Tool] ${call.name} executed in ${endTime - startTime}ms`);

                    return { functionResponse: { name: call.name, response: toolResponse } };
                } else {
                    console.error(`[Autonomous AI] ERROR: Unknown tool: ${call.name}`);
                    
                    const failedToolCall = {
                        tool_name: call.name,
                        arguments: call.args,
                        response: { error: `Tool ${call.name} not found.` },
                        execution_time_ms: 0,
                        timestamp: new Date().toISOString(),
                        error: true
                    };
                    
                    allToolCalls.push(failedToolCall);
                    return { functionResponse: { name: call.name, response: { error: `Tool ${call.name} not found.` } } };
                }
            });

            const toolResponses = await Promise.all(toolExecutionPromises);
            result = await chat.sendMessage(toolResponses);
        }

    } catch (error) {
        console.error("[Autonomous AI] FATAL ERROR:", error);
        
        logAutonomousAction(
            "Autonomous Analysis Failed",
            `Error during analysis: ${error.message}`,
            [],
            `Failed with error: ${error.message}`
        );
        
        return {
            success: false,
            error: error.message,
            toolCalls: []
        };
    }
}

// Get autonomous AI statistics
function getAutonomousStats() {
    const log = loadAutonomousLog();
    
    const stats = {
        totalExecutions: log.length,
        successfulExecutions: log.filter(entry => entry.result !== 'failed').length,
        failedExecutions: log.filter(entry => entry.result === 'failed').length,
        totalToolCalls: log.reduce((sum, entry) => sum + (entry.tool_calls?.length || 0), 0),
        mostUsedTools: {},
        executionsByDate: {},
        averageToolCallsPerExecution: 0,
        lastExecution: log.length > 0 ? log[log.length - 1].timestamp : null
    };

    if (log.length > 0) {
        stats.averageToolCallsPerExecution = (stats.totalToolCalls / log.length).toFixed(2);

        // Analyze tool usage
        log.forEach(entry => {
            if (entry.tool_calls && entry.tool_calls.length > 0) {
                entry.tool_calls.forEach(toolCall => {
                    const toolName = toolCall.tool_name;
                    stats.mostUsedTools[toolName] = (stats.mostUsedTools[toolName] || 0) + 1;
                });
            }
            
            // Group by date
            const date = new Date(entry.timestamp).toDateString();
            stats.executionsByDate[date] = (stats.executionsByDate[date] || 0) + 1;
        });
    }

    return stats;
}

module.exports = { 
    runAutonomousAnalysis, 
    getAutonomousStats, 
    loadAutonomousLog 
};