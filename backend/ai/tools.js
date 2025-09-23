const fs = require('fs');
const path = require('path');
const { setApplianceState } = require('../routes/appliances');

const dataDir = path.join(__dirname, '../data');

// Helper function to read data
const readData = (fileName) => {
    return JSON.parse(fs.readFileSync(path.join(dataDir, fileName), 'utf-8'));
};

// Helper function to write data
const writeData = (fileName, data) => {
    fs.writeFileSync(path.join(dataDir, fileName), JSON.stringify(data, null, 2));
};

// --- Tool Implementations ---

const detect_anomalies = () => {
    console.log('AI TOOL: Running detect_anomalies');
    const appliances = readData('appliances.json');
    const anomalies = [];
    const ANOMALY_THRESHOLD_HOURS = 8; // Defines an "unusually long time" as 8 hours

    appliances.forEach(appliance => {
        if (appliance.state === 'on' && appliance.lastTurnedOnTimestamp) {
            const durationHours = (Date.now() - appliance.lastTurnedOnTimestamp) / 3600000;
            if (durationHours > ANOMALY_THRESHOLD_HOURS) {
                anomalies.push({
                    name: appliance.name,
                    type: appliance.type,
                    running_for_hours: Math.round(durationHours),
                    suggestion: `The ${appliance.name} has been running for over ${ANOMALY_THRESHOLD_HOURS} hours, which is unusual.`
                });
            }
        }
    });

    if (anomalies.length === 0) {
        return { status: "No anomalies detected. All appliance usage seems normal." };
    }

    return { anomalies_detected: anomalies };
};

const get_top_news_headlines = async () => {
    console.log('AI TOOL: Running get_top_news_headlines');
    const users = readData('users.json');
    const currentUser = users[0];
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) return { error: "News API key is not configured." };
    if (!currentUser || !currentUser.countryCode) return { error: "User country code is not set." };

    const url = `https://newsapi.org/v2/top-headlines?country=${currentUser.countryCode}&apiKey=${apiKey}&pageSize=5`;

    try {
        const response = await fetch(url);
        if (!response.ok) return { error: `News API request failed with status: ${response.status}` };
        const newsData = await response.json();
        return { headlines: newsData.articles.map(article => ({ title: article.title, source: article.source.name })) };
    } catch (error) {
        console.error("Error fetching news data:", error);
        return { error: "Failed to fetch news headlines." };
    }
};

const check_appliance_maintenance = () => {
    console.log('AI TOOL: Running check_appliance_maintenance');
    const appliances = readData('appliances.json');
    const maintenance_needed = [];
    const maintenance_thresholds = {
        "Air Conditioner": 500, // hours
        "Fan": 1000, // hours
    };

    appliances.forEach(appliance => {
        if (maintenance_thresholds[appliance.type] && appliance.totalUsage > maintenance_thresholds[appliance.type]) {
            maintenance_needed.push({
                name: appliance.name,
                type: appliance.type,
                usage_hours: Math.round(appliance.totalUsage),
                recommendation: `The ${appliance.name} has been used for over ${maintenance_thresholds[appliance.type]} hours. It may need a filter clean or check-up to maintain efficiency.`
            });
        }
    });

    if (maintenance_needed.length === 0) {
        return { status: "All appliances are within their maintenance schedules." };
    }

    return { maintenance_alerts: maintenance_needed };
};


const get_weather_data = async () => {
    console.log('AI TOOL: Running get_weather_data');
    const users = readData('users.json');
    const currentUser = users[0];
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) return { error: "Weather API key is not configured." };
    if (!currentUser || !currentUser.location) return { error: "User location is not set." };

    const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${currentUser.location}`;

    try {
        const response = await fetch(url);
        if (!response.ok) return { error: `Weather API request failed with status: ${response.status}` };
        const weatherData = await response.json();
        return {
            location: weatherData.location.name,
            temperature_celsius: weatherData.current.temp_c,
            condition: weatherData.current.condition.text,
            humidity_percent: weatherData.current.humidity
        };
    } catch (error) {
        console.error("Error fetching weather data:", error);
        return { error: "Failed to fetch weather data." };
    }
};


const get_user_and_appliances_data = () => {
    console.log('AI TOOL: Running get_user_and_appliances_data');
    const users = readData('users.json');
    const appliances = readData('appliances.json');
    const currentUser = users[0] || { uid: 'unknown', name: 'User', monthlyBudget: 0 };
    return {
        user: {
            name: currentUser.name,
            monthlyBudget: currentUser.monthlyBudget
        },
        appliances: appliances
    };
};

const read_usage_logs = () => {
    console.log('AI TOOL: Running read_usage_logs');
    const logs = readData('usage_logs.json');
    const appliances = readData('appliances.json');
    const applianceMap = new Map(appliances.map(app => [app.uid, app.name]));

    const enrichedLogs = logs.map(log => ({
        ...log,
        appliance_name: applianceMap.get(log.appliance_id) || 'Unknown Appliance'
    }));

    return enrichedLogs;
};

const calculate_usage_cost = ({ units_kwh }) => {
    console.log(`AI TOOL: Running calculate_usage_cost for ${units_kwh} kWh`);
    let cost = 0;
    let remainingUnits = units_kwh;

    if (remainingUnits <= 0) return { total_cost: 0, message: "No units consumed, cost is zero." };
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

    return { total_cost_inr: parseFloat(cost.toFixed(2)) };
};

const find_and_control_appliances = async ({ appliance_names, appliance_type, new_state }) => {
    console.log(`AI TOOL: Running find_and_control_appliances`);
    const allAppliances = readData('appliances.json');
    let targetAppliances = new Set();

    if (appliance_names && appliance_names.length > 0) {
        appliance_names.forEach(name => {
            allAppliances
                .filter(a => a.name.toLowerCase().includes(name.toLowerCase()))
                .forEach(a => targetAppliances.add(a));
        });
    } else if (appliance_type) {
        if (appliance_type.toLowerCase() === 'all') {
            allAppliances.forEach(a => targetAppliances.add(a));
        } else {
            allAppliances
                .filter(a => a.type.toLowerCase() === appliance_type.toLowerCase())
                .forEach(a => targetAppliances.add(a));
        }
    }

    const targets = Array.from(targetAppliances);
    if (targets.length === 0) return { success: false, message: "Cannot execute action. I couldn't find any appliances that match your request." };

    for (const app of targets) {
        await setApplianceState(app.uid, new_state, 'ai');
    }
    return { success: true, message: `Successfully turned ${new_state} ${targets.length} appliance(s): ${targets.map(a => a.name).join(', ')}.` };
};

const modify_appliance_details = async ({ appliance_name, updates }) => {
    console.log(`AI TOOL: Running modify_appliance_details for ${appliance_name}`);
    const allAppliances = readData('appliances.json');
    const applianceIndex = allAppliances.findIndex(a => a.name.toLowerCase() === appliance_name.toLowerCase());

    if (applianceIndex === -1) return { success: false, message: `Could not find an appliance with the name "${appliance_name}".` };

    const allowedUpdates = ['name', 'priorityLevel', 'maxOnDuration', 'description', 'location'];
    const validUpdates = {};
    for (const key in updates) {
        if (allowedUpdates.includes(key)) {
            validUpdates[key] = updates[key];
        }
    }

    if (Object.keys(validUpdates).length === 0) return { success: false, message: "No valid fields to update were provided." };

    allAppliances[applianceIndex] = { ...allAppliances[applianceIndex], ...validUpdates };
    writeData('appliances.json', allAppliances);

    return { success: true, message: `Successfully updated details for ${appliance_name}.` };
};

const add_appliance = ({ name, type, powerUsagePerHour, description, location }) => {
    console.log(`AI TOOL: Running add_appliance for "${name}"`);
    // Generate 5-digit alphanumeric UID
    const generateApplianceUID = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < 5; i++) {
            password += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return password;
    };

    const allAppliances = readData('appliances.json');
    const newAppliance = {
        uid: generateApplianceUID(), name, type, powerUsagePerHour: parseFloat(powerUsagePerHour),
        state: "off", totalUsage: 0, usageSinceLastTurnedOn: 0,
        priorityLevel: 0, maxOnDuration: 0,
        description: description || "", location: location || "",
        lastTurnedOnTimestamp: null, lastTurnedOffTimestamp: null,
    };
    allAppliances.push(newAppliance);
    writeData('appliances.json', allAppliances);
    return { success: true, message: `Successfully added the new appliance: ${name}.` };
};

const manage_routines = ({ routines_to_create, routine_names_to_delete }) => {
    console.log('AI TOOL: Running manage_routines');
    let routines = readData('routines.json');
    const appliances = readData('appliances.json');
    let created_count = 0;
    let deleted_count = 0;

    if (routine_names_to_delete && routine_names_to_delete.length > 0) {
        const lowerCaseDeleteNames = routine_names_to_delete.map(name => name.toLowerCase());
        const initialLength = routines.length;
        routines = routines.filter(r => !lowerCaseDeleteNames.includes(r.name.toLowerCase()));
        deleted_count = initialLength - routines.length;
    }

    if (routines_to_create && routines_to_create.length > 0) {
        routines_to_create.forEach(routine => {
            const targetAppliance = appliances.find(a => a.name.toLowerCase().includes(routine.appliance_name.toLowerCase()));
            if (targetAppliance) {
                const newRoutine = {
                    id: `routine_${Date.now()}_${created_count}`,
                    name: routine.name,
                    description: routine.description || `Turns ${routine.command === 'turnOn' ? 'on' : 'off'} the ${routine.appliance_name}.`,
                    schedule: { time: routine.time, days: routine.days },
                    actions: [{ applianceId: targetAppliance.uid, command: routine.command }],
                    createdBy: "ai"
                };
                routines.push(newRoutine);
                created_count++;
            }
        });
    }

    writeData('routines.json', routines);
    return { success: true, message: `Successfully created ${created_count} and deleted ${deleted_count} routines.` };
};

const list_routines = () => {
    console.log('AI TOOL: Running list_routines');
    const routines = readData('routines.json');
    return { routines: routines };
};

const clear_ai_routines = () => {
    console.log('AI TOOL: Clearing all AI-created routines');
    let routines = readData('routines.json');
    const userRoutines = routines.filter(r => r.createdBy !== 'ai');
    writeData('routines.json', userRoutines);
    return { success: true, message: "Cleared all routines previously created by the AI." };
};

const calculate_intelligent_projection = ({ current_usage_kwh, current_cost_inr, days_passed, monthly_budget }) => {
    console.log('AI TOOL: Running intelligent cost projection analysis');

    // Validate and sanitize inputs
    const validCurrentUsage = parseFloat(current_usage_kwh) || 0;
    const validCurrentCost = parseFloat(current_cost_inr) || 0;
    const validDaysPassed = parseInt(days_passed) || 1;
    const validMonthlyBudget = parseFloat(monthly_budget) || 2500;

    console.log(`[Projection] Input validation: usage=${validCurrentUsage}kWh, cost=₹${validCurrentCost}, days=${validDaysPassed}, budget=₹${validMonthlyBudget}`);

    const usageLogs = readData('usage_logs.json');
    const appliances = readData('appliances.json');
    const users = readData('users.json');
    const currentUser = users[0] || {};

    // Get current date info
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const remainingDays = Math.max(0, daysInMonth - validDaysPassed);

    // Analyze usage patterns by day of week and time
    const dailyUsage = {};
    const weekdayUsage = [];
    const weekendUsage = [];
    const applianceUsagePatterns = {};

    // Process usage logs for pattern analysis
    usageLogs.forEach(log => {
        // Validate log data
        if (!log.end_timestamp && !log.start_timestamp) return;
        if (!log.energy_consumed_kwh) return;

        const logDate = new Date(log.end_timestamp || log.start_timestamp);
        if (isNaN(logDate.getTime())) return; // Skip invalid dates

        const dayKey = logDate.toDateString();
        const dayOfWeek = logDate.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const energyConsumed = parseFloat(log.energy_consumed_kwh) || 0;

        if (energyConsumed <= 0) return; // Skip zero or negative energy logs

        // Track daily totals
        if (!dailyUsage[dayKey]) {
            dailyUsage[dayKey] = 0;
        }
        dailyUsage[dayKey] += energyConsumed;

        // Track weekday vs weekend patterns - store individual log values, not daily totals
        if (isWeekend) {
            weekendUsage.push(energyConsumed);
        } else {
            weekdayUsage.push(energyConsumed);
        }

        // Track appliance-specific patterns
        const applianceName = appliances.find(a => a.uid === log.appliance_id)?.name || log.appliance_id;
        if (!applianceUsagePatterns[applianceName]) {
            applianceUsagePatterns[applianceName] = [];
        }
        applianceUsagePatterns[applianceName].push({
            usage: energyConsumed,
            date: logDate,
            dayOfWeek: dayOfWeek,
            isWeekend: isWeekend
        });
    });

    // Calculate statistics
    const dailyUsageValues = Object.values(dailyUsage);
    const avgDailyUsage = dailyUsageValues.length > 0 ? dailyUsageValues.reduce((sum, val) => sum + val, 0) / dailyUsageValues.length : current_usage_kwh / days_passed;

    // Calculate weekday vs weekend daily averages
    const weekdayDailyTotals = [];
    const weekendDailyTotals = [];

    Object.entries(dailyUsage).forEach(([dayKey, totalUsage]) => {
        const date = new Date(dayKey);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (isWeekend) {
            weekendDailyTotals.push(totalUsage);
        } else {
            weekdayDailyTotals.push(totalUsage);
        }
    });

    const avgWeekdayUsage = weekdayDailyTotals.length > 0 ? weekdayDailyTotals.reduce((sum, val) => sum + val, 0) / weekdayDailyTotals.length : avgDailyUsage;
    const avgWeekendUsage = weekendDailyTotals.length > 0 ? weekendDailyTotals.reduce((sum, val) => sum + val, 0) / weekendDailyTotals.length : avgDailyUsage;

    // Detect anomalies and outliers
    const sortedDailyUsage = dailyUsageValues.sort((a, b) => a - b);
    const median = sortedDailyUsage[Math.floor(sortedDailyUsage.length / 2)] || 0;
    const q1 = sortedDailyUsage[Math.floor(sortedDailyUsage.length * 0.25)] || 0;
    const q3 = sortedDailyUsage[Math.floor(sortedDailyUsage.length * 0.75)] || 0;
    const iqr = q3 - q1;
    const outlierThreshold = q3 + (1.5 * iqr);

    // Filter out extreme outliers for more stable projection
    const normalDailyUsage = dailyUsageValues.filter(usage => usage <= outlierThreshold);
    const stableAvgDailyUsage = normalDailyUsage.length > 0 ?
        normalDailyUsage.reduce((sum, val) => sum + val, 0) / normalDailyUsage.length : avgDailyUsage;

    // Calculate remaining days breakdown
    const remainingWeekdays = Math.floor(remainingDays * (5 / 7)); // Approximate weekdays
    const remainingWeekends = remainingDays - remainingWeekdays; // Approximate weekend days

    // Smart projection based on patterns
    let projectedRemainingUsage;
    if (weekdayDailyTotals.length > 0 && weekendDailyTotals.length > 0 && !isNaN(avgWeekdayUsage) && !isNaN(avgWeekendUsage)) {
        // Use weekday/weekend pattern if we have enough data
        projectedRemainingUsage = (remainingWeekdays * avgWeekdayUsage) + (remainingWeekends * avgWeekendUsage);
    } else if (!isNaN(stableAvgDailyUsage) && stableAvgDailyUsage > 0) {
        // Use stable average if pattern data is insufficient
        projectedRemainingUsage = remainingDays * stableAvgDailyUsage;
    } else {
        // Fallback to simple daily average
        const simpleDailyAvg = current_usage_kwh / days_passed;
        projectedRemainingUsage = remainingDays * simpleDailyAvg;
    }

    // Ensure we don't have NaN values
    if (isNaN(projectedRemainingUsage) || projectedRemainingUsage < 0) {
        projectedRemainingUsage = remainingDays * (current_usage_kwh / days_passed);
    }

    // Apply seasonal and trend adjustments
    let seasonalMultiplier = 1.0;
    const month = now.getMonth();

    // Adjust for seasonal patterns (India-specific)
    if (month >= 3 && month <= 6) { // April to July (hot season)
        seasonalMultiplier = 1.15; // Higher AC usage
    } else if (month >= 10 && month <= 2) { // November to March (cooler season)
        seasonalMultiplier = 0.9; // Lower AC usage
    }

    // Apply trend analysis - check if usage is increasing or decreasing
    let trendMultiplier = 1.0;
    if (dailyUsageValues.length >= 7) {
        const recentWeek = dailyUsageValues.slice(-7);
        const earlierWeek = dailyUsageValues.slice(-14, -7);

        if (earlierWeek.length > 0) {
            const recentAvg = recentWeek.reduce((sum, val) => sum + val, 0) / recentWeek.length;
            const earlierAvg = earlierWeek.reduce((sum, val) => sum + val, 0) / earlierWeek.length;
            trendMultiplier = recentAvg / earlierAvg;

            // Apply trend but cap it to prevent extreme projections
            trendMultiplier = Math.max(0.8, Math.min(1.2, trendMultiplier));
            projectedRemainingUsage *= trendMultiplier;
        }
    }

    // Apply seasonal adjustment
    projectedRemainingUsage *= seasonalMultiplier;

    // Calculate final projections
    const projectedTotalUsage = current_usage_kwh + projectedRemainingUsage;
    const projectedTotalCost = calculate_usage_cost({ units_kwh: projectedTotalUsage }).total_cost_inr;

    // Calculate confidence level based on data quality
    let confidence = 'medium';
    if (dailyUsageValues.length >= 14 && weekdayUsage.length >= 5 && weekendUsage.length >= 2) {
        confidence = 'high';
    } else if (dailyUsageValues.length < 7) {
        confidence = 'low';
    }

    // Generate insights
    const insights = [];

    if (projectedTotalCost > monthly_budget) {
        const overage = projectedTotalCost - monthly_budget;
        const percentageOver = ((overage / monthly_budget) * 100).toFixed(1);
        insights.push(`Projected to exceed budget by ₹${overage.toFixed(2)} (${percentageOver}%)`);
    } else {
        const savings = monthly_budget - projectedTotalCost;
        insights.push(`Projected to stay within budget with ₹${savings.toFixed(2)} remaining`);
    }

    if (avgWeekendUsage > avgWeekdayUsage * 1.2) {
        insights.push('Weekend usage is significantly higher than weekdays');
    } else if (avgWeekdayUsage > avgWeekendUsage * 1.2) {
        insights.push('Weekday usage is significantly higher than weekends');
    }

    // Add trend insights
    if (trendMultiplier > 1.1) {
        insights.push('Usage trend is increasing - consider energy-saving measures');
    } else if (trendMultiplier < 0.9) {
        insights.push('Usage trend is decreasing - good energy management');
    }

    // Identify top usage patterns
    const topAppliances = Object.entries(applianceUsagePatterns)
        .map(([name, patterns]) => ({
            name,
            totalUsage: patterns.reduce((sum, p) => sum + p.usage, 0),
            avgUsage: patterns.reduce((sum, p) => sum + p.usage, 0) / patterns.length
        }))
        .sort((a, b) => b.totalUsage - a.totalUsage)
        .slice(0, 3);

    if (topAppliances.length > 0) {
        insights.push(`Top energy consumers: ${topAppliances.map(a => a.name).join(', ')}`);
    }

    return {
        projected_total_usage_kwh: parseFloat(projectedTotalUsage.toFixed(4)),
        projected_total_cost_inr: parseFloat(projectedTotalCost.toFixed(2)),
        confidence_level: confidence,
        analysis_insights: insights,
        usage_patterns: {
            avg_daily_usage: parseFloat(avgDailyUsage.toFixed(4)),
            avg_weekday_usage: parseFloat(avgWeekdayUsage.toFixed(4)),
            avg_weekend_usage: parseFloat(avgWeekendUsage.toFixed(4)),
            stable_avg_daily_usage: parseFloat(stableAvgDailyUsage.toFixed(4)),
            seasonal_multiplier: seasonalMultiplier,
            trend_multiplier: trendMultiplier,
            days_analyzed: dailyUsageValues.length,
            outliers_detected: dailyUsageValues.length - normalDailyUsage.length
        },
        methodology: 'AI-powered analysis considering usage patterns, seasonal trends, weekday/weekend differences, and outlier detection'
    };
};

const set_power_saving_mode = ({ mode }) => {
    console.log(`AI TOOL: Setting power saving mode to "${mode}"`);
    const validModes = ['balanced', 'power-saving', 'extreme'];
    if (!validModes.includes(mode)) {
        return { success: false, message: `Invalid mode. Please choose from: ${validModes.join(', ')}.` };
    }
    writeData('ai_details.json', { mode });

    clear_ai_routines();

    const userData = get_user_and_appliances_data();
    const usageLogs = read_usage_logs();

    return {
        success: true,
        message: `Power saving mode set to '${mode}'. All AI routines cleared. Ready to create new routines.`,
        analysis_data: {
            ...userData,
            usage_logs: usageLogs
        }
    };
};

// --- Tool Definitions for AI ---

const tools = {
    detect_anomalies, get_top_news_headlines, check_appliance_maintenance,
    get_weather_data, get_user_and_appliances_data, read_usage_logs, calculate_usage_cost,
    find_and_control_appliances, modify_appliance_details, add_appliance,
    manage_routines, list_routines, set_power_saving_mode, calculate_intelligent_projection,
};

const toolDefinitions = {
    functionDeclarations: [
        { name: "detect_anomalies", description: "Detects unusual appliance usage, such as devices being left on for an abnormally long time.", parameters: { type: "OBJECT", properties: {} } },
        { name: "get_top_news_headlines", description: "Gets the top 5 latest news headlines for the user's country.", parameters: { type: "OBJECT", properties: {} } },
        { name: "check_appliance_maintenance", description: "Checks if any appliances have exceeded their recommended usage hours and require maintenance.", parameters: { type: "OBJECT", properties: {} } },
        { name: "get_weather_data", description: "Gets the live, current weather data for the user's configured location, including temperature and condition.", parameters: { type: "OBJECT", properties: {} } },
        { name: "get_user_and_appliances_data", description: "Get essential data about the user and all appliances. Your first step for any analytical query.", parameters: { type: "OBJECT", properties: {} } },
        { name: "read_usage_logs", description: "Reads detailed historical usage logs for all appliances to analyze patterns and provide data-driven advice.", parameters: { type: "OBJECT", properties: {} } },
        { name: "calculate_usage_cost", description: "Calculates the electricity cost for a given number of units (kWh) based on tiered rates.", parameters: { type: "OBJECT", properties: { "units_kwh": { type: "NUMBER", description: "Total kWh units to calculate the cost for." } }, required: ["units_kwh"] } },
        { name: "find_and_control_appliances", description: "Finds and controls one or more appliances by name or type.", parameters: { type: "OBJECT", properties: { "appliance_names": { type: "ARRAY", items: { type: "STRING" }, description: "An array of specific appliance names." }, "appliance_type": { type: "STRING", description: "The type of appliances to control, e.g., 'Lighting', 'Fan', or 'all'." }, "new_state": { type: "STRING", enum: ["on", "off"] } }, required: ["new_state"] } },
        { name: "modify_appliance_details", description: "Modifies the details of a specific appliance, like its priority level.", parameters: { type: "OBJECT", properties: { "appliance_name": { type: "STRING", description: "The exact name of the appliance to modify." }, "updates": { type: "OBJECT", "description": "An object with fields to update, e.g., {\"priorityLevel\": 5}." } }, required: ["appliance_name", "updates"] } },
        { name: "add_appliance", description: "Adds a new appliance to the smart home system.", parameters: { type: "OBJECT", properties: { "name": { type: "STRING" }, "type": { type: "STRING" }, "powerUsagePerHour": { type: "NUMBER" }, "description": { type: "STRING" }, "location": { type: "STRING" } }, required: ["name", "type", "powerUsagePerHour"] } },
        { name: "manage_routines", description: "Creates and deletes multiple routines in a single, efficient action. Use this for all routine management.", parameters: { type: "OBJECT", properties: { "routines_to_create": { type: "ARRAY", items: { type: "OBJECT", properties: { "name": { type: "STRING" }, "description": { type: "STRING" }, "time": { type: "STRING" }, "days": { type: "ARRAY", items: { type: "STRING" } }, "appliance_name": { type: "STRING" }, "command": { type: "STRING", enum: ["turnOn", "turnOff"] } }, required: ["name", "time", "days", "appliance_name", "command"] } }, "routine_names_to_delete": { type: "ARRAY", items: { "type": "STRING" }, description: "An array of exact routine names to delete." } } } },
        { name: "list_routines", description: "Gets a list of all currently active routines.", parameters: { type: "OBJECT", properties: {} } },
        { name: "set_power_saving_mode", description: "Sets the AI's operational mode. This clears old AI routines and provides the necessary data to create new ones.", parameters: { type: "OBJECT", properties: { "mode": { type: "STRING", enum: ["balanced", "power-saving", "extreme"] } }, required: ["mode"] } },
        { name: "calculate_intelligent_projection", description: "Calculates intelligent cost projection using AI analysis of usage patterns, seasonal trends, and anomaly detection instead of simple averaging.", parameters: { type: "OBJECT", properties: { "current_usage_kwh": { type: "NUMBER", description: "Current total usage in kWh" }, "current_cost_inr": { type: "NUMBER", description: "Current total cost in INR" }, "days_passed": { type: "NUMBER", description: "Number of days passed in current month" }, "monthly_budget": { type: "NUMBER", description: "User's monthly budget in INR" } }, required: ["current_usage_kwh", "current_cost_inr", "days_passed", "monthly_budget"] } }
    ]
};

module.exports = { tools, toolDefinitions };