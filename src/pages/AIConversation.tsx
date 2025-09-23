import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/UI/Icon';
import { 
  Bot, 
  MessageSquare, 
  Mic, 
  Send, 
  Volume2, 
  VolumeX, 
  Zap, 
  DollarSign, 
  BarChart3, 
  Fan, 
  Home, 
  Lightbulb,
  Activity,
  AlertTriangle,
  Settings,
  Server
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

const AIConversation: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your EcoSync AI Assistant. I\'m here to help you manage your smart home and energy usage efficiently. You can chat with me in any language, and I\'ll control your appliances, provide energy insights, and help optimize your home. How can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [communicationMode, setCommunicationMode] = useState<'chat' | 'voice'>('chat');
  
  // Voice-related states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // API configuration states
  const [showSettings, setShowSettings] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    return localStorage.getItem('ecosync-api-url') || 'http://localhost:3000';
  });
  const [tempApiUrl, setTempApiUrl] = useState(apiBaseUrl);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // Default to English, supports multiple languages

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        
        setCurrentTranscript(transcript);
        
        if (event.results[current].isFinal) {
          handleVoiceInput(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        setVoiceError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setCurrentTranscript('');
      };
    }

    // Initialize Speech Synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice input processing
  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: transcript.trim(),
      timestamp: new Date(),
      isVoice: true
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await sendToBackend(transcript);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        isVoice: true
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      
      // Speak the response
      speakResponse(response);
    } catch (error) {
      setIsTyping(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I had some trouble processing your voice input. Please try again, and I\'ll do my best to help you!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Send message to backend API
  const sendToBackend = async (prompt: string): Promise<string> => {
    const response = await fetch(`${apiBaseUrl}/chatbot`, {
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

  // Save API URL to localStorage
  const saveApiUrl = () => {
    setApiBaseUrl(tempApiUrl);
    localStorage.setItem('ecosync-api-url', tempApiUrl);
    setShowSettings(false);
    
    // Add a system message to indicate the change
    const systemMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `API endpoint updated to: ${tempApiUrl}. I'm now ready to connect to your EcoSync server!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  // Reset API URL to default
  const resetApiUrl = () => {
    const defaultUrl = 'http://localhost:3000';
    setTempApiUrl(defaultUrl);
    setApiBaseUrl(defaultUrl);
    localStorage.setItem('ecosync-api-url', defaultUrl);
  };

  // Text-to-speech function
  const speakResponse = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Auto-detect language and set appropriate voice
    const voices = synthRef.current.getVoices();
    let selectedVoice = null;
    
    // Detect language from text content
    if (/[\u0900-\u097F]/.test(text)) {
      // Hindi/Devanagari script detected
      selectedVoice = voices.find(voice => 
        voice.lang.includes('hi') || voice.name.includes('Hindi')
      );
    } else if (/[a-zA-Z]/.test(text)) {
      // English detected
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

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setVoiceError('Speech synthesis failed');
    };

    synthRef.current.speak(utterance);
  }, []);

  // Voice control functions
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      setVoiceError(null);
      setCurrentTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening, isSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Voice button handlers
  const handleVoiceButtonClick = () => {
    if (isListening) {
      stopListening();
    } else if (isSpeaking) {
      stopSpeaking();
    } else {
      startListening();
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await sendToBackend(content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    } catch (error) {
      setIsTyping(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I had some trouble understanding your request. Please try again, and I\'ll do my best to help you!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const toggleMode = () => {
    if (communicationMode === 'voice') {
      stopSpeaking();
      stopListening();
      setCommunicationMode('chat');
    } else {
      setCommunicationMode('voice');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1d2e] to-[#0f172a]">
      {/* Subtle Background Effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 radial-bg-primary rounded-full blur-3xl pointer-events-none floating"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 radial-bg-primary rounded-full blur-3xl pointer-events-none floating" style={{ animationDelay: '3s' }}></div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="glass rounded-2xl p-6 glow-effect">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center glow-effect">
                  <Bot size={32} className="text-primary" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl"></div>
              </div>
              <div>
                <h1 className="text-4xl font-heading text-white serif-optimized gradient-text">
                  EcoSync AI Assistant
                </h1>
                <p className="font-body text-slate-300 serif-optimized leading-relaxed text-lg">
                  Your intelligent smart home energy management companion
                </p>
              </div>
            </div>
            
            {/* Mode Toggle and Settings */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button
                onClick={toggleMode}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-accent serif-optimized transition-all transform hover:scale-105 ${
                  communicationMode === 'chat' 
                    ? 'glass bg-primary/30 text-white border-primary/50 glow-effect shadow-lg' 
                    : 'glass bg-white/5 text-dark-textSecondary hover:bg-white/10 border-white/10 hover:border-white/20'
                }`}
              >
                <MessageSquare size={20} />
                <span>Text Chat</span>
              </button>
              
              <button
                onClick={toggleMode}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-accent serif-optimized transition-all transform hover:scale-105 ${
                  communicationMode === 'voice' 
                    ? 'glass bg-secondary/30 text-white border-secondary/50 glow-effect shadow-lg' 
                    : 'glass bg-white/5 text-dark-textSecondary hover:bg-white/10 border-white/10 hover:border-white/20'
                }`}
              >
                <Mic size={20} />
                <span>Voice Chat</span>
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-accent serif-optimized transition-all transform hover:scale-105 ${
                  showSettings 
                    ? 'glass bg-warning/30 text-white border-warning/50 glow-effect shadow-lg' 
                    : 'glass bg-white/5 text-dark-textSecondary hover:bg-white/10 border-white/10 hover:border-white/20'
                }`}
              >
                <Settings size={20} />
              </button>
            </div>

            {/* API Settings Panel */}
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 glass bg-dark-surface/20 rounded-xl p-4 border border-dark-surface/30"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <Server size={20} className="text-primary" />
                  <h3 className="text-lg font-heading text-white serif-optimized">API Configuration</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2 font-body serif-optimized">
                      Backend Server URL
                    </label>
                    <input
                      type="text"
                      value={tempApiUrl}
                      onChange={(e) => setTempApiUrl(e.target.value)}
                      placeholder="http://192.168.1.100:3000"
                      className="w-full glass bg-dark-surface/30 border border-dark-surface/50 rounded-xl px-4 py-3 text-dark-text placeholder-dark-textSecondary focus:outline-none focus:border-primary focus:glow-effect transition-all duration-300"
                    />
                    <p className="text-xs text-dark-textSecondary mt-1 font-body serif-optimized">
                      Enter your EcoSync server IP address and port
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={saveApiUrl}
                      className="flex-1 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark transition-all transform hover:scale-105 glow-effect font-accent serif-optimized"
                    >
                      Save & Connect
                    </button>
                    <button
                      onClick={resetApiUrl}
                      className="px-4 py-2 glass bg-dark-surface/30 text-dark-textSecondary rounded-xl hover:bg-dark-surface/50 transition-all transform hover:scale-105 font-accent serif-optimized"
                    >
                      Reset
                    </button>
                  </div>
                  
                  <div className="text-xs text-dark-textSecondary font-body serif-optimized">
                    <p className="mb-1"><strong>Current:</strong> {apiBaseUrl}</p>
                    <p><strong>Status:</strong> <span className="text-secondary">Ready to connect</span></p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Voice Status */}
            {communicationMode === 'voice' && (
              <div className="flex justify-center space-x-4 mb-6">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium glass ${
                  isListening ? 'bg-danger/20 text-danger border-danger/30' : 'bg-dark-surface/20 text-dark-textSecondary border-dark-surface/30'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-danger animate-pulse' : 'bg-gray-400'}`}></div>
                  <span>{isListening ? 'Listening...' : 'Ready'}</span>
                </div>
                
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium glass ${
                  isSpeaking ? 'bg-primary/20 text-primary border-primary/30' : 'bg-dark-surface/20 text-dark-textSecondary border-dark-surface/30'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-primary animate-pulse' : 'bg-gray-400'}`}></div>
                  <span>{isSpeaking ? 'Speaking...' : 'Silent'}</span>
                </div>
              </div>
            )}

            {/* Current Transcript Display */}
            {communicationMode === 'voice' && currentTranscript && (
              <div className="flex justify-center mb-6">
                <div className="glass bg-primary/10 text-primary px-6 py-3 rounded-xl max-w-md border border-primary/30">
                  <p className="text-sm font-medium">Listening: "{currentTranscript}"</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Chat Container */}
        <div className="glass rounded-2xl overflow-hidden glow-effect">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-primary text-white shadow-lg'
                      : 'glass bg-dark-surface/30 text-dark-text border border-dark-surface/50'
                  }`}>
                    <p className="text-sm leading-relaxed font-body serif-optimized">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70 font-body serif-optimized">
                        {message.timestamp.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.isVoice && (
                        <Mic size={12} className="opacity-70" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="glass bg-dark-surface/30 text-dark-text px-4 py-3 rounded-2xl border border-dark-surface/50">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {communicationMode === 'chat' ? (
            <div className="border-t border-dark-surface/50 p-6">
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="flex-1 glass bg-dark-surface/30 border border-dark-surface/50 rounded-xl px-4 py-3 text-dark-text placeholder-dark-textSecondary focus:outline-none focus:border-primary focus:glow-effect transition-all duration-300"
                />
                <button
                  onClick={() => sendMessage(inputMessage)}
                  disabled={!inputMessage.trim()}
                  className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 glow-effect"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-dark-surface/50 p-6 text-center">
              <div className="mb-6 dancingbutton flex justify-center items-center flex-col">
                <button
                  onClick={handleVoiceButtonClick}
                  className={`w-24 h-24 rounded-full text-white transition-all duration-200 select-none transform flex items-center justify-center ${
                    isListening 
                      ? 'bg-danger shadow-xl scale-110 animate-pulse glow-effect-danger' 
                      : isSpeaking
                      ? 'bg-primary shadow-xl scale-105 glow-effect'
                      : 'bg-secondary hover:bg-secondary-dark shadow-lg hover:scale-105 glow-effect-green'
                  }`}
                >
                  {isListening ? (
                    <VolumeX size={32} />
                  ) : isSpeaking ? (
                    <Volume2 size={32} />
                  ) : (
                    <Mic size={32} />
                  )}
                </button>
                <p className="mt-4 text-sm text-dark-textSecondary font-medium font-body serif-optimized">
                  {isListening 
                    ? 'Listening... Click again to stop' 
                    : isSpeaking 
                    ? 'Speaking... Click to stop'
                    : 'Click to start voice chat'}
                </p>
                {isSpeaking && (
                  <div className="mt-3 flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-sm text-primary ml-2 font-medium font-body serif-optimized">AI is speaking...</span>
                  </div>
                )}
                {voiceError && (
                  <p className="mt-3 text-sm text-danger font-medium font-body serif-optimized">Something went wrong! Please try again.</p>
                )}
              </div>
              
              {/* Voice Instructions */}
              <div className="glass bg-dark-surface/20 rounded-xl p-4 text-xs text-dark-textSecondary border border-dark-surface/30">
                <div className="flex items-center justify-center mb-2">
                  <Activity size={16} className="text-primary mr-2" />
                  <p className="font-semibold text-dark-text font-body serif-optimized">How to use voice chat:</p>
                </div>
                <div className="space-y-1 font-body serif-optimized">
                  <p>• Click the microphone button to start</p>
                  <p>• Speak clearly and naturally</p>
                  <p>• Click again to stop recording</p>
                  <p>• AI will respond with both text and voice</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 glass rounded-2xl p-6 glow-effect"
        >
          <h3 className="text-xl font-heading text-white mb-4 serif-optimized gradient-text">Quick Commands</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <button 
              onClick={() => sendMessage("What's my current energy usage?")}
              className="text-left p-4 glass bg-dark-surface/20 rounded-xl hover:bg-dark-surface/30 transition-all text-dark-textSecondary hover:text-dark-text border border-dark-surface/30 hover:border-primary/30 hover:glow-effect transform hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <DollarSign size={16} className="text-primary" />
                <span className="font-body serif-optimized">"What's my current energy usage?"</span>
              </div>
            </button>
            <button 
              onClick={() => sendMessage("Turn off all lights")}
              className="text-left p-4 glass bg-dark-surface/20 rounded-xl hover:bg-dark-surface/30 transition-all text-dark-textSecondary hover:text-dark-text border border-dark-surface/30 hover:border-primary/30 hover:glow-effect transform hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <Lightbulb size={16} className="text-primary" />
                <span className="font-body serif-optimized">"Turn off all lights"</span>
              </div>
            </button>
            <button 
              onClick={() => sendMessage("Show me today's energy report")}
              className="text-left p-4 glass bg-dark-surface/20 rounded-xl hover:bg-dark-surface/30 transition-all text-dark-textSecondary hover:text-dark-text border border-dark-surface/30 hover:border-primary/30 hover:glow-effect transform hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <BarChart3 size={16} className="text-primary" />
                <span className="font-body serif-optimized">"Show me today's energy report"</span>
              </div>
            </button>
            <button 
              onClick={() => sendMessage("Turn on the bedroom fan")}
              className="text-left p-4 glass bg-dark-surface/20 rounded-xl hover:bg-dark-surface/30 transition-all text-dark-textSecondary hover:text-dark-text border border-dark-surface/30 hover:border-primary/30 hover:glow-effect transform hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <Fan size={16} className="text-primary" />
                <span className="font-body serif-optimized">"Turn on the bedroom fan"</span>
              </div>
            </button>
            <button 
              onClick={() => sendMessage("Check for any anomalies")}
              className="text-left p-4 glass bg-dark-surface/20 rounded-xl hover:bg-dark-surface/30 transition-all text-dark-textSecondary hover:text-dark-text border border-dark-surface/30 hover:border-primary/30 hover:glow-effect transform hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle size={16} className="text-primary" />
                <span className="font-body serif-optimized">"Check for any anomalies"</span>
              </div>
            </button>
            <button 
              onClick={() => sendMessage("Give me energy saving tips")}
              className="text-left p-4 glass bg-dark-surface/20 rounded-xl hover:bg-dark-surface/30 transition-all text-dark-textSecondary hover:text-dark-text border border-dark-surface/30 hover:border-primary/30 hover:glow-effect transform hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <Zap size={16} className="text-primary" />
                <span className="font-body serif-optimized">"Give me energy saving tips"</span>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIConversation;