import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import type { VoiceFeedback } from '../../types/voice.types';

interface VoiceControlButtonProps {
  onCommandProcessed?: (command: string, success: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export const VoiceControlButton: React.FC<VoiceControlButtonProps> = ({
  onCommandProcessed,
  className = '',
  size = 'md',
  compact = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<VoiceFeedback | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    checkSpeechSupport();
    initializeSpeechRecognition();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const checkSpeechSupport = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  };

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    setupEventHandlers();
  };

  const setupEventHandlers = () => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      if (!compact) {
        setFeedback({ message: '🎤 Listening...', type: 'processing' });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      
      let errorMessage = 'Speech recognition error';
      if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied';
      } else if (event.error === 'no-speech') {
        errorMessage = 'No speech detected';
      }
      
      if (!compact) {
        setFeedback({ message: `❌ ${errorMessage}`, type: 'error' });
      }
      
      showNotification({
        type: 'error',
        title: 'Voice Control Error',
        message: errorMessage,
        duration: 3000
      });
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        setTranscript(finalTranscript);
        processVoiceCommand(finalTranscript.trim());
      }
    };
  };

  const processVoiceCommand = async (command: string) => {
    try {
      console.log('🗣️ Processing voice command:', command);
      
      if (!compact) {
        setFeedback({ message: `Processing: "${command}"`, type: 'processing' });
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Voice command: ${command}`,
          context: 'voice_control'
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      const successMessage = result.response || 'Command executed successfully';
      
      if (!compact) {
        setFeedback({ message: `✅ ${successMessage}`, type: 'success' });
      }

      showNotification({
        type: 'success',
        title: 'Voice Command Executed',
        message: successMessage,
        duration: 3000
      });

      onCommandProcessed?.(command, true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (!compact) {
        setFeedback({ message: `❌ ${errorMessage}`, type: 'error' });
      }

      showNotification({
        type: 'error',
        title: 'Voice Command Failed',
        message: errorMessage,
        duration: 5000
      });

      onCommandProcessed?.(command, false);
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current || isListening) return;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Microphone Access',
        message: 'Please allow microphone access to use voice control',
        duration: 5000
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'p-2 text-sm';
      case 'lg': return 'p-4 text-lg';
      default: return 'p-3 text-base';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-6 w-6';
      default: return 'h-5 w-5';
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center space-x-2 text-gray-400 ${className}`}>
        <Volume2 className={getIconSize()} />
        <span className="text-sm">Voice control not supported</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center space-y-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isListening ? stopListening : startListening}
          className={`relative flex items-center space-x-2 ${getSizeClasses()} rounded-lg font-medium transition-all duration-300 ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-primary hover:bg-primary-dark text-white'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className={getIconSize()} />
              {!compact && <span>Stop</span>}
              <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-300 rounded-full animate-pulse" />
            </>
          ) : (
            <>
              <Mic className={getIconSize()} />
              {!compact && <span>Voice</span>}
            </>
          )}
        </motion.button>

        {!compact && (
          <AnimatePresence>
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs text-center text-dark-textSecondary bg-dark-surface/50 rounded px-2 py-1 max-w-xs"
              >
                "{transcript}"
              </motion.div>
            )}
            
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-xs text-center px-2 py-1 rounded max-w-xs ${
                  feedback.type === 'success' ? 'text-green-400' :
                  feedback.type === 'error' ? 'text-red-400' :
                  feedback.type === 'processing' ? 'text-blue-400' :
                  'text-gray-400'
                }`}
              >
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default VoiceControlButton;