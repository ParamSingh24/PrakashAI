export interface VoiceCommand {
  intent: string;
  entity?: string;
  action?: 'on' | 'off' | 'status' | 'info';
  confidence: number;
}

export interface ApplianceControl {
  id: string;
  name: string;
  hindiName: string;
  type: 'fan' | 'ac' | 'light' | 'pump' | 'heater';
  status: 'on' | 'off';
  power: number; // watts
  cost: number; // rupees per hour
}

export interface EnergyData {
  dailyCost: number;
  monthlyCost: number;
  co2Saved: number;
  energySaved: number;
  currentUsage: number;
}

export interface VoiceResponse {
  text: string;
  action?: {
    type: 'appliance_control' | 'energy_report' | 'reminder';
    data: any;
  };
}

export interface SpeechConfig {
  language: 'hi-IN' | 'en-US';
  rate: number;
  pitch: number;
  volume: number;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}