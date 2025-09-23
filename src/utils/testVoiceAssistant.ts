// Test utility for Voice Assistant with Gemini API
import { AI_CONFIG, getGeminiEndpoint, createGenerationConfig } from '../config/ai.config';

export interface VoiceTestResult {
  success: boolean;
  response?: string;
  error?: string;
  latency?: number;
}

// Test the Gemini API connection with your API key
export const testGeminiConnection = async (): Promise<VoiceTestResult> => {
  const startTime = Date.now();
  
  try {
    const testPrompt = `
You are EcoSync Didi, a caring family member. Respond in Hindi with a warm greeting.
Just say "नमस्ते! मैं EcoSync दीदी हूँ। आपकी मदद के लिए तैयार हूँ।"
`;

    const response = await fetch(getGeminiEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }],
        generationConfig: createGenerationConfig(50, 0.7)
      })
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API Error ${response.status}: ${errorText}`,
        latency
      };
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!aiResponse) {
      return {
        success: false,
        error: 'No response from AI',
        latency
      };
    }

    return {
      success: true,
      response: aiResponse,
      latency
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - startTime
    };
  }
};

// Test voice command processing
export const testVoiceCommand = async (command: string): Promise<VoiceTestResult> => {
  const startTime = Date.now();
  
  try {
    const systemPrompt = `${AI_CONFIG.PROMPTS.VOICE_ASSISTANT}

User said: "${command}"

Respond as caring family member in SAME LANGUAGE (short for voice):`;

    const response = await fetch(getGeminiEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: createGenerationConfig()
      })
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: `API Error ${response.status}`,
        latency
      };
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return {
      success: true,
      response: aiResponse,
      latency
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - startTime
    };
  }
};

// Test multiple voice commands
export const testMultipleCommands = async (commands: string[]): Promise<VoiceTestResult[]> => {
  const results: VoiceTestResult[] = [];
  
  for (const command of commands) {
    const result = await testVoiceCommand(command);
    results.push(result);
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
};

// Log test results to console
export const logTestResults = (results: VoiceTestResult | VoiceTestResult[]) => {
  const resultsArray = Array.isArray(results) ? results : [results];
  
  console.log('🎤 Voice Assistant Test Results:');
  console.log('================================');
  
  resultsArray.forEach((result, index) => {
    if (resultsArray.length > 1) {
      console.log(`\nTest ${index + 1}:`);
    }
    
    if (result.success) {
      console.log('✅ Status: SUCCESS');
      console.log(`📝 Response: "${result.response}"`);
      console.log(`⚡ Latency: ${result.latency}ms`);
    } else {
      console.log('❌ Status: FAILED');
      console.log(`💥 Error: ${result.error}`);
      console.log(`⚡ Latency: ${result.latency}ms`);
    }
  });
  
  const successCount = resultsArray.filter(r => r.success).length;
  const avgLatency = resultsArray.reduce((sum, r) => sum + (r.latency || 0), 0) / resultsArray.length;
  
  console.log('\n📊 Summary:');
  console.log(`Success Rate: ${successCount}/${resultsArray.length} (${Math.round(successCount/resultsArray.length*100)}%)`);
  console.log(`Average Latency: ${Math.round(avgLatency)}ms`);
  console.log('================================');
};

// Quick test function for development
export const quickVoiceTest = async () => {
  console.log('🚀 Starting Voice Assistant Quick Test...');
  
  // Test API connection
  const connectionTest = await testGeminiConnection();
  logTestResults(connectionTest);
  
  if (connectionTest.success) {
    // Test various multilingual commands
    const testCommands = [
      'Turn on the fan',
      'पंखा चालू करो',
      'Enciende el ventilador',
      'Allume le ventilateur',
      'Schalte den Ventilator ein',
      'What is my energy usage?',
      'मेरा बिजली का बिल कितना है?'
    ];
    
    console.log('\n🎯 Testing Multilingual Voice Commands...');
    const commandTests = await testMultipleCommands(testCommands);
    logTestResults(commandTests);
  }
};