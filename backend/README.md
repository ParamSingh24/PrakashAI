# Ecosync Nexus

Ecosync Nexus is a smart home automation server designed to provide intelligent, proactive, and efficient management of home appliances. It features a powerful AI assistant that can learn user habits, suggest energy-saving routines, and respond to natural language commands.

## Server Architecture

The Ecosync Nexus server is built with a monolithic architecture. It's a single, self-contained application that handles all aspects of the smart home system, including:

*   **API Endpoints:** Exposing RESTful APIs for managing appliances, routines, users, and more.
*   **AI Integration:** A built-in AI assistant powered by Google's Gemini model.
*   **Data Management:** Storing and managing all data in local JSON files.
*   **Scheduling:** Running scheduled tasks for system checks, routine execution, and proactive AI analysis.

This monolithic design simplifies development, deployment, and management, making it an ideal choice for a self-contained smart home hub.

## API Routes

The server exposes the following API routes:

### Appliances

*   **`GET /appliances`**: Retrieves a list of all appliances.
*   **`GET /appliances/:uid`**: Retrieves a specific appliance by its unique ID.
*   **`POST /appliances`**: Adds a new appliance.
*   **`PUT /appliances/:uid`**: Updates the details of an existing appliance.
*   **`PUT /appliances/:uid/state`**: Changes the state of an appliance (on/off).
*   **`DELETE /appliances/:uid`**: Deletes an appliance.

### Routines

*   **`GET /routines`**: Retrieves all routines.
*   **`GET /routines/:id`**: Retrieves a specific routine by its ID.
*   **`POST /routines`**: Creates a new routine.
*   **`PUT /routines/:id`**: Updates an existing routine.
*   **`DELETE /routines/:id`**: Deletes a routine.
*   **`POST /routines/:id/execute`**: Manually triggers the actions of a specific routine

### Usage Logs

*   **`GET /logs`**: Retrieves all usage logs.

### Users

*   **`GET /users/:uid`**: Retrieves user data, including the dashboard.
*   **`POST /users/:uid/refresh`**: Refreshes the user's dashboard data.

### Chatbot

*   **`POST /chatbot`**: Interacts with the AI assistant.

### Chat History

*   **`GET /chat-history`**: Retrieves all chat history.
*   **`GET /chat-history/recent/:count`**: Retrieves the most recent N chat messages.
*   **`GET /chat-history/stats`**: Retrieves chat statistics including tool usage analytics.
*   **`GET /chat-history/export`**: Exports chat history as a downloadable JSON file.
*   **`GET /chat-history/search/:query`**: Searches chat history for specific terms.
*   **`DELETE /chat-history`**: Clears all chat history.

### Autonomous AI

*   **`POST /autonomous-ai/analyze`**: Manually trigger autonomous AI analysis.
*   **`GET /autonomous-ai/stats`**: Get autonomous AI execution statistics.
*   **`GET /autonomous-ai/log`**: Get complete autonomous AI execution log.
*   **`GET /autonomous-ai/log/recent/:count`**: Get recent autonomous AI log entries.
*   **`GET /autonomous-ai/status`**: Get current autonomous AI system status.

## AI Tools

The Ecosync Nexus AI assistant is equipped with a versatile set of tools to manage the smart home and provide helpful information:

*   **`detect_anomalies`**: Detects unusual appliance usage, such as devices being left on for an abnormally long time.
*   **`get_top_news_headlines`**: Gets the top 5 latest news headlines for the user's country.
*   **`check_appliance_maintenance`**: Checks if any appliances have exceeded their recommended usage hours and require maintenance.
*   **`get_weather_data`**: Gets the live, current weather data for the user's configured location, including temperature and condition.
*   **`get_user_and_appliances_data`**: Get essential data about the user and all appliances.
*   **`read_usage_logs`**: Reads detailed historical usage logs for all appliances to analyze patterns and provide data-driven advice.
*   **`calculate_usage_cost`**: Calculates the electricity cost for a given number of units (kWh) based on tiered rates.
*   **`find_and_control_appliances`**: Finds and controls one or more appliances by name or type.
*   **`modify_appliance_details`**: Modifies the details of a specific appliance, like its priority level.
*   **`add_appliance`**: Adds a new appliance to the smart home system.
*   **`manage_routines`**: Creates and deletes multiple routines in a single, efficient action.
*   **`list_routines`**: Gets a list of all currently active routines.
*   **`set_power_saving_mode`**: Sets the AI's operational mode. This clears old AI routines and provides the necessary data to create new ones.

## Getting Started

To get the Ecosync Nexus server up and running, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment Variables:**
    Create a `.env` file in the root of the project and add the following:
    ```
    GEMINI_API_KEY=your_gemini_api_key
    AUTONOMOUS_GEMINI_API_KEY=your_autonomous_gemini_api_key
    NEWS_API_KEY=your_news_api_key
    WEATHER_API_KEY=your_weather_api_key
    ```
3.  **Start the Server:**
    ```bash
    node index.js
    ```

The server will then be running at `http://localhost:3000`.
## Chat History Feature

The Ecosync Nexus server now includes comprehensive chat history management that persists all conversations with the AI assistant. This feature provides:

### Key Benefits

*   **Persistent Storage**: All chat conversations are automatically saved to `data/chat_history.json`
*   **Tool Call Logging**: Every AI tool call is logged with execution time, arguments, and responses
*   **Session Tracking**: Each conversation includes timestamps and session IDs for better organization
*   **Analytics**: Built-in statistics for chat patterns and tool usage analysis
*   **Search & Export**: Full-text search capabilities and data export functionality

### Data Structure

Each chat entry contains:
```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "user_message": "Turn on the bedroom fan",
  "ai_response": "I've turned on the bedroom fan for you.",
  "tool_calls": [
    {
      "tool_name": "find_and_control_appliances",
      "arguments": { "query": "bedroom fan", "action": "turnOn" },
      "response": { "success": true },
      "execution_time_ms": 150,
      "timestamp": "2025-01-01T12:00:00.100Z"
    }
  ],
  "session_id": "1735689600000"
}
```

### Testing the Feature

Visit `http://localhost:3000/chat-history-test.html` to access the chat history management interface where you can:
- View all chat history
- Load recent conversations
- View usage statistics
- Search through conversations
- Export data
- Clear history

### Code Improvements

The chat history implementation provides several advantages:

1. **Scalability**: Persistent storage prevents memory issues with long-running sessions
2. **Debugging**: Detailed tool call logging helps identify performance bottlenecks
3. **Analytics**: Usage patterns help optimize AI behavior and tool performance
4. **User Experience**: Conversation context is maintained across server restarts
5. **Data Management**: Easy backup, export, and analysis of user interactions## A
utonomous AI System

The Ecosync Nexus server includes a sophisticated autonomous AI system that operates independently to optimize home efficiency, create intelligent routines, and manage appliances based on learned patterns and user behavior.

### Key Features

#### 🤖 **Autonomous Operation**
- Runs automatically every hour without user intervention
- Analyzes comprehensive home data including chat history, usage logs, and user preferences
- Makes intelligent decisions based on pattern recognition and data analysis
- Creates and manages routines autonomously to optimize energy usage and user comfort

#### 🧠 **Advanced Analytics**
- **Pattern Recognition**: Learns from user chat history to understand preferences and habits
- **Energy Optimization**: Identifies opportunities to reduce energy consumption and costs
- **Behavioral Analysis**: Studies appliance usage patterns to predict optimal scheduling
- **Predictive Maintenance**: Monitors appliance health and suggests maintenance routines

#### 🔧 **Autonomous Capabilities**
- **Routine Creation**: Automatically creates energy-saving and comfort routines
- **Appliance Control**: Intelligently controls appliances based on learned patterns
- **Schedule Optimization**: Adjusts existing routines for maximum efficiency
- **Safety Monitoring**: Ensures all autonomous actions prioritize user safety

### Autonomous AI Tools

The autonomous AI system has access to specialized tools designed for independent operation:

*   **`analyze_home_data`**: Comprehensive analysis of all home systems and user data
*   **`create_autonomous_routine`**: Creates new routines based on pattern analysis
*   **`autonomous_appliance_control`**: Controls appliances with intelligent reasoning
*   **`analyze_energy_optimization`**: Identifies energy-saving opportunities
*   **`manage_existing_routines`**: Modifies or removes existing routines
*   **`analyze_user_patterns`**: Studies user behavior from chat history

### System Architecture

#### **Separation of Concerns**
- **Main AI (`ai/gemini.js`)**: Handles user interactions and chat responses
- **Autonomous AI (`autonomous_ai/autonomous_gemini.js`)**: Operates independently for system optimization
- **Dedicated Tools**: Specialized toolset for autonomous operations
- **Independent Logging**: Separate execution logs for transparency and debugging

#### **Data Sources**
The autonomous AI analyzes multiple data sources:
- Chat history to understand user preferences
- Usage logs to identify consumption patterns
- Existing routines to avoid conflicts
- User dashboard data for budget and preference constraints
- Real-time appliance states and capabilities

### Configuration

#### **API Keys**
The autonomous AI can use a separate API key for independent operation:
```env
AUTONOMOUS_GEMINI_API_KEY=your_separate_api_key
```
If not provided, it falls back to the main `GEMINI_API_KEY`.

#### **Scheduling**
- **Frequency**: Runs every hour (3600000ms)
- **Startup Delay**: 2-minute delay after server start for system initialization
- **Manual Trigger**: Can be triggered manually via API endpoint

### Monitoring & Control

#### **Web Dashboard**
Access the autonomous AI dashboard at: `http://localhost:3000/autonomous-ai-dashboard.html`

Features:
- Real-time system status monitoring
- Execution statistics and success rates
- Recent activity log with detailed tool call information
- Manual analysis trigger
- Performance analytics

#### **API Monitoring**
- **Status Endpoint**: Get current system status and recent activity
- **Statistics**: Detailed analytics on tool usage and execution patterns
- **Execution Log**: Complete history of autonomous actions with reasoning
- **Manual Control**: Trigger analysis on-demand for testing

### Safety & Transparency

#### **Safety Measures**
- All actions are logged with detailed reasoning
- User preferences from chat history are always respected
- Safety checks prevent dangerous appliance operations
- Autonomous actions can be monitored and reversed if needed

#### **Transparency Features**
- Complete execution logs with timestamps
- Detailed reasoning for every autonomous action
- Tool call tracking with execution times
- Success/failure monitoring with error details

### Data Structure

#### **Autonomous Log Entry**
```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "action": "Autonomous Analysis Complete",
  "reasoning": "Created energy-saving routine based on usage patterns...",
  "tool_calls": [
    {
      "tool_name": "analyze_home_data",
      "arguments": {},
      "response": { "success": true, "data": {...} },
      "execution_time_ms": 250,
      "timestamp": "2025-01-01T12:00:00.100Z"
    }
  ],
  "result": "Analysis completed successfully",
  "execution_id": "auto_1735689600000"
}
```

### Benefits

1. **Energy Efficiency**: Automatically creates routines to reduce energy consumption
2. **User Comfort**: Learns preferences and optimizes for comfort without manual input
3. **Predictive Maintenance**: Prevents appliance issues through pattern analysis
4. **Cost Savings**: Identifies opportunities to reduce electricity bills
5. **Seamless Automation**: Creates a truly smart home that adapts to user behavior
6. **Scalability**: Handles complex optimization scenarios without user intervention

The autonomous AI system represents the next evolution in smart home automation, providing intelligent, proactive management that learns and adapts to create the optimal home environment.