import React, { useState, useCallback } from 'react';
import { Bot, Mic, Volume2, VolumeX, Zap, Lightbulb, Fan, BarChart3 } from 'lucide-react';

interface VoiceAssistantProps {
  language?: 'english' | 'hindi';
  autoStart?: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  language = 'english',
  autoStart = false
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Backend API base URL
  const API_BASE_URL = 'http://localhost:3000';

  // Send message to backend API
  const sendToBackend = async (prompt: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  };

  // Text-to-speech function
  const speakResponse = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (/[\u0900-\u097F]/.test(text)) {
      selectedVoice = voices.find(voice =>
        voice.lang.includes('hi') || voice.name.includes('Hindi')
      );
    } else if (/[a-zA-Z]/.test(text)) {
      selectedVoice = voices.find(voice =>
        voice.lang.includes('en') && (voice.lang.includes('IN') || voice.lang.includes('US'))
      );
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setError('Speech synthesis failed');
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Handle voice input
  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    setTranscript(transcript);

    try {
      const aiResponse = await sendToBackend(transcript);
      setResponse(aiResponse);
      speakResponse(aiResponse);
    } catch (err) {
      setError('Failed to process voice input');
      console.error(err);
    }
  };

  // Voice control functions
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hindi' ? 'hi-IN' : 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceInput(transcript);
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    setError(null);
    setIsListening(true);
    recognition.start();
  }, [language]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleToggleAssistant = () => {
    if (isEnabled) {
      stopListening();
      stopSpeaking();
      setIsEnabled(false);
    } else {
      setIsEnabled(true);
      startListening();
    }
  };

  return (
    <div className="voice-assistant-container glass rounded-2xl p-6 max-w-md mx-auto glow-effect">
      <div className="text-center mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 glow-effect">
            <Bot size={32} className="text-primary" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl"></div>
        </div>
        <h2 className="text-2xl font-heading text-white mb-2 serif-optimized gradient-text">
          EcoSync Voice Assistant
        </h2>
        <p className="text-slate-300 text-sm font-body serif-optimized">
          Control your smart home with voice commands
        </p>
      </div>

      {/* Status Indicators */}
      <div className="flex justify-center space-x-4 mb-6">
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium glass ${
          isListening ? 'bg-danger/20 text-danger border-danger/30' : 'bg-dark-surface/20 text-dark-textSecondary border-dark-surface/30'
        }`}>
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-danger animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="font-body serif-optimized">{isListening ? 'Listening...' : 'Ready'}</span>
        </div>

        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium glass ${
          isSpeaking ? 'bg-primary/20 text-primary border-primary/30' : 'bg-dark-surface/20 text-dark-textSecondary border-dark-surface/30'
        }`}>
          <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-primary animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="font-body serif-optimized">{isSpeaking ? 'Speaking...' : 'Silent'}</span>
        </div>
      </div>

      {/* Main Control Button */}
      <div className="text-center mb-6">
        <button
          onClick={handleToggleAssistant}
          className={`w-24 h-24 rounded-full text-white transition-all duration-300 transform flex items-center justify-center ${
            isEnabled
              ? 'bg-secondary hover:bg-secondary-dark shadow-xl scale-105 hover:scale-110 glow-effect-green'
              : 'bg-dark-surface/50 hover:bg-dark-surface/70 shadow-lg hover:scale-105'
          }`}
        >
          {isEnabled ? <Mic size={32} /> : <VolumeX size={32} />}
        </button>
        <p className="mt-3 text-sm text-dark-textSecondary font-medium font-body serif-optimized">
          {isEnabled ? 'Assistant Active' : 'Click to Start'}
        </p>
      </div>

      {/* Voice Controls */}
      {isEnabled && (
        <div className="flex justify-center space-x-3 mb-6">
          <button
            onClick={toggleListening}
            className={`px-6 py-3 rounded-xl text-sm font-medium font-accent serif-optimized transition-all transform hover:scale-105 ${
              isListening
                ? 'bg-danger text-white hover:bg-danger-dark shadow-lg glow-effect-danger'
                : 'bg-secondary text-white hover:bg-secondary-dark shadow-lg glow-effect-green'
            }`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-6 py-3 bg-warning text-white rounded-xl text-sm font-medium font-accent serif-optimized hover:bg-warning-dark shadow-lg transition-all transform hover:scale-105 glow-effect"
            >
              Stop Speaking
            </button>
          )}
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="mb-4 p-4 glass bg-primary/10 rounded-xl border border-primary/30">
          <p className="text-sm text-primary mb-1 font-medium font-body serif-optimized">You said:</p>
          <p className="text-white font-medium font-body serif-optimized">{transcript}</p>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className="mb-4 p-4 glass bg-secondary/10 rounded-xl border border-secondary/30">
          <p className="text-sm text-secondary mb-1 font-medium font-body serif-optimized">EcoSync Response:</p>
          <p className="text-white font-medium font-body serif-optimized">{response}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 glass bg-danger/10 rounded-xl border border-danger/30">
          <p className="text-sm text-danger mb-1 font-medium font-body serif-optimized">Error:</p>
          <p className="text-danger text-sm font-body serif-optimized">{error}</p>
        </div>
      )}

      {/* Quick Commands */}
      <div className="mt-6 p-4 glass bg-dark-surface/20 rounded-xl border border-dark-surface/30">
        <p className="text-sm font-bold text-white mb-3 font-heading serif-optimized">Quick Commands:</p>
        <div className="text-xs text-dark-textSecondary space-y-2 font-body serif-optimized">
          <p className="flex items-center">
            <Lightbulb size={12} className="mr-2 text-primary" />
            "Turn on the bedroom lights"
          </p>
          <p className="flex items-center">
            <Fan size={12} className="mr-2 text-primary" />
            "Turn off all fans"
          </p>
          <p className="flex items-center">
            <Zap size={12} className="mr-2 text-primary" />
            "What's my energy usage today?"
          </p>
          <p className="flex items-center">
            <BarChart3 size={12} className="mr-2 text-primary" />
            "Show me the energy report"
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;