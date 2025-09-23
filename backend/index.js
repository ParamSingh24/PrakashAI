const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load environment variables first
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Add error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// --- Route Imports with Error Handling ---
let applianceRouter, setApplianceState, routineRoutes, usageLogRoutes, chatbotRoutes, chatHistoryRoutes, autonomousAiRoutes, userRoutes, updateUserDashboard, generateProactiveAiSuggestions, runChat, runAutonomousAnalysis;

try {
    const applianceModule = require('./routes/appliances');
    applianceRouter = applianceModule.router;
    setApplianceState = applianceModule.setApplianceState;
    console.log('✅ Loaded appliances routes');
} catch (error) {
    console.error('❌ Failed to load appliances routes:', error.message);
    process.exit(1);
}

try {
    routineRoutes = require('./routes/routines');
    console.log('✅ Loaded routines routes');
} catch (error) {
    console.error('❌ Failed to load routines routes:', error.message);
    process.exit(1);
}

try {
    const usageLogModule = require('./routes/usage_logs');
    usageLogRoutes = usageLogModule.router;
    console.log('✅ Loaded usage logs routes');
} catch (error) {
    console.error('❌ Failed to load usage logs routes:', error.message);
    process.exit(1);
}

try {
    chatbotRoutes = require('./routes/chatbot');
    console.log('✅ Loaded chatbot routes');
} catch (error) {
    console.error('❌ Failed to load chatbot routes:', error.message);
    process.exit(1);
}

try {
    chatHistoryRoutes = require('./routes/chat_history');
    console.log('✅ Loaded chat history routes');
} catch (error) {
    console.error('❌ Failed to load chat history routes:', error.message);
    process.exit(1);
}

try {
    autonomousAiRoutes = require('./routes/autonomous_ai');
    console.log('✅ Loaded autonomous AI routes');
} catch (error) {
    console.error('❌ Failed to load autonomous AI routes:', error.message);
    process.exit(1);
}

try {
    const userModule = require('./routes/users');
    userRoutes = userModule.router;
    updateUserDashboard = userModule.updateUserDashboard;
    generateProactiveAiSuggestions = userModule.generateProactiveAiSuggestions;
    console.log('✅ Loaded user routes');
} catch (error) {
    console.error('❌ Failed to load user routes:', error.message);
    process.exit(1);
}

try {
    const geminiModule = require('./ai/gemini');
    runChat = geminiModule.runChat;
    console.log('✅ Loaded Gemini AI');
} catch (error) {
    console.error('❌ Failed to load Gemini AI:', error.message);
    process.exit(1);
}

try {
    const autonomousModule = require('./autonomous_ai/autonomous_gemini');
    runAutonomousAnalysis = autonomousModule.runAutonomousAnalysis;
    console.log('✅ Loaded Autonomous AI');
} catch (error) {
    console.error('❌ Failed to load Autonomous AI:', error.message);
    process.exit(1);
}

app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
    try {
        const appliancesDataPath = path.join(__dirname, './data/appliances.json');
        
        let applianceCount = 0;
        let dataStatus = 'healthy';
        
        if (fs.existsSync(appliancesDataPath)) {
            try {
                const appliances = JSON.parse(fs.readFileSync(appliancesDataPath, 'utf8'));
                applianceCount = appliances.length;
            } catch (parseError) {
                dataStatus = 'data_parse_error';
                console.error('Health check - appliances data parse error:', parseError.message);
            }
        } else {
            dataStatus = 'missing_data_files';
        }
        
        // Check environment variables
        const envStatus = {
            gemini_api: !!process.env.GEMINI_API_KEY,
            weather_api: !!process.env.WEATHER_API_KEY,
            news_api: !!process.env.NEWS_API_KEY
        };
        
        res.json({
            status: dataStatus === 'healthy' ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            server_port: port,
            node_version: process.version,
            appliance_count: applianceCount,
            data_status: dataStatus,
            environment: envStatus,
            services: {
                appliances: applianceRouter ? 'operational' : 'failed',
                routines: routineRoutes ? 'operational' : 'failed',
                chatbot: chatbotRoutes ? 'operational' : 'failed',
                autonomous_ai: autonomousAiRoutes ? 'operational' : 'failed',
                users: userRoutes ? 'operational' : 'failed'
            }
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
            server_port: port
        });
    }
});

// --- Route Definitions ---
app.use('/appliances', applianceRouter);
app.use('/routines', routineRoutes);
app.use('/logs', usageLogRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/chat-history', chatHistoryRoutes);
app.use('/autonomous-ai', autonomousAiRoutes);
app.use('/users', userRoutes);

// --- Data Paths ---
const routinesDataPath = path.join(__dirname, './data/routines.json');
const appliancesDataPath = path.join(__dirname, './data/appliances.json');
const USER_ID = 'krishnasinghprojects';

// --- Main System Scheduler ---
const runSystemChecks = async () => {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] Running system checks...`);

        await updateUserDashboard(USER_ID);

        const routinesJson = fs.readFileSync(routinesDataPath, 'utf-8');
        const routines = routinesJson.trim() === '' ? [] : JSON.parse(routinesJson);

        if (routines.length > 0) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const currentDay = now.toLocaleString('en-US', { weekday: 'long' });

            for (const routine of routines) {
                if (!routine.schedule || !routine.actions) continue;
                const { time, days } = routine.schedule;
                const isTimeMatch = (time === currentTime);
                const isDayMatch = days.some(day => day.toLowerCase() === currentDay.toLowerCase());

                if (isTimeMatch && isDayMatch) {
                    console.log(`Executing routine: ${routine.name} at ${currentTime}`);
                    for (const action of routine.actions) {
                        const { applianceId, command } = action;
                        let newState;

                        // Parse the command to extract the state - check turnOn first to avoid conflicts
                        if (command === 'turnOn' || command.toLowerCase().includes('turnon')) {
                            newState = 'on';
                        } else if (command === 'turnOff' || command.toLowerCase().includes('turnoff')) {
                            newState = 'off';
                        } else if (command.toLowerCase().includes('on') && !command.toLowerCase().includes('off')) {
                            newState = 'on';
                        } else if (command.toLowerCase().includes('off')) {
                            newState = 'off';
                        }

                        if (newState && (newState === 'on' || newState === 'off')) {
                            console.log(`Executing action: ${command} on appliance ${applianceId} -> ${newState}`);
                            await setApplianceState(applianceId, newState, 'routine');
                        } else {
                            console.log(`Invalid command format: ${command}. Expected 'turnOn' or 'turnOff'.`);
                        }
                    }
                }
            }
        }

        const appliances = JSON.parse(fs.readFileSync(appliancesDataPath, 'utf-8'));
        for (const appliance of appliances) {
            if (appliance.state === 'on' && appliance.maxOnDuration && appliance.lastTurnedOnTimestamp) {
                const durationMinutes = (Date.now() - appliance.lastTurnedOnTimestamp) / (1000 * 60);
                if (durationMinutes > appliance.maxOnDuration) {
                    console.log(`MAX DURATION: ${appliance.name} has been on for too long. Turning off.`);
                    await setApplianceState(appliance.uid, 'off', 'max_duration');
                }
            }
        }

    } catch (error) {
        console.error('[Scheduler Error] Failed to run system checks:', error.message);
    }
};

// --- Proactive AI Schedulers ---
const runProactiveAIChecks = () => {
    generateProactiveAiSuggestions(USER_ID);
};

const runAnomalyDetection = async () => {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] Running autonomous anomaly detection...`);
        await runChat("Perform an autonomous proactive check to find and resolve anomalies.");
        console.log("Anomaly detection check complete.");
    } catch (error) {
        console.error('[Anomaly Detection Error]:', error.message);
    }
};

// --- Autonomous AI Scheduler ---
const runAutonomousAI = async () => {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] Running autonomous AI analysis...`);
        const result = await runAutonomousAnalysis();
        if (result.success) {
            console.log(`Autonomous AI analysis complete. Tool calls: ${result.toolCalls.length}`);
        } else {
            console.log(`Autonomous AI analysis failed: ${result.error}`);
        }
    } catch (error) {
        console.error('[Autonomous AI Error]:', error.message);
    }
};

// --- Server Start ---
const server = app.listen(port, () => {
    console.log(`🚀 PrakashAI server listening at http://localhost:${port}`);
    console.log(`📊 Health check available at: http://localhost:${port}/health`);

    // Initialize routines file if it doesn't exist
    try {
        if (!fs.existsSync(routinesDataPath) || fs.readFileSync(routinesDataPath, 'utf-8').trim() === '') {
            fs.writeFileSync(routinesDataPath, '[]');
            console.log('✅ Initialized routines.json');
        }
    } catch (error) {
        console.error('❌ Failed to initialize routines.json:', error.message);
    }

    // Start schedulers with error handling
    try {
        console.log('⏰ System scheduler is active and will run every minute.');
        setInterval(() => {
            runSystemChecks().catch(error => {
                console.error('❌ System check failed:', error.message);
            });
        }, 60000);
        runSystemChecks().catch(error => {
            console.error('❌ Initial system check failed:', error.message);
        });
    } catch (error) {
        console.error('❌ Failed to start system scheduler:', error.message);
    }

    try {
        console.log('🤖 Proactive AI suggestion scheduler is active and will run every hour.');
        setInterval(() => {
            runProactiveAIChecks();
        }, 3600000); // 1 hour
        runProactiveAIChecks();
    } catch (error) {
        console.error('❌ Failed to start proactive AI scheduler:', error.message);
    }

    try {
        console.log('🔍 Anomaly detection scheduler is active and will run every 15 minutes.');
        setInterval(() => {
            runAnomalyDetection().catch(error => {
                console.error('❌ Anomaly detection failed:', error.message);
            });
        }, 900000); // 15 minutes
        runAnomalyDetection().catch(error => {
            console.error('❌ Initial anomaly detection failed:', error.message);
        });
    } catch (error) {
        console.error('❌ Failed to start anomaly detection scheduler:', error.message);
    }

    try {
        console.log('🧠 Autonomous AI scheduler is active and will run every hour.');
        setInterval(() => {
            runAutonomousAI().catch(error => {
                console.error('❌ Autonomous AI failed:', error.message);
            });
        }, 3600000); // 1 hour
        // Run autonomous AI after a 2-minute delay to let the system initialize
        setTimeout(() => {
            runAutonomousAI().catch(error => {
                console.error('❌ Initial autonomous AI failed:', error.message);
            });
        }, 120000);
    } catch (error) {
        console.error('❌ Failed to start autonomous AI scheduler:', error.message);
    }

    console.log('✅ All systems initialized successfully!');
}).on('error', (error) => {
    console.error('❌ Server failed to start:', error.message);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please try a different port or stop the existing server.`);
    }
    process.exit(1);
});