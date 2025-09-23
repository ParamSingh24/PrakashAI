export interface GestureCommand {
  name: string;
  gesture?: string;
  action: () => void;
  description: string;
}

export interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
  aliases?: string[];
}

export interface ColorBlindSettings {
  enabled: boolean;
  type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy' | 'none';
}

export interface AccessibilitySettings {
  voiceNavigation: boolean;
  textToSpeech: boolean;
  colorBlindMode: ColorBlindSettings;
  keyboardNavigation: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  reduceMotion: boolean;
}

export interface GestureRecognition {
  isActive: boolean;
  confidence: number;
  gesture: string | null;
  landmarks: any[];
}

export interface SpeechRecognition {
  isListening: boolean;
  transcript: string;
  confidence: number;
  isSupported: boolean;
}

export interface TextToSpeech {
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: string | null;
  rate: number;
  pitch: number;
  volume: number;
}
