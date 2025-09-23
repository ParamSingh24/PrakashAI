import { useState, useRef, useCallback, useEffect } from 'react';
import { AI_CONFIG, getGeminiEndpoint, createGenerationConfig } from '../config/ai.config';

interface VoiceAssistantConfig {
  apiKey: string;
  language: string;
  autoStart: boolean;
  onApplianceControl?: (voiceInput: string) => Promise<ApplianceControlResult>;
}

interface ApplianceCommand {
  action: 'turn_on' | 'turn_off' | 'toggle';
  appliance: string;
  location?: string;
}

interface ApplianceControlResult {
  success: boolean;
  appliance?: {
    name: string;
    state: 'on' | 'off';
    location?: string;
  };
  error?: string;
}

interface ApplianceStatus {
  id: string;
  name: string;
  status: 'on' | 'off';
  power: number;
  cost: number;
}

export const useGeminiVoiceAssistant = (config: VoiceAssistantConfig) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      // Set to auto-detect or default to Hindi, but can recognize multiple languages
      recognitionRef.current.lang = 'en-US'; // Primary language, but will adapt to user input

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        
        if (event.results[current].isFinal) {
          setTranscript(transcript);
          handleUserInput(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [config.language]);

  // Handle user voice input
  const handleUserInput = async (input: string) => {
    try {
      // First check if it's an appliance control command
      if (config.onApplianceControl) {
        const result = await config.onApplianceControl(input);
        if (result.success) {
          const response = result.message || generateSuccessResponse(result);
          setResponse(response);
          speakResponse(response);
          return;
        } else if (result.error && !result.error.includes("didn't understand")) {
          // If it's a clear appliance command but failed, show error
          setResponse(result.error);
          speakResponse(result.error);
          return;
        }
      }
      
      // If not an appliance command or failed, process with Gemini
      const response = await processWithGemini(input);
      setResponse(response);
      speakResponse(response);
    } catch (err) {
      setError('Failed to process voice input');
      console.error(err);
    }
  };

  // Process input with Gemini API
  const processWithGemini = async (input: string): Promise<string> => {
    const systemPrompt = `${AI_CONFIG.PROMPTS.VOICE_ASSISTANT}

User said: "${input}"

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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  };

  // Detect language and speak the response
  const speakResponse = (text: string) => {
    if (!synthRef.current) return;

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Auto-detect language and set appropriate voice
    const voices = synthRef.current.getVoices();
    let selectedVoice = null;
    
    // Enhanced language detection
    if (/[\u0900-\u097F]/.test(text)) {
      // Hindi/Devanagari script
      selectedVoice = voices.find(voice => 
        voice.lang.includes('hi') || voice.name.toLowerCase().includes('hindi')
      );
    } else if (/[\u4e00-\u9fff]/.test(text)) {
      // Chinese characters
      selectedVoice = voices.find(voice => 
        voice.lang.includes('zh') || voice.name.toLowerCase().includes('chinese')
      );
    } else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      // Japanese characters
      selectedVoice = voices.find(voice => 
        voice.lang.includes('ja') || voice.name.toLowerCase().includes('japanese')
      );
    } else if (/[\u0600-\u06ff]/.test(text)) {
      // Arabic script
      selectedVoice = voices.find(voice => 
        voice.lang.includes('ar') || voice.name.toLowerCase().includes('arabic')
      );
    } else if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(text.toLowerCase())) {
      // European languages with accents
      if (/[àáâãäåæçèéêëîïôõöøùúûüÿ]/.test(text.toLowerCase())) {
        // French
        selectedVoice = voices.find(voice => 
          voice.lang.includes('fr') || voice.name.toLowerCase().includes('french')
        );
      } else if (/[äöüß]/.test(text.toLowerCase())) {
        // German
        selectedVoice = voices.find(voice => 
          voice.lang.includes('de') || voice.name.toLowerCase().includes('german')
        );
      } else if (/[ñáéíóúü]/.test(text.toLowerCase())) {
        // Spanish
        selectedVoice = voices.find(voice => 
          voice.lang.includes('es') || voice.name.toLowerCase().includes('spanish')
        );
      }
    } else if (/[a-zA-Z]/.test(text)) {
      // English or other Latin-based languages
      selectedVoice = voices.find(voice => 
        voice.lang.includes('en') && (voice.lang.includes('US') || voice.lang.includes('GB'))
      ) || voices.find(voice => voice.lang.includes('en'));
    }
    
    // Fallback to default or first available voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.default) || voices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setError('Speech synthesis failed');
    };

    synthRef.current.speak(utterance);
  };

  // Start listening (Push-to-talk)
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      setError(null);
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening, isSpeaking]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Parse appliance commands from voice input
  const parseApplianceCommand = (input: string): ApplianceCommand | null => {
    const lowerInput = input.toLowerCase();
    
    // Common appliance names and their variations
    const appliancePatterns = {
      'fan': ['fan', 'pankha', 'पंखा', 'ceiling fan'],
      'light': ['light', 'lights', 'batti', 'बत्ती', 'lamp', 'bulb'],
      'ac': ['ac', 'air conditioner', 'एसी', 'cooling', 'aircon'],
      'heater': ['heater', 'हीटर', 'heating'],
      'pump': ['pump', 'पंप', 'water pump'],
      'tv': ['tv', 'television', 'टीवी'],
      'computer': ['computer', 'pc', 'laptop', 'कंप्यूटर']
    };
    
    // Action patterns
    const actionPatterns = {
      'turn_on': ['turn on', 'switch on', 'start', 'chalu', 'चालू', 'on karo', 'chalao'],
      'turn_off': ['turn off', 'switch off', 'stop', 'band', 'बंद', 'off karo', 'bandh karo'],
      'toggle': ['toggle', 'switch', 'change']
    };
    
    let detectedAppliance = '';
    let detectedAction: 'turn_on' | 'turn_off' | 'toggle' | '' = '';
    
    // Find appliance
    for (const [appliance, patterns] of Object.entries(appliancePatterns)) {
      if (patterns.some(pattern => lowerInput.includes(pattern))) {
        detectedAppliance = appliance;
        break;
      }
    }
    
    // Find action
    for (const [action, patterns] of Object.entries(actionPatterns)) {
      if (patterns.some(pattern => lowerInput.includes(pattern))) {
        detectedAction = action as 'turn_on' | 'turn_off' | 'toggle';
        break;
      }
    }
    
    if (detectedAppliance && detectedAction) {
      return {
        action: detectedAction,
        appliance: detectedAppliance
      };
    }
    
    return null;
  };

  // Generate respectful success response for appliance control
  const generateSuccessResponse = (result: ApplianceControlResult): string => {
    const appliance = result.appliance;
    if (!appliance) return 'Your device has been controlled successfully, sir/madam.';
    
    // Respectful responses in multiple languages
    const respectfulResponses = [
      // English - respectful
      `Certainly! ${appliance.name} is now ${appliance.state}, sir/madam.`,
      `Of course! I've turned ${appliance.state} the ${appliance.name} for you.`,
      `Done! Your ${appliance.name} is now ${appliance.state}.`,
      
      // Hindi - respectful with "aap"
      `जी हाँ आप! ${appliance.name} ${appliance.state === 'on' ? 'चालू हो गया' : 'बंद हो गया'}।`,
      `आपका काम हो गया! ${appliance.name} अब ${appliance.state === 'on' ? 'चालू' : 'बंद'} है।`,
      `बिल्कुल आप! ${appliance.name} ${appliance.state === 'on' ? 'ऑन' : 'ऑफ'} कर दिया।`,
      
      // Spanish - respectful
      `¡Por supuesto, señor/señora! ${appliance.name} está ahora ${appliance.state === 'on' ? 'encendido' : 'apagado'}.`,
      
      // French - respectful
      `Bien sûr, monsieur/madame! ${appliance.name} est maintenant ${appliance.state === 'on' ? 'allumé' : 'éteint'}.`,
      
      // German - respectful
      `Gerne! ${appliance.name} ist jetzt ${appliance.state === 'on' ? 'eingeschaltet' : 'ausgeschaltet'}.`
    ];
    
    return respectfulResponses[Math.floor(Math.random() * respectfulResponses.length)];
  };

  // Push-to-talk handlers
  const handleMouseDown = useCallback(() => {
    startListening();
  }, [startListening]);

  const handleMouseUp = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const handleTouchStart = useCallback(() => {
    startListening();
  }, [startListening]);

  const handleTouchEnd = useCallback(() => {
    stopListening();
  }, [stopListening]);

  // Toggle listening function
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSpeaking,
    transcript,
    response,
    error,
    startListening,
    stopListening,
    stopSpeaking,
    toggleListening,
    handleMouseDown,
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
  };
};