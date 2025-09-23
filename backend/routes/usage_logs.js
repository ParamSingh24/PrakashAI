const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// --- File Paths ---
const appliancesDataPath = path.join(__dirname, '../data/appliances.json');
const usageLogsDataPath = path.join(__dirname, '../data/usage_logs.json');
const routinesDataPath = path.join(__dirname, '../data/routines.json');

// --- Helper Functions to Read/Write Data --- //
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

// --- Logic to update appliance details on turn-off ---
const updateApplianceOnTurnOff = (appliance, energyConsumedKwh, turnedOffTime) => {
    appliance.lastTurnedOffTimestamp = turnedOffTime;
    appliance.usageSinceLastTurnedOn = energyConsumedKwh;
    // This line correctly adds the latest session's usage to the total
    appliance.totalUsage += energyConsumedKwh; 
    appliance.lastTurnedOnTimestamp = null; 
    return appliance;
};

// --- Logic to create a new usage log entry ---
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
};

// --- Core State Change and Logging Function ---
async function setApplianceState(applianceId, newState, trigger = 'manual') {
    let appliances = readData(appliancesDataPath);
    const applianceIndex = appliances.findIndex(a => a.uid === applianceId);

    if (applianceIndex === -1) {
        console.error(`State Change Failed: Appliance with ID ${applianceId} not found.`);
        return { success: false, message: "Appliance not found." };
    }

    let appliance = appliances[applianceIndex];

    if (appliance.state === newState) {
        return { success: true, message: `Appliance is already ${newState}.` };
    }

    if (newState === 'on') {
        appliance.lastTurnedOnTimestamp = Date.now();
        appliance.lastTurnedOffTimestamp = null; // Clear off timestamp
        console.log(`Appliance ${appliance.name} turned ON.`);
    } else if (newState === 'off') {
        if (appliance.lastTurnedOnTimestamp) {
            const turnedOnTime = appliance.lastTurnedOnTimestamp;
            const turnedOffTime = Date.now();
            const durationMs = turnedOffTime - turnedOnTime;
            const durationHours = durationMs / 3600000; // Convert ms to hours for kWh calculation
            const energyConsumedKwh = durationHours * appliance.powerUsagePerHour;

            // Update the appliance object with new usage stats, including totalUsage
            appliance = updateApplianceOnTurnOff(appliance, energyConsumedKwh, turnedOffTime);

            // Create a detailed log entry
            createUsageLog(applianceId, { turnedOnTime, turnedOffTime, energyConsumedKwh, trigger });
            
            console.log(`Appliance ${appliance.name} turned OFF. Log created.`);
        }
    }

    appliance.state = newState;
    // Place the fully updated appliance object back into the array
    appliances[applianceIndex] = appliance; 
    // Save the entire updated array back to the file
    writeData(appliancesDataPath, appliances);
    return { success: true, appliance };
}


// --- API Routes ---

router.get('/', (req, res) => {
    const appliances = readData(appliancesDataPath);
    res.json(appliances);
});

router.get('/:uid', (req, res) => {
    const appliances = readData(appliancesDataPath);
    const appliance = appliances.find(a => a.uid === req.params.uid);
    if (appliance) {
        res.json(appliance);
    } else {
        res.status(404).send('Appliance not found');
    }
});

router.post('/', (req, res) => {
    const { name, type, powerUsagePerHour, description, location } = req.body;
    if (!name || !type || !powerUsagePerHour) {
        return res.status(400).send('Missing required fields: name, type, powerUsagePerHour');
    }

    // Generate 5-digit alphanumeric UID
    const generateApplianceUID = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < 5; i++) {
            password += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return password;
    };

    const appliances = readData(appliancesDataPath);
    const newAppliance = {
        uid: generateApplianceUID(),
        name,
        type,
        powerUsagePerHour: parseFloat(powerUsagePerHour),
        state: "off",
        totalUsage: 0,
        usageSinceLastTurnedOn: 0,
        priorityLevel: 0,
        maxOnDuration: 0,
        description: description || "",
        location: location || "",
        lastTurnedOnTimestamp: null,
        lastTurnedOffTimestamp: null,
    };
    appliances.push(newAppliance);
    writeData(appliancesDataPath, appliances);

    res.status(201).json(newAppliance);
});

router.put('/:uid/state', async (req, res) => {
    const { state } = req.body;
    const validStates = ['on', 'off'];
    if (!state || !validStates.includes(state.toLowerCase())) {
        return res.status(400).send('Request body must include a valid "state" property ("on" or "off").');
    }

    const result = await setApplianceState(req.params.uid, state.toLowerCase(), 'manual');

    if (result.success) {
        res.status(200).json(result.appliance);
    } else {
        res.status(404).send(result.message);
    }
});

router.put('/:uid', (req, res) => {
    const appliances = readData(appliancesDataPath);
    const index = appliances.findIndex(a => a.uid === req.params.uid);

    if (index !== -1) {
        const { state, ...updateData } = req.body;
        appliances[index] = { ...appliances[index], ...updateData };
        writeData(appliancesDataPath, appliances);
        res.json(appliances[index]);
    } else {
        res.status(404).send('Appliance not found');
    }
});

router.delete('/:uid', (req, res) => {
    const applianceId = req.params.uid;
    let appliances = readData(appliancesDataPath);
    let routines = readData(routinesDataPath);

    const initialLength = appliances.length;
    appliances = appliances.filter(a => a.uid !== applianceId);

    if (appliances.length === initialLength) {
        return res.status(404).send('Appliance not found');
    }

    routines = routines.filter(routine => {
        if (routine.actions) {
            routine.actions = routine.actions.filter(action => action.applianceId !== applianceId);
        }
        return routine.appliance_id !== applianceId;
    });

    writeData(appliancesDataPath, appliances);
    writeData(routinesDataPath, routines);

    res.status(200).send(`Appliance ${applianceId} deleted successfully.`);
});


module.exports = { router, setApplianceState };
