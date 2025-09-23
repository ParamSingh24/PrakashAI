const fs = require('fs');
const path = require('path');
const ChatHistoryManager = require('../utils/chat_history_manager');

// Initialize chat history manager
const chatHistoryManager = new ChatHistoryManager();

// Data paths
const appliancesDataPath = path.join(__dirname, '../data/appliances.json');
const routinesDataPath = path.join(__dirname, '../data/routines.json');
const usageLogsDataPath = path.join(__dirname, '../data/usage_logs.json');
const usersDataPath = path.join(__dirname, '../data/users.json');

// Helper function to read JSON files
function readJsonFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return data.trim() === '' ? [] : JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

// Helper function to write JSON files
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// Autonomous tool implementations
const autonomousTools = {
    // Analyze comprehensive home data
    analyze_home_data: async (args) => {
        try {
            const appliances = readJsonFile(appliancesDataPath);
            const routines = readJsonFile(routinesDataPath);
            const usageLogs = readJsonFile(usageLogsDataPath);
            const users = readJsonFile(usersDataPath);
            const chatHistory = chatHistoryManager.loadChatHistory();

            // Get recent chat history (last 50 messages for pattern analysis)
            const recentChats = chatHistory.slice(-50);

            // Analyze usage patterns
            const now = new Date();
            const last7Days = usageLogs.filter(log => {
                const logDate = new Date(log.start_timestamp);
                const daysDiff = (now - logDate) / (1000 * 60 * 60 * 24);
                return daysDiff <= 7;
            });

            // Calculate appliance usage statistics
            const applianceStats = {};
            appliances.forEach(appliance => {
                const applianceLogs = last7Days.filter(log => log.appliance_id === appliance.uid);
                applianceStats[appliance.uid] = {
                    name: appliance.name,
                    type: appliance.type,
                    totalUsageHours: applianceLogs.reduce((sum, log) => sum + (log.time_duration_seconds / 3600), 0),
                    totalEnergy: applianceLogs.reduce((sum, log) => sum + log.energy_consumed_kwh, 0),
                    usageCount: applianceLogs.length,
                    averageSessionDuration: applianceLogs.length > 0 ? 
                        (applianceLogs.reduce((sum, log) => sum + log.time_duration_seconds, 0) / applianceLogs.length / 3600) : 0,
                    currentState: appliance.state,
                    powerUsagePerHour: appliance.powerUsagePerHour
                };
            });

            // Analyze user preferences from chat history
            const userPreferences = {
                mentionedAppliances: {},
                preferredTimes: [],
                energySavingInterest: recentChats.some(chat => 
                    chat.user_message.toLowerCase().includes('save') || 
                    chat.user_message.toLowerCase().includes('energy') ||
                    chat.user_message.toLowerCase().includes('cost')
                ),
                comfortPreferences: recentChats.filter(chat => 
                    chat.user_message.toLowerCase().includes('hot') ||
                    chat.user_message.toLowerCase().includes('cold') ||
                    chat.user_message.toLowerCase().includes('comfortable')
                )
            };

            // Extract mentioned appliances from chat
            recentChats.forEach(chat => {
                appliances.forEach(appliance => {
                    const applianceName = appliance.name.toLowerCase();
                    const applianceType = appliance.type.toLowerCase();
                    if (chat.user_message.toLowerCase().includes(applianceName) || 
                        chat.user_message.toLowerCase().includes(applianceType)) {
                        userPreferences.mentionedAppliances[appliance.uid] = 
                            (userPreferences.mentionedAppliances[appliance.uid] || 0) + 1;
                    }
                });
            });

            return {
                success: true,
                data: {
                    appliances: appliances,
                    routines: routines,
                    applianceStats: applianceStats,
                    userPreferences: userPreferences,
                    recentChatCount: recentChats.length,
                    totalUsageLogs: usageLogs.length,
                    last7DaysLogs: last7Days.length,
                    currentUser: users.length > 0 ? users[0] : null
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Create autonomous routines based on analysis
    create_autonomous_routine: async (args) => {
        try {
            const { name, description, schedule, actions, reasoning } = args;
            
            if (!name || !schedule || !actions || !Array.isArray(actions)) {
                return { success: false, error: 'Missing required parameters: name, schedule, actions' };
            }

            const routines = readJsonFile(routinesDataPath);
            
            // Check if routine with similar name already exists
            const existingRoutine = routines.find(r => 
                r.name.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(r.name.toLowerCase())
            );

            if (existingRoutine) {
                return { 
                    success: false, 
                    error: `Similar routine already exists: ${existingRoutine.name}`,
                    existingRoutine: existingRoutine
                };
            }

            const newRoutine = {
                id: `auto_routine_${Date.now()}`,
                name: name,
                description: description || `Autonomous routine: ${name}`,
                schedule: schedule,
                actions: actions,
                createdBy: 'autonomous_ai',
                createdAt: new Date().toISOString(),
                reasoning: reasoning,
                isActive: true
            };

            routines.push(newRoutine);
            
            if (writeJsonFile(routinesDataPath, routines)) {
                console.log(`[Autonomous AI] Created routine: ${name}`);
                return { 
                    success: true, 
                    routine: newRoutine,
                    message: `Successfully created autonomous routine: ${name}`
                };
            } else {
                return { success: false, error: 'Failed to save routine' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Control appliances autonomously
    autonomous_appliance_control: async (args) => {
        try {
            const { applianceId, action, reasoning } = args;
            
            if (!applianceId || !action) {
                return { success: false, error: 'Missing required parameters: applianceId, action' };
            }

            const appliances = readJsonFile(appliancesDataPath);
            const applianceIndex = appliances.findIndex(a => a.uid === applianceId);
            
            if (applianceIndex === -1) {
                return { success: false, error: `Appliance not found: ${applianceId}` };
            }

            const appliance = appliances[applianceIndex];
            const newState = action.toLowerCase() === 'turnon' ? 'on' : 'off';
            
            // Don't change state if it's already in the desired state
            if (appliance.state === newState) {
                return { 
                    success: true, 
                    message: `${appliance.name} is already ${newState}`,
                    noChange: true
                };
            }

            // Update appliance state
            appliances[applianceIndex].state = newState;
            appliances[applianceIndex].lastTurnedOnTimestamp = newState === 'on' ? Date.now() : null;
            appliances[applianceIndex].lastTurnedOffTimestamp = newState === 'off' ? Date.now() : null;

            if (writeJsonFile(appliancesDataPath, appliances)) {
                // Create usage log entry
                const usageLogs = readJsonFile(usageLogsDataPath);
                
                if (newState === 'off' && appliance.lastTurnedOnTimestamp) {
                    const duration = (Date.now() - appliance.lastTurnedOnTimestamp) / 1000;
                    const energyConsumed = (duration / 3600) * appliance.powerUsagePerHour;
                    
                    const logEntry = {
                        id: `log_${Date.now()}`,
                        appliance_id: applianceId,
                        start_timestamp: new Date(appliance.lastTurnedOnTimestamp).toISOString(),
                        end_timestamp: new Date().toISOString(),
                        time_duration_seconds: Math.round(duration),
                        energy_consumed_kwh: parseFloat(energyConsumed.toFixed(5)),
                        trigger: 'autonomous_ai'
                    };
                    
                    usageLogs.push(logEntry);
                    writeJsonFile(usageLogsDataPath, usageLogs);
                }

                console.log(`[Autonomous AI] ${action} ${appliance.name}: ${reasoning}`);
                return { 
                    success: true, 
                    appliance: appliances[applianceIndex],
                    message: `Successfully ${action} ${appliance.name}`,
                    reasoning: reasoning
                };
            } else {
                return { success: false, error: 'Failed to update appliance state' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Analyze energy optimization opportunities
    analyze_energy_optimization: async (args) => {
        try {
            const appliances = readJsonFile(appliancesDataPath);
            const usageLogs = readJsonFile(usageLogsDataPath);
            const users = readJsonFile(usersDataPath);
            
            const currentUser = users.length > 0 ? users[0] : null;
            const monthlyBudget = currentUser ? currentUser.monthlyBudget : 2500;

            // Analyze last 30 days of usage
            const now = new Date();
            const last30Days = usageLogs.filter(log => {
                const logDate = new Date(log.start_timestamp);
                const daysDiff = (now - logDate) / (1000 * 60 * 60 * 24);
                return daysDiff <= 30;
            });

            // Calculate energy consumption by appliance
            const energyByAppliance = {};
            appliances.forEach(appliance => {
                const applianceLogs = last30Days.filter(log => log.appliance_id === appliance.uid);
                const totalEnergy = applianceLogs.reduce((sum, log) => sum + log.energy_consumed_kwh, 0);
                
                energyByAppliance[appliance.uid] = {
                    name: appliance.name,
                    type: appliance.type,
                    totalEnergy: totalEnergy,
                    totalHours: applianceLogs.reduce((sum, log) => sum + (log.time_duration_seconds / 3600), 0),
                    averageDaily: totalEnergy / 30,
                    powerRating: appliance.powerUsagePerHour,
                    currentState: appliance.state
                };
            });

            // Identify high consumption appliances
            const sortedByEnergy = Object.values(energyByAppliance)
                .sort((a, b) => b.totalEnergy - a.totalEnergy);

            // Calculate potential savings
            const optimizationOpportunities = [];
            
            sortedByEnergy.forEach(appliance => {
                if (appliance.totalEnergy > 10) { // Focus on appliances with significant usage
                    // Suggest 20% reduction for high-usage appliances
                    const potentialSaving = appliance.totalEnergy * 0.2;
                    const monthlySaving = potentialSaving * 4.1; // Approximate cost per kWh in INR
                    
                    optimizationOpportunities.push({
                        appliance: appliance.name,
                        currentUsage: appliance.totalEnergy,
                        potentialSaving: potentialSaving,
                        monthlyCostSaving: monthlySaving,
                        recommendation: `Reduce ${appliance.name} usage by 20% through smart scheduling`
                    });
                }
            });

            // Calculate total potential monthly savings
            const totalPotentialSaving = optimizationOpportunities
                .reduce((sum, opp) => sum + opp.monthlyCostSaving, 0);

            return {
                success: true,
                data: {
                    monthlyBudget: monthlyBudget,
                    energyByAppliance: energyByAppliance,
                    topConsumers: sortedByEnergy.slice(0, 5),
                    optimizationOpportunities: optimizationOpportunities,
                    totalPotentialSaving: totalPotentialSaving,
                    analysisDate: new Date().toISOString()
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Delete or modify existing routines
    manage_existing_routines: async (args) => {
        try {
            const { action, routineId, modifications } = args;
            
            if (!action) {
                return { success: false, error: 'Missing required parameter: action' };
            }

            const routines = readJsonFile(routinesDataPath);
            
            if (action === 'list') {
                return {
                    success: true,
                    routines: routines.map(r => ({
                        id: r.id,
                        name: r.name,
                        description: r.description,
                        schedule: r.schedule,
                        createdBy: r.createdBy || 'user',
                        isActive: r.isActive !== false
                    }))
                };
            }

            if (action === 'delete' && routineId) {
                const routineIndex = routines.findIndex(r => r.id === routineId);
                if (routineIndex === -1) {
                    return { success: false, error: `Routine not found: ${routineId}` };
                }

                const deletedRoutine = routines.splice(routineIndex, 1)[0];
                
                if (writeJsonFile(routinesDataPath, routines)) {
                    console.log(`[Autonomous AI] Deleted routine: ${deletedRoutine.name}`);
                    return { 
                        success: true, 
                        message: `Deleted routine: ${deletedRoutine.name}`,
                        deletedRoutine: deletedRoutine
                    };
                } else {
                    return { success: false, error: 'Failed to save routines after deletion' };
                }
            }

            if (action === 'modify' && routineId && modifications) {
                const routineIndex = routines.findIndex(r => r.id === routineId);
                if (routineIndex === -1) {
                    return { success: false, error: `Routine not found: ${routineId}` };
                }

                // Apply modifications
                Object.keys(modifications).forEach(key => {
                    if (key !== 'id') { // Don't allow ID changes
                        routines[routineIndex][key] = modifications[key];
                    }
                });

                routines[routineIndex].modifiedBy = 'autonomous_ai';
                routines[routineIndex].modifiedAt = new Date().toISOString();

                if (writeJsonFile(routinesDataPath, routines)) {
                    console.log(`[Autonomous AI] Modified routine: ${routines[routineIndex].name}`);
                    return { 
                        success: true, 
                        message: `Modified routine: ${routines[routineIndex].name}`,
                        modifiedRoutine: routines[routineIndex]
                    };
                } else {
                    return { success: false, error: 'Failed to save routine modifications' };
                }
            }

            return { success: false, error: 'Invalid action or missing parameters' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Analyze user behavior patterns from chat history
    analyze_user_patterns: async (args) => {
        try {
            const chatHistory = chatHistoryManager.loadChatHistory();
            const appliances = readJsonFile(appliancesDataPath);
            
            // Analyze recent chat history (last 100 messages)
            const recentChats = chatHistory.slice(-100);
            
            const patterns = {
                applianceUsagePatterns: {},
                timePreferences: {},
                energySavingInterest: 0,
                comfortPreferences: [],
                frequentCommands: {},
                toolUsagePatterns: {}
            };

            recentChats.forEach(chat => {
                const message = chat.user_message.toLowerCase();
                const timestamp = new Date(chat.timestamp);
                const hour = timestamp.getHours();
                
                // Analyze appliance mentions
                appliances.forEach(appliance => {
                    const applianceName = appliance.name.toLowerCase();
                    const applianceType = appliance.type.toLowerCase();
                    
                    if (message.includes(applianceName) || message.includes(applianceType)) {
                        if (!patterns.applianceUsagePatterns[appliance.uid]) {
                            patterns.applianceUsagePatterns[appliance.uid] = {
                                name: appliance.name,
                                mentions: 0,
                                timePreferences: {}
                            };
                        }
                        patterns.applianceUsagePatterns[appliance.uid].mentions++;
                        
                        // Track time preferences
                        const timeSlot = hour < 6 ? 'night' : 
                                       hour < 12 ? 'morning' : 
                                       hour < 18 ? 'afternoon' : 'evening';
                        
                        patterns.applianceUsagePatterns[appliance.uid].timePreferences[timeSlot] = 
                            (patterns.applianceUsagePatterns[appliance.uid].timePreferences[timeSlot] || 0) + 1;
                    }
                });

                // Analyze energy saving interest
                if (message.includes('save') || message.includes('energy') || 
                    message.includes('cost') || message.includes('bill')) {
                    patterns.energySavingInterest++;
                }

                // Analyze comfort preferences
                if (message.includes('hot') || message.includes('cold') || 
                    message.includes('warm') || message.includes('cool')) {
                    patterns.comfortPreferences.push({
                        message: chat.user_message,
                        timestamp: chat.timestamp,
                        hour: hour
                    });
                }

                // Analyze tool usage from AI responses
                if (chat.tool_calls && chat.tool_calls.length > 0) {
                    chat.tool_calls.forEach(tool => {
                        patterns.toolUsagePatterns[tool.tool_name] = 
                            (patterns.toolUsagePatterns[tool.tool_name] || 0) + 1;
                    });
                }

                // Track frequent commands
                const words = message.split(' ');
                words.forEach(word => {
                    if (word.length > 3) { // Ignore short words
                        patterns.frequentCommands[word] = 
                            (patterns.frequentCommands[word] || 0) + 1;
                    }
                });
            });

            // Calculate overall time preferences
            recentChats.forEach(chat => {
                const hour = new Date(chat.timestamp).getHours();
                const timeSlot = hour < 6 ? 'night' : 
                               hour < 12 ? 'morning' : 
                               hour < 18 ? 'afternoon' : 'evening';
                
                patterns.timePreferences[timeSlot] = 
                    (patterns.timePreferences[timeSlot] || 0) + 1;
            });

            return {
                success: true,
                data: {
                    patterns: patterns,
                    totalChatsAnalyzed: recentChats.length,
                    analysisDate: new Date().toISOString(),
                    insights: {
                        mostMentionedAppliances: Object.values(patterns.applianceUsagePatterns)
                            .sort((a, b) => b.mentions - a.mentions)
                            .slice(0, 3),
                        preferredTimeSlot: Object.keys(patterns.timePreferences)
                            .reduce((a, b) => patterns.timePreferences[a] > patterns.timePreferences[b] ? a : b),
                        energySavingInterestLevel: patterns.energySavingInterest > 5 ? 'high' : 
                                                 patterns.energySavingInterest > 2 ? 'medium' : 'low'
                    }
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Tool definitions for Gemini (correct format)
const autonomousToolDefinitions = {
    functionDeclarations: [
        {
            name: "analyze_home_data",
            description: "Analyze comprehensive home data including appliances, routines, usage logs, and chat history to understand patterns and optimization opportunities",
            parameters: {
                type: "OBJECT",
                properties: {}
            }
        },
        {
            name: "create_autonomous_routine",
            description: "Create a new routine autonomously based on data analysis and user patterns",
            parameters: {
                type: "OBJECT",
                properties: {
                    name: {
                        type: "STRING",
                        description: "Name of the routine"
                    },
                    description: {
                        type: "STRING",
                        description: "Description of what the routine does"
                    },
                    schedule: {
                        type: "OBJECT",
                        description: "Schedule object with time and days",
                        properties: {
                            time: { type: "STRING", description: "Time in HH:MM format" },
                            days: { type: "ARRAY", items: { type: "STRING" }, description: "Array of days" }
                        }
                    },
                    actions: {
                        type: "ARRAY",
                        description: "Array of actions to perform",
                        items: {
                            type: "OBJECT",
                            properties: {
                                applianceId: { type: "STRING" },
                                command: { type: "STRING" }
                            }
                        }
                    },
                    reasoning: {
                        type: "STRING",
                        description: "Explanation of why this routine was created"
                    }
                },
                required: ["name", "schedule", "actions", "reasoning"]
            }
        },
        {
            name: "autonomous_appliance_control",
            description: "Control appliances autonomously based on analysis and patterns",
            parameters: {
                type: "OBJECT",
                properties: {
                    applianceId: {
                        type: "STRING",
                        description: "ID of the appliance to control"
                    },
                    action: {
                        type: "STRING",
                        description: "Action to perform: 'turnOn' or 'turnOff'"
                    },
                    reasoning: {
                        type: "STRING",
                        description: "Explanation of why this action is being taken"
                    }
                },
                required: ["applianceId", "action", "reasoning"]
            }
        },
        {
            name: "analyze_energy_optimization",
            description: "Analyze energy usage patterns and identify optimization opportunities",
            parameters: {
                type: "OBJECT",
                properties: {}
            }
        },
        {
            name: "manage_existing_routines",
            description: "List, delete, or modify existing routines",
            parameters: {
                type: "OBJECT",
                properties: {
                    action: {
                        type: "STRING",
                        description: "Action to perform: 'list', 'delete', or 'modify'"
                    },
                    routineId: {
                        type: "STRING",
                        description: "ID of the routine (required for delete/modify)"
                    },
                    modifications: {
                        type: "OBJECT",
                        description: "Object containing fields to modify (for modify action)"
                    }
                },
                required: ["action"]
            }
        },
        {
            name: "analyze_user_patterns",
            description: "Analyze user behavior patterns from chat history to understand preferences and habits",
            parameters: {
                type: "OBJECT",
                properties: {}
            }
        }
    ]
};

module.exports = { autonomousTools, autonomousToolDefinitions };