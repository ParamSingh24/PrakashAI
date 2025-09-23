import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Zap } from 'lucide-react';
import { Card } from '../UI/Card';
import { useNotification } from '../../contexts/NotificationContext';

interface VoiceFeedback {
  message: string;
  type: 'success' | 'error' | 'processing' | 'info';
}

interface Device {
  uid: string;
  name: string;
  type: string;
  state: 'on' | 'off';
  location?: string;
}

export const VoiceDeviceControl: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [feedback, setFeedback] = useState<VoiceFeedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    initializeSpeechRecognition();
    fetchDevices();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      console.log('🎤 Speech Recognition API supported');
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;
      
      setupEventHandlers();
    } else {
      setIsSupported(false);
      console.warn('🚫 Speech Recognition API not supported in this browser');
      setFeedback({
        message: 'Speech Recognition not supported. Please use Chrome or Edge.',
        type: 'error'
      });
    }
  };

  const setupEventHandlers = () => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      setIsListening(true);
      setFeedback({ 
        message: '🎤 Listening... Say your command!', 
        type: 'processing' 
      });
    };

    recognition.onend = () => {
      console.log('🎤 Voice recognition ended');
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('🎤 Speech recognition error:', event.error);
      setIsListening(false);
      setIsProcessing(false);
      
      let errorMessage = 'Speech recognition error occurred';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      setFeedback({ message: `❌ ${errorMessage}`, type: 'error' });
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (finalTranscript && finalTranscript.trim()) {
        console.log('🗣️ Final voice command:', finalTranscript);
        processVoiceCommand(finalTranscript.trim());
      }
    };
  };

  const fetchDevices = async () => {
    try {
      console.log('📱 Fetching devices for voice control...');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/appliances`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.status}`);
      }
      
      const devicesData = await response.json();
      setDevices(devicesData);
      console.log('📱 Loaded devices for voice control:', devicesData.length, 'devices');
    } catch (error) {
      console.error('❌ Error loading devices:', error);
      setFeedback({
        message: 'Failed to load devices. Voice control may not work properly.',
        type: 'error'
      });
    }
  };

  const processVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      console.log('🤖 Processing voice command:', command);
      setFeedback({ 
        message: `Processing: "${command}"`, 
        type: 'processing' 
      });
      
      // Send to Ecosync Nexus AI Chatbot for natural language processing
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Voice command: ${command}`,
          context: 'voice_control'
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Chatbot error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🤖 AI Response:', result);
      
      const successMessage = result.response || 'Command executed successfully';
      setFeedback({ 
        message: `✅ ${successMessage}`, 
        type: 'success' 
      });

      // Show notification for successful command
      showNotification({
        type: 'success',
        title: 'Voice Command Executed',
        message: successMessage,
        duration: 3000
      });

    } catch (error) {
      console.error('❌ Error processing voice command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setFeedback({ 
        message: `❌ Error: ${errorMessage}`, 
        type: 'error' 
      });

      showNotification({
        type: 'error',
        title: 'Voice Command Failed',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current || isListening) return;

    try {
      // Check microphone permissions
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setTranscript('');
      setFeedback(null);
      recognitionRef.current.start();
    } catch (error) {
      console.error('❌ Microphone access error:', error);
      setFeedback({
        message: 'Microphone access denied. Please allow microphone access and try again.',
        type: 'error'
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'processing': return '⏳';
      case 'info': return 'ℹ️';
      default: return '💬';
    }
  };

  const getFeedbackColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'error': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'processing': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'info': return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <VolumeX className="h-12 w-12 text-red-400" />
          <h3 className="text-lg font-semibold text-dark-text">Voice Control Not Supported</h3>
          <p className="text-dark-textSecondary">
            Your browser doesn't support speech recognition. Please use Chrome or Edge for voice features.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Volume2 className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-dark-text">Voice Device Control</h3>
            <p className="text-sm text-dark-textSecondary">
              Control your smart home devices with voice commands
            </p>
          </div>
        </div>

        {/* Example Commands */}
        <div className="bg-dark-surface/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-dark-textSecondary mb-2">Example Commands:</h4>
          <ul className="text-sm text-dark-textSecondary space-y-1">
            <li>• "Turn on the ceiling fan"</li>
            <li>• "Switch off the bedroom light"</li>
            <li>• "Turn off the air conditioner"</li>
            <li>• "Turn on energy saving mode"</li>
          </ul>
        </div>

        {/* Voice Control Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`relative flex items-center space-x-3 px-8 py-4 rounded-full font-medium transition-all duration-300 ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-primary hover:bg-primary-dark text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? (
              <>
                <MicOff className="h-5 w-5" />
                <span>Stop Listening</span>
                <div className="absolute -right-1 -top-1 w-3 h-3 bg-red-300 rounded-full animate-pulse" />
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                <span>{isProcessing ? 'Processing...' : 'Start Voice Control'}</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-surface/50 rounded-lg p-4"
          >
            <h4 className="text-sm font-medium text-dark-textSecondary mb-2 flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>You said:</span>
            </h4>
            <p className="text-dark-text italic">"{transcript}"</p>
          </motion.div>
        )}

        {/* Feedback Display */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-4 border ${getFeedbackColor(feedback.type)}`}
          >
            <div className="flex items-start space-x-2">
              <span className="text-lg">{getFeedbackIcon(feedback.type)}</span>
              <p className="flex-1">{feedback.message}</p>
            </div>
          </motion.div>
        )}

        {/* Device Status */}
        <div className="text-center text-xs text-dark-textSecondary">
          <div className="flex items-center justify-center space-x-4">
            <span className="flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>{devices.length} devices available</span>
            </span>
            <span>•</span>
            <span>Powered by Chrome Speech API</span>
          </div>
          <p className="mt-1">🔒 Make sure to allow microphone access when prompted</p>
        </div>
      </div>
    </Card>
  );
};

export default VoiceDeviceControl;