const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// --- File Paths ---
const DATA_DIR = path.join(__dirname, '../data');
const appliancesDataPath = path.join(DATA_DIR, 'appliances.json');
const usageLogsDataPath = path.join(DATA_DIR, 'usage_logs.json');
const routinesDataPath = path.join(DATA_DIR, 'routines.json');

// --- Data Directory Initialization ---
const initializeDataFiles = () => {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('📁 Created data directory');
    }

    // Create appliances.json if it doesn't exist
    if (!fs.existsSync(appliancesDataPath)) {
        const initialData = [];
        fs.writeFileSync(appliancesDataPath, JSON.stringify(initialData, null, 2));
        console.log('📄 Created appliances.json file');
    }

    // Create usage_logs.json if it doesn't exist
    if (!fs.existsSync(usageLogsDataPath)) {
        const initialData = [];
        fs.writeFileSync(usageLogsDataPath, JSON.stringify(initialData, null, 2));
        console.log('📄 Created usage_logs.json file');
    }
};

// Initialize data files
initializeDataFiles();

// --- Enhanced Helper Functions to Read/Write Data --- //
const loadAppliances = () => {
    try {
        if (!fs.existsSync(appliancesDataPath)) {
            return [];
        }

        const data = fs.readFileSync(appliancesDataPath, 'utf8');
        const appliances = JSON.parse(data);

        // Validate data structure
        if (!Array.isArray(appliances)) {
            console.warn('⚠️ Invalid appliances data format, initializing empty array');
            return [];
        }


        return appliances;

    } catch (error) {
        console.error('❌ Error loading appliances:', error);

        // Backup corrupted file
        if (fs.existsSync(appliancesDataPath)) {
            const backupFile = `${appliancesDataPath}.backup.${Date.now()}`;
            fs.copyFileSync(appliancesDataPath, backupFile);
            console.log(`💾 Corrupted file backed up to: ${backupFile}`);
        }

        return [];
    }
};

const saveAppliances = (appliances) => {
    try {
        // Validate input
        if (!Array.isArray(appliances)) {
            throw new Error('Appliances data must be an array');
        }

        // Create backup before saving
        if (fs.existsSync(appliancesDataPath)) {
            const backupFile = `${appliancesDataPath}.backup`;
            fs.copyFileSync(appliancesDataPath, backupFile);
        }

        // Save with proper formatting
        const jsonData = JSON.stringify(appliances, null, 2);
        fs.writeFileSync(appliancesDataPath, jsonData, 'utf8');

        console.log(`💾 Saved ${appliances.length} appliances to storage`);
        return true;

    } catch (error) {
        console.error('❌ Error saving appliances:', error);

        // Restore from backup if save failed
        const backupFile = `${appliancesDataPath}.backup`;
        if (fs.existsSync(backupFile)) {
            fs.copyFileSync(backupFile, appliancesDataPath);
            console.log('🔄 Restored from backup due to save error');
        }

        throw error;
    }
};

// Legacy compatibility functions
const readData = (filePath) => {
    if (filePath === appliancesDataPath) {
        return loadAppliances();
    }

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
    if (filePath === appliancesDataPath) {
        return saveAppliances(data);
    }

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing to ${path.basename(filePath)}:`, error);
    }
};

// --- Robust UID Generation System ---
const generateApplianceUID = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 5; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
};

// Alternative UID generation methods
const generateUUIDLikeUID = () => {
    return 'app_' + 'xxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const generateSequentialUID = (existingAppliances) => {
    const maxId = Math.max(...existingAppliances.map(a => {
        const parts = a.uid.split('_');
        return parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
    }), 0);
    return `app_${String(maxId + 1).padStart(6, '0')}`;
};

// Ensure UID uniqueness
const ensureUniqueUID = (uid, existingAppliances) => {
    while (existingAppliances.some(appliance => appliance.uid === uid)) {
        uid = generateApplianceUID();
    }
    return uid;
};

// Legacy function for backward compatibility
function generateRandomPassword(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
}

// --- Utility Functions ---
const calculateUptime = (lastStateChange) => {
    if (!lastStateChange) return 0;

    const now = new Date();
    const stateChangeTime = new Date(lastStateChange);

    return Math.round((now - stateChangeTime) / 1000); // Uptime in seconds
};

const validateApplianceData = (applianceData) => {
    const errors = [];

    if (!applianceData.name || !applianceData.name.trim()) {
        errors.push('Appliance name is required');
    }

    if (!applianceData.type || !applianceData.type.trim()) {
        errors.push('Appliance type is required');
    }

    if (applianceData.power_rating && isNaN(applianceData.power_rating)) {
        errors.push('Power rating must be a number');
    }

    if (applianceData.powerUsagePerHour && isNaN(applianceData.powerUsagePerHour)) {
        errors.push('Power usage per hour must be a number');
    }

    const validPriorities = ['high', 'medium', 'low'];
    if (applianceData.priority && !validPriorities.includes(applianceData.priority)) {
        errors.push('Priority must be high, medium, or low');
    }

    return errors;
};

const getApplianceStats = () => {
    const appliances = loadAppliances();

    return {
        total_appliances: appliances.length,
        active_appliances: appliances.filter(a => a.state === 'on').length,
        inactive_appliances: appliances.filter(a => a.state === 'off').length,
        by_type: appliances.reduce((acc, appliance) => {
            acc[appliance.type] = (acc[appliance.type] || 0) + 1;
            return acc;
        }, {}),
        by_room: appliances.reduce((acc, appliance) => {
            const room = appliance.room || appliance.location || 'Unknown';
            acc[room] = (acc[room] || 0) + 1;
            return acc;
        }, {}),
        total_power_consumption: appliances
            .filter(a => a.state === 'on')
            .reduce((sum, a) => sum + ((a.power_rating || a.powerUsagePerHour) || 0), 0)
    };
};

// --- Enhanced Usage Logging System ---
const logApplianceUsage = (uid, name, previousState, newState) => {
    try {
        // Load existing logs
        let logs = [];
        if (fs.existsSync(usageLogsDataPath)) {
            const data = fs.readFileSync(usageLogsDataPath, 'utf8');
            logs = JSON.parse(data);
        }

        // Create log entry
        const logEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            appliance_uid: uid,
            appliance_name: name,
            action: newState === 'on' ? 'turn_on' : 'turn_off',
            previous_state: previousState,
            new_state: newState,
            timestamp: new Date().toISOString(),
            duration: null // Will be calculated when turned off
        };

        // If turning off, calculate duration from last "on" log
        if (newState === 'off') {
            const lastOnLog = logs.reverse().find(log =>
                log.appliance_uid === uid && log.action === 'turn_on'
            );

            if (lastOnLog) {
                const onTime = new Date(lastOnLog.timestamp);
                const offTime = new Date();
                logEntry.duration = Math.round((offTime - onTime) / 1000); // Duration in seconds
            }

            logs.reverse(); // Restore original order
        }

        // Add new log
        logs.push(logEntry);

        // Keep only last 1000 logs to prevent file from growing too large
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }

        // Save logs
        fs.writeFileSync(usageLogsDataPath, JSON.stringify(logs, null, 2));

        console.log(`📊 Logged usage: ${name} ${newState}`);

    } catch (error) {
        console.error('❌ Error logging usage:', error);
    }
};

// --- Logic to update appliance details on turn-off (Legacy Support) ---
const updateApplianceOnTurnOff = (appliance, energyConsumedKwh, turnedOffTime) => {
    appliance.lastTurnedOffTimestamp = turnedOffTime;
    appliance.usageSinceLastTurnedOn = energyConsumedKwh;
    appliance.totalUsage += energyConsumedKwh; // Accumulate total usage
    appliance.lastTurnedOnTimestamp = null; // Reset the on timestamp
    return appliance;
};

// --- Logic to create a new usage log entry (Legacy Support) ---
const createUsageLog = (applianceId, sessionDetails) => {
    const { turnedOnTime, turnedOffTime, energyConsumedKwh, trigger } = sessionDetails;
    const durationSeconds = Math.round((turnedOffTime - turnedOnTime) / 1000);

    const newLog = {
        id: `log_${Date.now()}`,
        appliance_id: applianceId,
        start_timestamp: new Date(turnedOnTime).toISOString(),
        end_timestamp: new Date(turnedOffTime).toISOString(),
        time_duration_seconds: durationSeconds,
        energy_consumed_kwh: parseFloat(energyConsumedKwh.toFixed(5)),
        trigger: trigger
    };

    const usageLogs = readData(usageLogsDataPath);
    usageLogs.push(newLog);
    writeData(usageLogsDataPath, usageLogs);

    // Also log with new system
    logApplianceUsage(applianceId, 'Unknown', 'unknown', 'off');
};

// --- Enhanced Core State Change and Logging Function ---
async function setApplianceState(applianceId, newState, trigger = 'manual') {
    try {
        console.log(`🏛️ Controlling appliance ${applianceId} - Setting state to: ${newState}`);

        // Validate state parameter
        if (!newState || (newState !== 'on' && newState !== 'off')) {
            console.error('❌ Invalid state. Must be "on" or "off"');
            return { success: false, message: 'Invalid state. Must be "on" or "off"' };
        }

        // Load appliances
        let appliances = loadAppliances();
        const applianceIndex = appliances.findIndex(a => a.uid === applianceId);

        if (applianceIndex === -1) {
            console.error(`State Change Failed: Appliance with ID ${applianceId} not found.`);
            return { success: false, message: "Appliance not found." };
        }

        let appliance = appliances[applianceIndex];
        const previousState = appliance.state;

        if (appliance.state === newState) {
            return { success: true, message: `Appliance is already ${newState}.` };
        }

        if (newState === 'on') {
            appliance.lastTurnedOnTimestamp = Date.now();
            appliance.lastTurnedOffTimestamp = null; // Clear off timestamp
            appliance.last_state_change = new Date().toISOString();
            appliance.usage_count = (appliance.usage_count || 0) + 1;

            console.log(`Appliance ${appliance.name} turned ON.`);

        } else if (newState === 'off') {
            if (appliance.lastTurnedOnTimestamp) {
                const turnedOnTime = appliance.lastTurnedOnTimestamp;
                const turnedOffTime = Date.now();
                const durationMs = turnedOffTime - turnedOnTime;

                // **BUG FIX**: Duration must be in HOURS for kWh calculation.
                // (milliseconds / (1000ms/s * 60s/min * 60min/hr))
                const durationHours = durationMs / 3600000;

                const energyConsumedKwh = durationHours * (appliance.powerUsagePerHour || appliance.power_rating || 0);

                // Update the appliance object with new usage stats
                appliance = updateApplianceOnTurnOff(appliance, energyConsumedKwh, turnedOffTime);

                // Create a detailed log entry (legacy)
                createUsageLog(applianceId, { turnedOnTime, turnedOffTime, energyConsumedKwh, trigger });

                console.log(`Appliance ${appliance.name} turned OFF. Log created.`);
            }

            appliance.last_state_change = new Date().toISOString();
        }

        // Update state and metadata
        appliance.state = newState;
        appliance.updated_at = new Date().toISOString();

        appliances[applianceIndex] = appliance; // Place updated appliance back in the array

        // Save updated appliances
        saveAppliances(appliances);

        // Log the state change with new system
        logApplianceUsage(applianceId, appliance.name, previousState, newState);

        console.log(`✅ ${appliance.name} (${applianceId}) state changed: ${previousState} → ${newState}`);

        return {
            success: true,
            appliance,
            message: `Appliance ${newState} successfully`,
            previous_state: previousState,
            new_state: newState
        };

    } catch (error) {
        console.error('❌ Error controlling appliance state:', error);
        return {
            success: false,
            message: 'Failed to control appliance state',
            error: error.message
        };
    }
}


// --- Enhanced API Routes ---

// GET /appliances/health - Health Check and Statistics (must be before /:uid)
router.get('/health', (req, res) => {
    try {
        const appliances = loadAppliances();
        const stats = getApplianceStats();

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            appliance_count: appliances.length,
            stats: stats,
            system_info: {
                data_directory: DATA_DIR,
                files_exist: {
                    appliances: fs.existsSync(appliancesDataPath),
                    usage_logs: fs.existsSync(usageLogsDataPath)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /appliances/stats - Get Appliance Statistics (must be before /:uid)
router.get('/stats', (req, res) => {
    try {
        const stats = getApplianceStats();
        const appliances = loadAppliances();

        // Calculate additional statistics
        const uptimeStats = appliances
            .filter(a => a.state === 'on' && a.last_state_change)
            .map(a => ({
                uid: a.uid,
                name: a.name,
                uptime_seconds: calculateUptime(a.last_state_change)
            }));

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            basic_stats: stats,
            uptime_stats: uptimeStats,
            recent_activity: {
                total_logs: fs.existsSync(usageLogsDataPath) ?
                    JSON.parse(fs.readFileSync(usageLogsDataPath, 'utf8')).length : 0
            }
        });

    } catch (error) {
        console.error('❌ Error retrieving statistics:', error);
        res.status(500).json({
            error: 'Failed to retrieve statistics',
            details: error.message,
            code: 'GET_STATS_ERROR'
        });
    }
});

// GET /appliances - Retrieve All Appliances
router.get('/', (req, res) => {
    try {
        console.log('📱 Retrieving all appliances');

        const appliances = loadAppliances();

        // Ensure all appliances have required fields with safe defaults
        const safeAppliances = appliances.map(appliance => ({
            uid: appliance.uid || '',
            name: appliance.name || 'Unknown Device',
            type: appliance.type || 'other',
            powerUsagePerHour: parseFloat(appliance.powerUsagePerHour) || parseFloat(appliance.power_rating) || 0,
            state: appliance.state || 'off',
            totalUsage: parseFloat(appliance.totalUsage) || 0,
            usageSinceLastTurnedOn: parseFloat(appliance.usageSinceLastTurnedOn) || 0,
            priorityLevel: parseInt(appliance.priorityLevel) || 2,
            maxOnDuration: parseInt(appliance.maxOnDuration) || 0,
            description: appliance.description || '',
            location: appliance.location || appliance.room || 'Unknown',
            lastTurnedOnTimestamp: appliance.lastTurnedOnTimestamp || null,
            lastTurnedOffTimestamp: appliance.lastTurnedOffTimestamp || null,
            // Additional computed fields for compatibility
            status: appliance.state === 'on' ? 'Active' : 'Inactive',
            power_consumption: appliance.state === 'on' ? (parseFloat(appliance.power_rating) || parseFloat(appliance.powerUsagePerHour) || 0) : 0,
            uptime: appliance.state === 'on' && appliance.last_state_change ?
                calculateUptime(appliance.last_state_change) : 0,
            // Ensure backward compatibility
            power_rating: parseFloat(appliance.power_rating) || parseFloat(appliance.powerUsagePerHour) || 0,
            room: appliance.room || appliance.location || 'Unknown',
            priority: appliance.priority || 'medium',
            brand: appliance.brand || '',
            model: appliance.model || '',
            usage_hours: parseFloat(appliance.usage_hours) || 0,
            usage_count: parseInt(appliance.usage_count) || 0,
            last_maintenance: appliance.last_maintenance || new Date().toISOString(),
            last_state_change: appliance.last_state_change || null,
            created_at: appliance.created_at || new Date().toISOString(),
            updated_at: appliance.updated_at || new Date().toISOString()
        }));

        console.log(`📊 Retrieved ${appliances.length} appliances`);

        // Return just the appliances array for mobile compatibility
        res.json(safeAppliances);

    } catch (error) {
        console.error('❌ Error retrieving appliances:', error);
        res.status(500).json({
            error: 'Failed to retrieve appliances',
            details: error.message,
            code: 'GET_APPLIANCES_ERROR'
        });
    }
});

// GET /appliances/:uid - Get Specific Appliance
router.get('/:uid', (req, res) => {
    try {
        const { uid } = req.params;
        console.log(`🔍 Retrieving appliance: ${uid}`);

        const appliances = loadAppliances();
        const appliance = appliances.find(a => a.uid === uid);

        if (!appliance) {
            return res.status(404).json({
                error: `Appliance with ID ${uid} not found`,
                code: 'APPLIANCE_NOT_FOUND'
            });
        }

        // Add computed fields
        const enhancedAppliance = {
            ...appliance,
            status: appliance.state === 'on' ? 'Active' : 'Inactive',
            power_consumption: appliance.state === 'on' ? (appliance.power_rating || appliance.powerUsagePerHour || 0) : 0,
            uptime: appliance.state === 'on' && appliance.last_state_change ?
                calculateUptime(appliance.last_state_change) : 0
        };

        res.json({
            success: true,
            appliance: enhancedAppliance
        });

    } catch (error) {
        console.error('❌ Error retrieving appliance:', error);
        res.status(500).json({
            error: 'Failed to retrieve appliance',
            details: error.message,
            code: 'GET_APPLIANCE_ERROR'
        });
    }
});

// GET /appliances/:uid/state - Get Appliance State
router.get('/:uid/state', (req, res) => {
    try {
        const appliances = loadAppliances();
        const appliance = appliances.find(a => a.uid === req.params.uid);

        if (!appliance) {
            return res.status(404).json({
                error: 'Appliance not found',
                code: 'APPLIANCE_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            uid: appliance.uid,
            name: appliance.name,
            state: appliance.state,
            last_state_change: appliance.last_state_change || null,
            uptime: appliance.state === 'on' && appliance.last_state_change ?
                calculateUptime(appliance.last_state_change) : 0
        });

    } catch (error) {
        console.error('❌ Error retrieving appliance state:', error);
        res.status(500).json({
            error: 'Failed to retrieve appliance state',
            details: error.message,
            code: 'GET_STATE_ERROR'
        });
    }
});


// POST /appliances - Add New Appliance
router.post('/', (req, res) => {
    try {
        console.log('🔌 Adding new appliance:', req.body);

        // Load existing appliances
        const appliances = loadAppliances();

        // Validate input data
        const validationErrors = validateApplianceData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors,
                code: 'VALIDATION_ERROR'
            });
        }

        // Generate unique UID
        let uid = generateApplianceUID();
        uid = ensureUniqueUID(uid, appliances);

        // Create appliance object with all required fields
        const newAppliance = {
            uid: uid,
            name: req.body.name || 'Unnamed Appliance',
            type: req.body.type || 'other',
            room: req.body.room || req.body.location || 'Unknown',
            location: req.body.location || req.body.room || 'Unknown', // Backward compatibility
            brand: req.body.brand || '',
            model: req.body.model || '',
            power_rating: parseFloat(req.body.power_rating || req.body.powerUsagePerHour || 0),
            powerUsagePerHour: parseFloat(req.body.powerUsagePerHour || req.body.power_rating || 0), // Backward compatibility
            priority: req.body.priority || 'medium',
            priorityLevel: req.body.priorityLevel || (req.body.priority === 'high' ? 1 : req.body.priority === 'low' ? 3 : 2),
            description: req.body.description || '',
            state: 'off', // Always start as off
            totalUsage: 0,
            usageSinceLastTurnedOn: 0,
            usage_hours: 0,
            usage_count: 0,
            maxOnDuration: parseInt(req.body.maxOnDuration) || 0,
            last_maintenance: new Date().toISOString(),
            lastTurnedOnTimestamp: null,
            lastTurnedOffTimestamp: null,
            last_state_change: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Additional validation for required fields
        if (!newAppliance.name.trim()) {
            return res.status(400).json({
                error: 'Appliance name is required',
                code: 'MISSING_NAME'
            });
        }

        if (!newAppliance.type.trim()) {
            return res.status(400).json({
                error: 'Appliance type is required',
                code: 'MISSING_TYPE'
            });
        }

        // Add to appliances array
        appliances.push(newAppliance);

        // Save to file
        saveAppliances(appliances);

        console.log(`✅ Successfully added appliance: ${newAppliance.name} (ID: ${uid})`);

        // Return the created appliance
        res.status(201).json({
            success: true,
            message: 'Appliance added successfully',
            appliance: newAppliance
        });

    } catch (error) {
        console.error('❌ Error adding appliance:', error);
        res.status(500).json({
            error: 'Failed to add appliance',
            details: error.message,
            code: 'ADD_APPLIANCE_ERROR'
        });
    }
});

// PUT /appliances/:uid/state - Control On/Off State
router.put('/:uid/state', async (req, res) => {
    try {
        const { uid } = req.params;
        const { state } = req.body;

        console.log(`🏛️ Controlling appliance ${uid} - Setting state to: ${state}`);

        // Validate state parameter
        if (!state || (state !== 'on' && state !== 'off')) {
            return res.status(400).json({
                error: 'Invalid state. Must be "on" or "off"',
                code: 'INVALID_STATE'
            });
        }

        // Use the enhanced setApplianceState function
        const result = await setApplianceState(uid, state.toLowerCase(), 'manual');

        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                appliance: result.appliance,
                previous_state: result.previous_state,
                new_state: result.new_state
            });
        } else {
            const statusCode = result.message === 'Appliance not found.' ? 404 : 400;
            res.status(statusCode).json({
                error: result.message,
                code: result.message === 'Appliance not found.' ? 'APPLIANCE_NOT_FOUND' : 'STATE_CONTROL_ERROR'
            });
        }

    } catch (error) {
        console.error('❌ Error controlling appliance state:', error);
        res.status(500).json({
            error: 'Failed to control appliance state',
            details: error.message,
            code: 'STATE_CONTROL_ERROR'
        });
    }
});



// PUT /appliances/:uid - Update Appliance Details
router.put('/:uid', (req, res) => {
    try {
        const { uid } = req.params;
        console.log(`🔄 Updating appliance: ${uid}`);

        const appliances = loadAppliances();
        const index = appliances.findIndex(a => a.uid === uid);

        if (index === -1) {
            return res.status(404).json({
                error: 'Appliance not found',
                code: 'APPLIANCE_NOT_FOUND'
            });
        }

        // Validate update data
        const validationErrors = validateApplianceData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors,
                code: 'VALIDATION_ERROR'
            });
        }

        // Extract state to handle separately
        const { state, ...updateData } = req.body;

        // Update appliance with new data
        appliances[index] = {
            ...appliances[index],
            ...updateData,
            updated_at: new Date().toISOString()
        };

        // Handle power rating backward compatibility
        if (updateData.power_rating) {
            appliances[index].powerUsagePerHour = parseFloat(updateData.power_rating);
        }
        if (updateData.powerUsagePerHour) {
            appliances[index].power_rating = parseFloat(updateData.powerUsagePerHour);
        }

        saveAppliances(appliances);

        console.log(`✅ Successfully updated appliance: ${appliances[index].name}`);

        res.json({
            success: true,
            message: 'Appliance updated successfully',
            appliance: appliances[index]
        });

    } catch (error) {
        console.error('❌ Error updating appliance:', error);
        res.status(500).json({
            error: 'Failed to update appliance',
            details: error.message,
            code: 'UPDATE_APPLIANCE_ERROR'
        });
    }
});


// DELETE /appliances/:uid - Delete Appliance
router.delete('/:uid', (req, res) => {
    try {
        const { uid: applianceId } = req.params;
        console.log(`🗑️ Deleting appliance: ${applianceId}`);

        let appliances = loadAppliances();
        let routines = readData(routinesDataPath);

        const initialLength = appliances.length;
        const applianceToDelete = appliances.find(a => a.uid === applianceId);

        if (!applianceToDelete) {
            return res.status(404).json({
                error: 'Appliance not found',
                code: 'APPLIANCE_NOT_FOUND'
            });
        }

        // Remove appliance
        appliances = appliances.filter(a => a.uid !== applianceId);

        // Clean up related routines
        routines = routines.filter(routine => {
            if (routine.actions) {
                routine.actions = routine.actions.filter(action => action.applianceId !== applianceId);
            }
            return routine.appliance_id !== applianceId;
        });

        // Save updated data
        saveAppliances(appliances);
        writeData(routinesDataPath, routines);

        console.log(`✅ Successfully deleted appliance: ${applianceToDelete.name}`);

        res.status(200).json({
            success: true,
            message: `Appliance ${applianceToDelete.name} deleted successfully`,
            deleted_appliance: {
                uid: applianceToDelete.uid,
                name: applianceToDelete.name
            }
        });

    } catch (error) {
        console.error('❌ Error deleting appliance:', error);
        res.status(500).json({
            error: 'Failed to delete appliance',
            details: error.message,
            code: 'DELETE_APPLIANCE_ERROR'
        });
    }
});

module.exports = { router, setApplianceState };