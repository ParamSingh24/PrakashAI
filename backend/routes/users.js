const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { runChat } = require('../ai/gemini');

const usersDataPath = path.join(__dirname, '../data/users.json');
const usageLogsDataPath = path.join(__dirname, '../data/usage_logs.json');
const appliancesDataPath = path.join(__dirname, '../data/appliances.json');
const routinesDataPath = path.join(__dirname, '../data/routines.json');

const readData = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        console.error(`Error reading ${path.basename(filePath)}:`, error);
        return [];
    }
};

const writeData = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing to ${path.basename(filePath)}:`, error);
    }
};

const calculateCost = (units_kwh) => {
    let cost = 0;
    let remainingUnits = units_kwh;
    if (remainingUnits > 0) {
        const unitsInTier = Math.min(remainingUnits, 100);
        cost += unitsInTier * 3.50;
        remainingUnits -= unitsInTier;
    }
    if (remainingUnits > 0) {
        const unitsInTier = Math.min(remainingUnits, 100);
        cost += unitsInTier * 5.00;
        remainingUnits -= unitsInTier;
    }
    if (remainingUnits > 0) {
        const unitsInTier = Math.min(remainingUnits, 200);
        cost += unitsInTier * 6.50;
        remainingUnits -= unitsInTier;
    }
    if (remainingUnits > 0) {
        cost += remainingUnits * 8.00;
    }
    return parseFloat(cost.toFixed(2));
};

const generateSmartSuggestions = (dashboardData, user, appliances, routines) => {
    const suggestions = [];
    const { projectedCostINR, topPowerConsumers, totalUsageKWh, projectionAnalysis } = dashboardData;

    // Use AI projection insights if available
    if (projectionAnalysis && projectionAnalysis.insights) {
        projectionAnalysis.insights.forEach(insight => {
            if (insight.includes('exceed budget')) {
                suggestions.push(`AI Analysis: ${insight}`);
            } else if (insight.includes('weekend') || insight.includes('weekday')) {
                suggestions.push(`Usage Pattern: ${insight}`);
            }
        });
    } else {
        // Fallback to traditional budget warning
        if (projectedCostINR > user.monthlyBudget) {
            suggestions.push(`Warning: You are on track to exceed your ₹${user.monthlyBudget} budget. Your bill is projected to be ₹${projectedCostINR}.`);
        }
    }

    if (topPowerConsumers.length > 0) {
        const topConsumer = topPowerConsumers[0];
        const topConsumerAppliance = appliances.find(a => a.name === topConsumer.name);

        if (topConsumer.usageKWh > totalUsageKWh * 0.4) {
            suggestions.push(`${topConsumer.name} is your highest energy consumer. Consider reducing its usage to save money.`);
        }

        const hasRoutine = routines.some(r => r.actions.some(a => a.applianceId === topConsumerAppliance?.uid));
        if (topConsumerAppliance && !hasRoutine) {
            suggestions.push(`Your top consumer, ${topConsumer.name}, has no automated routines. Creating a schedule could help save energy.`);
        }
    }

    // Add confidence level information if available
    if (projectionAnalysis && projectionAnalysis.confidence_level) {
        const confidenceText = projectionAnalysis.confidence_level === 'high' ? 'High confidence' : 
                              projectionAnalysis.confidence_level === 'medium' ? 'Medium confidence' : 'Low confidence';
        suggestions.push(`Projection ${confidenceText.toLowerCase()} based on ${projectionAnalysis.usage_patterns?.days_analyzed || 'available'} days of usage data.`);
    }
    
    return suggestions;
};

const updateUserDashboard = async (userId) => {
    console.log(`[${new Date().toLocaleTimeString()}] Updating dashboard for user: ${userId}`);
    const users = readData(usersDataPath);
    const userIndex = users.findIndex(u => u.uid === userId);

    if (userIndex === -1) {
        console.error(`Dashboard Update Failed: User with ID ${userId} not found.`);
        return;
    }

    const logs = readData(usageLogsDataPath);
    const appliances = readData(appliancesDataPath);
    const routines = readData(routinesDataPath);
    const applianceMap = new Map(appliances.map(app => [app.uid, app.name]));
    const user = users[userIndex];

    const totalUsageKWh = logs.reduce((total, log) => {
        const energy = parseFloat(log.energy_consumed_kwh) || 0;
        return total + energy;
    }, 0);
    const totalCostINR = calculateCost(totalUsageKWh);

    const usageByAppliance = {};
    logs.forEach(log => {
        const name = applianceMap.get(log.appliance_id) || log.appliance_id;
        const energy = parseFloat(log.energy_consumed_kwh) || 0;
        usageByAppliance[name] = (usageByAppliance[name] || 0) + energy;
    });

    const topPowerConsumers = Object.entries(usageByAppliance)
        .map(([name, usageKWh]) => ({ name, usageKWh: parseFloat(usageKWh.toFixed(4)) }))
        .sort((a, b) => b.usageKWh - a.usageKWh)
        .slice(0, 5);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    
    // Use AI-powered intelligent projection instead of simple averaging
    let projectedCostINR;
    
    // Validate input data before projection
    const validTotalUsage = isNaN(totalUsageKWh) ? 0 : totalUsageKWh;
    const validTotalCost = isNaN(totalCostINR) ? 0 : totalCostINR;
    const validDaysPassed = isNaN(daysPassed) || daysPassed <= 0 ? 1 : daysPassed;
    
    try {
        const { tools } = require('../ai/tools');
        const projectionResult = tools.calculate_intelligent_projection({
            current_usage_kwh: validTotalUsage,
            current_cost_inr: validTotalCost,
            days_passed: validDaysPassed,
            monthly_budget: user.monthlyBudget || 2500
        });
        
        projectedCostINR = projectionResult.projected_total_cost_inr;
        console.log(`[AI Projection] Confidence: ${projectionResult.confidence_level}, Method: ${projectionResult.methodology}`);
        console.log(`[AI Projection] Insights: ${projectionResult.analysis_insights.join('; ')}`);
        
        // Store additional projection data for potential future use
        if (!user.dashboardData.projectionAnalysis) {
            user.dashboardData.projectionAnalysis = {};
        }
        user.dashboardData.projectionAnalysis = {
            confidence_level: projectionResult.confidence_level,
            insights: projectionResult.analysis_insights,
            usage_patterns: projectionResult.usage_patterns,
            last_calculated: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('AI projection failed, falling back to simple calculation:', error);
        // Fallback to simple calculation if AI projection fails
        const avgDailyUsage = validTotalUsage / validDaysPassed || 0;
        const projectedKWh = avgDailyUsage * daysInMonth;
        projectedCostINR = calculateCost(projectedKWh);
    }
    
    // Ensure projected cost is never NaN
    if (isNaN(projectedCostINR)) {
        projectedCostINR = 0;
        console.warn('Projected cost was NaN, defaulting to 0');
    }

    const tempDashboardData = { totalUsageKWh, totalCostINR, topPowerConsumers, projectedCostINR };
    const suggestions = generateSmartSuggestions(tempDashboardData, user, appliances, routines);

    let aiInsights = [];
    try {
        const topConsumerName = topPowerConsumers.length > 0 ? topPowerConsumers[0].name : 'your appliances';
        const aiPrompt = `Based on the following data, provide 3 simple, actionable tips in a JSON array of strings to help a user reduce their energy consumption. The user's top power consumer is '${topConsumerName}'. Their projected monthly cost is ₹${projectedCostINR} against a budget of ₹${user.monthlyBudget}. Respond ONLY with a valid JSON array of strings. Example: ["suggestion 1", "suggestion 2", "suggestion 3"]`;
        const aiResponse = await runChat(aiPrompt);
        const cleanedResponse = aiResponse.replace(/```json\n|```/g, '').trim();
        aiInsights = JSON.parse(cleanedResponse);
    } catch (error) {
        console.error("Failed to get AI insights:", error);
        aiInsights = ["Could not retrieve AI suggestions at this time."];
    }

    users[userIndex].dashboardData.totalUsageKWh = parseFloat(totalUsageKWh.toFixed(4));
    users[userIndex].dashboardData.totalCostINR = totalCostINR;
    users[userIndex].dashboardData.projectedCostINR = projectedCostINR;
    users[userIndex].dashboardData.topPowerConsumers = topPowerConsumers;
    users[userIndex].dashboardData.suggestions = suggestions;
    users[userIndex].dashboardData.aiInsights = aiInsights;
    users[userIndex].dashboardData.lastUpdated = new Date().toISOString();

    writeData(usersDataPath, users);
    console.log(`Dashboard for ${userId} updated successfully.`);
};

const generateProactiveAiSuggestions = async (userId) => {
    console.log(`[${new Date().toLocaleTimeString()}] Running proactive AI check for user: ${userId}`);
    const users = readData(usersDataPath);
    const userIndex = users.findIndex(u => u.uid === userId);
    if (userIndex === -1) return;

    const dashboardData = users[userIndex].dashboardData;
    const prompt = `You are a proactive smart home assistant. Analyze the user's latest dashboard data and provide a JSON array of 2-3 new, insightful suggestions for energy saving or home automation. Current data: ${JSON.stringify(dashboardData)}. Respond ONLY with a valid JSON array of strings.`;

    try {
        const aiResponse = await runChat(prompt);
        const cleanedResponse = aiResponse.replace(/```json\n|```/g, '').trim();
        const proactiveSuggestions = JSON.parse(cleanedResponse);
        
        users[userIndex].dashboardData.proactiveAiSuggestions = proactiveSuggestions;
        writeData(usersDataPath, users);
        console.log(`Proactive AI suggestions updated for ${userId}.`);
    } catch (error) {
        console.error("Failed to generate proactive AI suggestions:", error);
    }
};

router.get('/:uid', async (req, res) => {
    try {
        await updateUserDashboard(req.params.uid);
        const users = readData(usersDataPath);
        const user = users.find(u => u.uid === req.params.uid);
        if (user) {
            res.json(user);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error("Error in GET /users/:uid", error);
        res.status(500).send('Failed to retrieve user data.');
    }
});

router.post('/:uid/refresh', async (req, res) => {
    try {
        await updateUserDashboard(req.params.uid);
        res.status(200).send(`Dashboard for user ${req.params.uid} has been refreshed.`);
    } catch (error) {
        console.error("Error in POST /users/:uid/refresh", error);
        res.status(500).send('Failed to refresh dashboard.');
    }
});

module.exports = { router, updateUserDashboard, generateProactiveAiSuggestions };