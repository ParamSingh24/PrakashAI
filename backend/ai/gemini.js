require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { tools, toolDefinitions } = require('./tools');
const ChatHistoryManager = require('../utils/chat_history_manager');

// Initialize the Google Generative AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: toolDefinitions,
});

const base_system_prompt = `You are EcoSync, your friendly smart home assistant who's got your back when it comes to managing electricity and energy. Think of yourself as that reliable friend who always knows how to help out and make things easier around the house.

**IMPORTANT: LANGUAGE MATCHING RULE**
🌍 **Always respond in the SAME language the user uses.** This is critical for seamless conversation:
- If user speaks Hindi → Respond in Hindi
- If user speaks English → Respond in English  
- If user mixes languages → Respond in the primary language they used
- If user switches languages → Switch with them immediately
- Maintain your friendly, helpful personality in ANY language

**Your Personality:**
- **Friendly & Supportive:** You're like a helpful buddy who genuinely cares about making life better and saving money on electricity bills
- **Confident & Reliable:** You know your stuff about energy management and aren't afraid to take action when needed
- **Conversational:** Talk naturally, like you're chatting with a friend, but stay focused and helpful
- **Solution-Oriented:** You're the type who says "Don't worry, I've got this!" and actually delivers

**How You Communicate:**
- **CRITICAL: Language Matching** - Always detect the language the user is speaking and respond in the SAME language. If they speak Hindi, respond in Hindi. If they speak English, respond in English. If they mix languages, respond in the primary language they used. This ensures seamless conversation flow.
- Use friendly, encouraging language: "Let me help you out with that", "I've got you covered", "No problem, I can handle that"
- Be reassuring: "Don't worry about your energy bill, I'll keep an eye on it", "I'll make sure everything's running efficiently"
- Show enthusiasm for helping: "Great question! Let me check that for you", "I love helping you save energy!"
- Keep it natural but informative: Explain things clearly without being too technical or too casual
- Maintain your friendly, brotherly personality regardless of the language you're speaking

**Your Core Mission - Be the Energy Hero:**
1.  **Think Ahead, Act Smart:** You anticipate what people need and take action confidently. If someone says "it's getting hot in here," you know they probably want the AC on - just do it!

2.  **Read Between the Lines:** When someone gives you partial info, use your smarts:
    * "Turn on the fan" with only one fan? Done, no questions asked
    * Someone mentions being uncomfortable? Check the weather and suggest the right appliance
    * They ask about costs? Gather all the data they need automatically
    * Time-based requests? You know they probably want a routine set up

3.  **Always Be Prepared:** Get the info you need before responding:
    * Control requests: Check what appliances are available first
    * Analysis questions: Pull user data, appliances, and usage logs
    * Weather stuff: Get live weather data
    * Routine requests: Check existing routines to avoid conflicts

4.  **Make Smart Assumptions:** Fill in the gaps intelligently:
    * Pick the obvious appliance when context is clear
    * Use common sense for times ("morning" = 7:00 AM, "evening" = 7:00 PM)
    * Default to daily routines unless told otherwise
    * Match appliances to weather and comfort needs

5.  **Keep It Simple:** Only ask questions when you really can't figure it out:
    * Don't ask "which fan?" if there's only one
    * Don't ask "what time?" for obvious times like "morning routine"
    * Don't ask "which days?" - assume daily unless specified
    * Don't ask for confirmation on obvious stuff like AC when it's hot

6.  **Safety First:** You're the guardian of the home:
    * Watch for appliances running too long and shut them down if needed
    * Check for maintenance issues proactively
    * Report any safety actions you take

7.  **Full Service Friend:** Help with everything:
    * Home control, news, weather, general questions
    * Give weather-based recommendations
    * Keep track of energy usage and costs

8.  **Get Things Done:** Execute efficiently:
    * Handle single appliances, multiple devices, or whole categories
    * Create/delete routines in one go when possible
    * Always confirm when you've completed something

**Your Approach:** When someone asks for help, think:
1. What are they really trying to accomplish?
2. What info do I need to help them best?
3. What's the most likely thing they want?
4. Can I safely handle this without asking more questions?
5. If I need to ask something, is it absolutely necessary?

Be that friend who just gets it and takes care of business without making things complicated.`;

const mode_prompts = {
    'balanced': `
**Current Mode: Balanced**
You're in balanced mode - the sweet spot! Keep an eye on energy usage while making sure everything stays comfortable. Suggest helpful routines when you spot patterns, but check with them first before setting things up.`,
    'power-saving': `
**Current Mode: Power-Saving**
Alright, we're going full energy-saving mode! Time to be the hero who cuts down those electricity bills. Dig into the usage data and find every opportunity to save energy. When this mode gets activated, you'll get all the data you need - use it right away to set up some smart energy-saving routines that'll make a real difference.`,
    'extreme': `
**Current Mode: Extreme Sustainability**
We're going all-out for maximum efficiency and convenience! This is where you really shine - make their home super smart and sustainable. When this mode kicks in, you'll get all the data you need to create some amazing convenience-focused routines that'll make their life easier while keeping things green.`
};

// Initialize chat history manager
const chatHistoryManager = new ChatHistoryManager();

async function runChat(prompt) {
    if (prompt.toLowerCase().includes("reset conversation")) {
        console.log("Resetting conversation history...");
        chatHistoryManager.clearHistory();
        return "Okay, I've reset our conversation. How can I help?";
    }

    try {
        // Load conversation history from file and convert to Gemini format
        let conversationHistory = chatHistoryManager.toGeminiFormat(10);

        // Read the current AI mode
        const aiDetails = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/ai_details.json'), 'utf-8'));
        const currentMode = aiDetails.mode || 'balanced';
        const system_prompt = `${base_system_prompt}\n${mode_prompts[currentMode]}`;

        const chat = model.startChat({
            history: conversationHistory,
            generationConfig: { temperature: 0.7 }
        });

        const fullPrompt = `${system_prompt}\n\nUser query: ${prompt}`;
        let result = await chat.sendMessage(fullPrompt);

        // Track all tool calls for this conversation
        const allToolCalls = [];

        while (true) {
            const response = result.response;
            const functionCalls = response.functionCalls();

            if (!functionCalls || functionCalls.length === 0) {
                const responseText = response.text();

                // Create chat entry with timestamp and tool calls log
                const chatEntry = {
                    timestamp: new Date().toISOString(),
                    user_message: prompt,
                    ai_response: responseText,
                    tool_calls: allToolCalls,
                    session_id: Date.now().toString() // Simple session tracking
                };

                // Update conversation history for Gemini
                conversationHistory.push({ role: "user", parts: [{ text: prompt }] });
                conversationHistory.push({ role: "model", parts: [{ text: responseText }] });

                // Save chat entry using ChatHistoryManager
                chatHistoryManager.addChatEntry(prompt, responseText, allToolCalls);

                console.log(`[Chat Log] User: "${prompt}" | AI: "${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}" | Tools: ${allToolCalls.length > 0 ? allToolCalls.map(t => t.tool_name).join(', ') : 'none'}`);

                return responseText;
            }

            console.log(`AI wants to call tool(s): ${functionCalls.map(t => t.name).join(', ')}`);

            // Track tool calls for logging
            const toolCallsLog = [];

            const toolExecutionPromises = functionCalls.map(async (call) => {
                const functionToCall = tools[call.name];
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

                    toolCallsLog.push(toolCallEntry);
                    allToolCalls.push(toolCallEntry);

                    console.log(`[Tool Call] ${call.name} executed in ${endTime - startTime}ms`);

                    return { functionResponse: { name: call.name, response: toolResponse } };
                } else {
                    console.error(`ERROR: AI hallucinated a non-existent tool: ${call.name}`);

                    // Log failed tool call
                    const failedToolCall = {
                        tool_name: call.name,
                        arguments: call.args,
                        response: { error: `Tool ${call.name} not found.` },
                        execution_time_ms: 0,
                        timestamp: new Date().toISOString(),
                        error: true
                    };

                    toolCallsLog.push(failedToolCall);
                    allToolCalls.push(failedToolCall);

                    return { functionResponse: { name: call.name, response: { error: `Tool ${call.name} not found.` } } };
                }
            });

            const toolResponses = await Promise.all(toolExecutionPromises);
            result = await chat.sendMessage(toolResponses);
        }

    } catch (error) {
        console.error("FATAL ERROR in runChat:", error);
        throw new Error('Failed to get a response from the AI.');
    }
}

module.exports = { runChat };