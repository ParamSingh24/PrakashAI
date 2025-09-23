import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Zap, Settings } from 'lucide-react';
import { useGeminiVoiceAssistant } from '../../hooks/useGeminiVoiceAssistant';
import { useNotification } from '../../contexts/NotificationContext';
import { Card } from '../UI/Card';
import { createVoiceProcessor } from '../../utils/smartVoiceCommands';
import { AI_CONFIG } from '../../config/ai.config';
import { useAppliances } from '../../hooks/useAppliances';

interface SmartVoiceAssistantProps {
  className?: string;
}

const SmartVoiceAssistant: React.FC<SmartVoiceAssistantProps> = ({
  className = ''
}) => {
  const { showNotification } = useNotification();
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || AI_CONFIG.GEMINI_API_KEY);
  
  // Use the same appliances hook as the main Appliances page
  const { appliances, loading: isLoadingAppliances, error: backendError, toggleAppliance } = useAppliances();
  
  // Show connection status notification
  useEffect(() => {
    if (!isLoadingAppliances && appliances.length > 0) {
      showNotification({
        type: 'success',
        message: `Voice Assistant connected! Found ${appliances.length} smart devices.`,
        duration: 3000
      });
    } else if (!isLoadingAppliances && backendError) {
      showNotification({
        type: 'error',
        message: 'Could not connect to smart home backend.',
        duration: 5000
      });
    }
  }, [isLoadingAppliances, appliances.length, backendError, showNotification]);

  // Create voice processor instance
  const voiceProcessor = useMemo(() => createVoiceProcessor(appliances), [appliances]);

  // Handle appliance control from voice commands
  const handleApplianceControl = async (voiceInput: string) => {
    try {
      // Process the voice command using smart processor
      const command = voiceProcessor.processVoiceCommand(voiceInput);
      
      if (command.intent !== 'appliance_control' || !command.appliance || !command.action) {
        return {
          success: false,
          error: `I apologize, but I didn't understand that command. Please try saying "turn on the fan" or "switch off the lights".`
        };
      }

      // Find matching appliances
      const matches = voiceProcessor.findMatchingAppliances(command);
      
      if (matches.length === 0) {
        return {
          success: false,
          error: `I apologize, but I couldn't find a ${command.appliance}. Your available devices are: ${appliances.map(a => a.name).join(', ')}`
        };
      }

      // Use the best match
      const bestMatch = matches[0];
      const appliance = appliances.find(app => app.uid === bestMatch.uid);
      
      if (!appliance) {
        return {
          success: false,
          error: 'I apologize, but the device was not found in the system.'
        };
      }

      // Check if action is needed
      const currentState = appliance.state;
      const desiredState = command.action === 'turn_on' ? 'on' : 'off';
      
      if (command.action !== 'toggle' && currentState === desiredState) {
        return {
          success: true,
          appliance: {
            name: appliance.name,
            state: currentState,
            location: appliance.location
          },
          message: `Certainly! ${appliance.name} is already ${currentState}, sir/madam.`
        };
      }

      // Execute the control using the same function as appliance buttons
      console.log(`🎛️ Voice controlling ${appliance.name}: ${currentState} → toggle`);
      
      const controlResult = await toggleAppliance(appliance.uid);
      
      if (!controlResult.success) {
        return {
          success: false,
          error: controlResult.error || 'I apologize, but I failed to control the device. Please try again.'
        };
      }
      
      const newState = currentState === 'on' ? 'off' : 'on';
      
      return {
        success: true,
        appliance: {
          name: appliance.name,
          state: newState,
          location: appliance.location
        }
      };
    } catch (error) {
      console.error('Error controlling appliance:', error);
      return {
        success: false,
        error: 'Failed to control the device. Please try again.'
      };
    }
  };

  const voiceAssistant = useGeminiVoiceAssistant({
    apiKey: apiKey,
    language: 'auto', // Auto-detect user's language
    autoStart: false,
    onApplianceControl: handleApplianceControl
  });

  // Save API key to localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    }
  }, [apiKey]);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setShowSettings(false);
      showNotification({
        type: 'success',
        title: 'API Key Saved',
        message: 'Voice assistant is now ready to use!',
        duration: 3000
      });
    }
  };

  if (!apiKey) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-semibold text-dark-text">AI Voice Assistant</h3>
          </div>
          <p className="text-dark-textSecondary">
            Configure your Gemini API key to enable voice control
          </p>
          <button
            onClick={() => setShowSettings(true)}
            className="px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Setup API Key
          </button>
        </div>
        
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4">
              <form onSubmit={handleApiKeySubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-dark-text">Setup Gemini API Key</h3>
                <p className="text-sm text-dark-textSecondary">
                  Get your free API key from{' '}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-surface rounded-lg text-dark-text focus:outline-none focus:border-primary"
                  required
                />
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-2 bg-dark-surface hover:bg-dark-surface/80 text-dark-text rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Backend Connection Status */}
      {appliances.length > 0 && !backendError && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center space-x-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      )}
      
      {backendError && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center space-x-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Offline</span>
          </div>
        </div>
      )}
      
      {/* Main Voice Control Button */}
      <motion.button
        onMouseDown={voiceAssistant.handleMouseDown}
        onMouseUp={voiceAssistant.handleMouseUp}
        onTouchStart={voiceAssistant.handleTouchStart}
        onTouchEnd={voiceAssistant.handleTouchEnd}
        disabled={voiceAssistant.isSpeaking}
        className={`relative p-4 rounded-full shadow-lg transition-all duration-300 ${
          voiceAssistant.isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25'
            : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-primary/25'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={voiceAssistant.isListening ? { 
          boxShadow: [
            '0 0 0 0 rgba(239, 68, 68, 0.4)',
            '0 0 0 20px rgba(239, 68, 68, 0)',
          ]
        } : {}}
        transition={voiceAssistant.isListening ? { 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeOut"
        } : { duration: 0.2 }}
      >
        {voiceAssistant.isSpeaking ? (
          <Volume2 className="h-6 w-6" />
        ) : voiceAssistant.isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
        
        {/* Pulse animation when listening */}
        {voiceAssistant.isListening && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.button>

      {/* Status Indicator */}
      <AnimatePresence>
        {(voiceAssistant.isListening || voiceAssistant.isSpeaking || voiceAssistant.transcript || voiceAssistant.response) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-dark-card/95 backdrop-blur-sm border border-dark-surface/50 rounded-lg px-4 py-3 min-w-[250px] max-w-[350px] text-center shadow-xl"
          >
            {voiceAssistant.isSpeaking ? (
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
                <span className="text-dark-text text-sm">Speaking...</span>
                <button
                  onClick={voiceAssistant.stopSpeaking}
                  className="ml-2 p-1 hover:bg-dark-surface rounded"
                >
                  <VolumeX className="h-3 w-3 text-dark-textSecondary" />
                </button>
              </div>
            ) : voiceAssistant.isListening ? (
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
                <span className="text-dark-text text-sm">Listening... (Hold to talk)</span>
              </div>
            ) : voiceAssistant.transcript ? (
              <div>
                <p className="text-dark-textSecondary text-xs mb-1">You said:</p>
                <p className="text-dark-text text-sm font-medium">"{voiceAssistant.transcript}"</p>
              </div>
            ) : voiceAssistant.response ? (
              <div>
                <p className="text-dark-textSecondary text-xs mb-1">EcoSync Didi:</p>
                <p className="text-dark-text text-sm">{voiceAssistant.response}</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {voiceAssistant.error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3 min-w-[250px] text-center"
        >
          <p className="text-red-400 text-sm">{voiceAssistant.error}</p>
        </motion.div>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full shadow-lg"
      >
        Hold & Talk
      </motion.div>

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute -bottom-2 -right-2 p-2 bg-dark-surface hover:bg-dark-surface/80 text-dark-textSecondary hover:text-dark-text rounded-full shadow-lg transition-colors"
      >
        <Settings className="h-3 w-3" />
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <h3 className="text-lg font-semibold text-dark-text">Voice Assistant Settings</h3>
              <div>
                <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-surface rounded-lg text-dark-text focus:outline-none focus:border-primary"
                />
              </div>
              {/* Backend Connection Status */}
              <div className="bg-dark-surface/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-dark-textSecondary mb-2">🏠 Smart Home Connection:</h4>
                {isLoadingAppliances ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-dark-textSecondary">Connecting to backend...</span>
                  </div>
                ) : appliances.length > 0 && !backendError ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-400">Connected to Smart Home Backend</span>
                    </div>
                    <p className="text-xs text-dark-textSecondary">
                      Found {appliances.length} devices: {appliances.map(a => a.name).slice(0, 3).join(', ')}
                      {appliances.length > 3 && ` and ${appliances.length - 3} more`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-400">Backend Offline</span>
                    </div>
                    <p className="text-xs text-dark-textSecondary">
                      {backendError || 'Could not connect to smart home backend'}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-dark-surface/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-dark-textSecondary mb-2">🌐 Respectful Multilingual Support:</h4>
                <ul className="text-sm text-dark-textSecondary space-y-1">
                  <li>• English: "Please turn on the fan"</li>
                  <li>• Hindi: "आप पंखा चालू कर दीजिए" (respectful "aap")</li>
                  <li>• Spanish: "Por favor, enciende el ventilador"</li>
                  <li>• French: "Pouvez-vous allumer le ventilateur?"</li>
                  <li>• German: "Könnten Sie bitte den Ventilator einschalten?"</li>
                  <li>• And many more languages with respectful tone!</li>
                </ul>
                <p className="text-xs text-dark-textSecondary mt-2">
                  The AI responds respectfully in your language using proper honorifics!
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-dark-surface hover:bg-dark-surface/80 text-dark-text rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SmartVoiceAssistant;