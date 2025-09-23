import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import VoiceCommandsHelp from './VoiceCommandsHelp';

interface VoiceControlProps {
  appliances: Array<{
    uid: string;
    name: string;
    state: string;
    location?: string;
  }>;
  onToggleAppliance: (applianceId: string) => Promise<void>;
  className?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const VoiceControl: React.FC<VoiceControlProps> = ({ 
  appliances, 
  onToggleAppliance, 
  className = '' 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { showNotification } = useNotification();

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setTranscript(transcript);
        processVoiceCommand(transcript);
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          showNotification({
            type: 'error',
            title: 'Microphone Access Denied',
            message: 'Please allow microphone access to use voice commands',
            duration: 5000
          });
        } else if (event.error === 'no-speech') {
          showNotification({
            type: 'warning',
            title: 'No Speech Detected',
            message: 'Please try speaking again',
            duration: 3000
          });
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Process voice command
  const processVoiceCommand = async (transcript: string) => {
    setIsProcessing(true);
    
    try {
      // Parse the command
      const command = parseVoiceCommand(transcript);
      
      if (command) {
        await executeCommand(command);
      } else {
        showNotification({
          type: 'warning',
          title: 'Command Not Recognized',
          message: `I didn't understand: "${transcript}". Try saying "turn on [device name]" or "turn off [device name]"`,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      showNotification({
        type: 'error',
        title: 'Command Failed',
        message: 'Failed to execute voice command',
        duration: 3000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse voice command to extract action and device
  const parseVoiceCommand = (transcript: string): { action: 'on' | 'off'; deviceName: string } | null => {
    const cleanTranscript = transcript.toLowerCase().trim();
    
    // Common command patterns
    const patterns = [
      /turn (on|off) (?:the )?(.+)/,
      /switch (on|off) (?:the )?(.+)/,
      /(start|stop) (?:the )?(.+)/,
      /(activate|deactivate) (?:the )?(.+)/,
      /power (on|off) (?:the )?(.+)/
    ];
    
    for (const pattern of patterns) {
      const match = cleanTranscript.match(pattern);
      if (match) {
        let action: 'on' | 'off';
        let deviceName: string;
        
        if (pattern.source.includes('start|stop')) {
          action = match[1] === 'start' ? 'on' : 'off';
          deviceName = match[2];
        } else if (pattern.source.includes('activate|deactivate')) {
          action = match[1] === 'activate' ? 'on' : 'off';
          deviceName = match[2];
        } else {
          action = match[1] as 'on' | 'off';
          deviceName = match[2];
        }
        
        return { action, deviceName: deviceName.trim() };
      }
    }
    
    return null;
  };

  // Find matching appliance by name
  const findAppliance = (deviceName: string) => {
    const normalizedName = deviceName.toLowerCase();
    
    // First try exact match
    let appliance = appliances.find(app => 
      app.name.toLowerCase() === normalizedName
    );
    
    // Then try partial match
    if (!appliance) {
      appliance = appliances.find(app => 
        app.name.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(app.name.toLowerCase())
      );
    }
    
    // Try matching by location + type
    if (!appliance) {
      appliance = appliances.find(app => {
        const appLocation = app.location?.toLowerCase() || '';
        return appLocation.includes(normalizedName) || normalizedName.includes(appLocation);
      });
    }
    
    return appliance;
  };

  // Execute the parsed command
  const executeCommand = async (command: { action: 'on' | 'off'; deviceName: string }) => {
    const appliance = findAppliance(command.deviceName);
    
    if (!appliance) {
      showNotification({
        type: 'warning',
        title: 'Device Not Found',
        message: `Could not find device: "${command.deviceName}"`,
        duration: 4000
      });
      return;
    }
    
    // Check if device is already in the desired state
    const currentState = appliance.state;
    const desiredState = command.action;
    
    if (currentState === desiredState) {
      showNotification({
        type: 'info',
        title: 'Device Already ' + (desiredState === 'on' ? 'On' : 'Off'),
        message: `${appliance.name} is already ${desiredState}`,
        duration: 3000
      });
      return;
    }
    
    // Execute the command
    try {
      await onToggleAppliance(appliance.uid);
      
      // Provide voice feedback
      const message = `${appliance.name} turned ${desiredState}`;
      showNotification({
        type: 'success',
        title: 'Voice Command Executed',
        message,
        duration: 3000
      });
      
      // Optional: Use speech synthesis for audio feedback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.volume = 0.5;
        utterance.rate = 1;
        speechSynthesis.speak(utterance);
      }
      
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Command Failed',
        message: `Failed to turn ${desiredState} ${appliance.name}`,
        duration: 4000
      });
    }
  };

  // Start/stop voice recognition
  const toggleListening = () => {
    if (!isSupported) {
      showNotification({
        type: 'error',
        title: 'Not Supported',
        message: 'Voice recognition is not supported in this browser',
        duration: 4000
      });
      return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <div className={`relative ${className}`}>
      {/* Voice Control Button */}
      <motion.button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`relative p-4 rounded-full shadow-lg transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25'
            : 'bg-primary hover:bg-primary/80 text-white shadow-primary/25'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isListening ? { 
          boxShadow: [
            '0 0 0 0 rgba(239, 68, 68, 0.4)',
            '0 0 0 20px rgba(239, 68, 68, 0)',
          ]
        } : {}}
        transition={isListening ? { 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeOut"
        } : { duration: 0.2 }}
      >
        {isProcessing ? (
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
        ) : isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
        
        {/* Pulse animation when listening */}
        {isListening && (
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
        {(isListening || isProcessing || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-dark-card/95 backdrop-blur-sm border border-dark-surface/50 rounded-lg px-4 py-3 min-w-[200px] text-center shadow-xl"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                <span className="text-dark-text text-sm">Processing...</span>
              </div>
            ) : isListening ? (
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
                <span className="text-dark-text text-sm">Listening...</span>
              </div>
            ) : transcript ? (
              <div>
                <p className="text-dark-textSecondary text-xs mb-1">You said:</p>
                <p className="text-dark-text text-sm font-medium">"{transcript}"</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Component */}
      <VoiceCommandsHelp appliances={appliances} />

      {/* Help Tooltip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full shadow-lg"
      >
        Voice
      </motion.div>
    </div>
  );
};

export default VoiceControl;