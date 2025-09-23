import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Volume2, Zap, MessageCircle, Lightbulb, Fan, Wind, TestTube } from 'lucide-react';
import { Card } from '../components/UI/Card';
import { quickVoiceTest, testGeminiConnection, logTestResults } from '../utils/testVoiceAssistant';
import { runCompleteBackendTest } from '../utils/testBackendIntegration';
import { runVoiceButtonIntegrationTests } from '../utils/testVoiceApplianceIntegration';

// Mock appliances for demo
const mockAppliances = [
  {
    uid: 'fan-1',
    name: 'Ceiling Fan',
    type: 'fan',
    state: 'off' as const,
    location: 'Living Room'
  },
  {
    uid: 'light-1',
    name: 'Living Room Light',
    type: 'light',
    state: 'off' as const,
    location: 'Living Room'
  },
  {
    uid: 'ac-1',
    name: 'Air Conditioner',
    type: 'ac',
    state: 'off' as const,
    location: 'Bedroom'
  },
  {
    uid: 'light-2',
    name: 'Bedroom Light',
    type: 'light',
    state: 'on' as const,
    location: 'Bedroom'
  }
];

const VoiceDemo: React.FC = () => {
  const [appliances, setAppliances] = useState(mockAppliances);
  const [commandHistory, setCommandHistory] = useState<Array<{
    command: string;
    response: string;
    timestamp: Date;
  }>>([]);
  const [isTestingAPI, setIsTestingAPI] = useState(false);

  // Mock toggle function
  const handleToggleAppliance = async (applianceId: string) => {
    setAppliances(prev => prev.map(app =>
      app.uid === applianceId
        ? { ...app, state: app.state === 'on' ? 'off' : 'on' }
        : app
    ));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const getApplianceIcon = (type: string) => {
    switch (type) {
      case 'fan': return Fan;
      case 'light': return Lightbulb;
      case 'ac': return Wind;
      default: return Zap;
    }
  };

  const exampleCommands = [
    // English
    "Turn on the ceiling fan",
    "Switch off the bedroom light",
    "What's my energy usage?",

    // Hindi
    "पंखा चालू करो",
    "बत्ती बंद करो",
    "मेरा बिजली का बिल कितना है?",

    // Spanish
    "Enciende el ventilador",
    "Apaga las luces",

    // French
    "Allume le ventilateur",
    "Éteins les lumières",

    // German
    "Schalte den Ventilator ein",
    "Schalte das Licht aus"
  ];

  // Test API connection
  const handleTestAPI = async () => {
    setIsTestingAPI(true);
    try {
      console.log('🧪 Testing Gemini API with your key...');
      await quickVoiceTest();
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsTestingAPI(false);
    }
  };

  // Test backend integration
  const handleTestBackend = async () => {
    setIsTestingAPI(true);
    try {
      console.log('🏠 Testing Voice Assistant → Backend Integration...');
      await runCompleteBackendTest();
    } catch (error) {
      console.error('Backend test failed:', error);
    } finally {
      setIsTestingAPI(false);
    }
  };

  // Test voice-button integration
  const handleTestVoiceButtons = async () => {
    setIsTestingAPI(true);
    try {
      console.log('🔄 Testing Voice ↔ Button Integration...');
      await runVoiceButtonIntegrationTests();
    } catch (error) {
      console.error('Voice-button integration test failed:', error);
    } finally {
      setIsTestingAPI(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1d2e] to-[#0f172a]">
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <MessageCircle size={32} className="text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-heading text-white gradient-text">
                Voice Assistant Demo
              </h1>
              <p className="text-slate-300 text-lg">
                Control your smart home with natural voice commands
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Voice Assistant Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="p-6 h-full">
              <div className="flex flex-col items-center space-y-6">
                <div className="flex items-center space-x-3">
                  <Volume2 className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-dark-text">AI Voice Control</h2>
                </div>

                <div className="text-center">
                  <p className="text-dark-textSecondary mb-4">
                    Voice control is temporarily disabled
                  </p>

                  {/* Test Buttons */}
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={handleTestAPI}
                      disabled={isTestingAPI}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <TestTube className="h-4 w-4" />
                      <span>{isTestingAPI ? 'Testing...' : 'Test API Connection'}</span>
                    </button>

                    <button
                      onClick={handleTestBackend}
                      disabled={isTestingAPI}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Zap className="h-4 w-4" />
                      <span>{isTestingAPI ? 'Testing...' : 'Test Backend Integration'}</span>
                    </button>

                    <button
                      onClick={handleTestVoiceButtons}
                      disabled={isTestingAPI}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{isTestingAPI ? 'Testing...' : 'Test Voice ↔ Button Integration'}</span>
                    </button>

                    <p className="text-xs text-dark-textSecondary mt-2 text-center">
                      Check browser console for detailed test results
                    </p>
                  </div>
                </div>

                {/* Example Commands */}
                <div className="w-full">
                  <h3 className="text-lg font-medium text-dark-text mb-3">Try These Commands:</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {exampleCommands.map((command, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="bg-dark-surface/30 rounded-lg p-3 text-center"
                      >
                        <span className="text-dark-textSecondary text-sm">"{command}"</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Appliances Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="p-6 h-full">
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold text-dark-text">Device Status</h2>
              </div>

              <div className="space-y-4">
                {appliances.map((appliance, index) => {
                  const IconComponent = getApplianceIcon(appliance.type);
                  return (
                    <motion.div
                      key={appliance.uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${appliance.state === 'on'
                        ? 'bg-green-900/20 border-green-500/30 text-green-400'
                        : 'bg-gray-900/20 border-gray-500/30 text-gray-400'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{appliance.name}</p>
                          <p className="text-xs opacity-70">{appliance.location}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${appliance.state === 'on'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                        }`}>
                        {appliance.state.toUpperCase()}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-dark-surface/50">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {appliances.filter(a => a.state === 'on').length}
                    </p>
                    <p className="text-xs text-dark-textSecondary">Devices On</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-400">
                      {appliances.filter(a => a.state === 'off').length}
                    </p>
                    <p className="text-xs text-dark-textSecondary">Devices Off</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-dark-text mb-4">Voice Assistant Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-dark-text mb-2">Multilingual Support</h3>
                <p className="text-sm text-dark-textSecondary">
                  Speak in any language - English, Hindi, Spanish, French, German, and more! The AI responds in your language.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-dark-text mb-2">Smart Control</h3>
                <p className="text-sm text-dark-textSecondary">
                  Automatically finds and controls the right device based on your command.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Volume2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-dark-text mb-2">Voice Feedback</h3>
                <p className="text-sm text-dark-textSecondary">
                  Get spoken confirmation when devices are controlled successfully.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default VoiceDemo;