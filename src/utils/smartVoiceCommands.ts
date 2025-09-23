// Enhanced voice command processing with multilingual support
export interface VoiceCommand {
  intent: 'appliance_control' | 'energy_query' | 'status_query' | 'general_chat';
  action?: 'turn_on' | 'turn_off' | 'toggle' | 'status';
  appliance?: string;
  location?: string;
  confidence: number;
  originalText: string;
}

export interface ApplianceMatch {
  uid: string;
  name: string;
  type: string;
  confidence: number;
}

// Multilingual appliance mappings
const applianceKeywords = {
  fan: {
    english: ['fan', 'ceiling fan', 'table fan', 'exhaust fan'],
    hindi: ['पंखा', 'pankha', 'fan'],
    hinglish: ['pankha', 'fan']
  },
  light: {
    english: ['light', 'lights', 'lamp', 'bulb', 'lighting'],
    hindi: ['बत्ती', 'लाइट', 'दीया'],
    hinglish: ['batti', 'light', 'bulb']
  },
  ac: {
    english: ['ac', 'air conditioner', 'air conditioning', 'cooling', 'aircon'],
    hindi: ['एसी', 'एयर कंडीशनर'],
    hinglish: ['ac', 'aircon']
  },
  heater: {
    english: ['heater', 'heating', 'warmer'],
    hindi: ['हीटर', 'गर्म करने वाला'],
    hinglish: ['heater']
  },
  pump: {
    english: ['pump', 'water pump', 'motor'],
    hindi: ['पंप', 'मोटर'],
    hinglish: ['pump', 'motor']
  },
  tv: {
    english: ['tv', 'television', 'telly'],
    hindi: ['टीवी', 'टेलीविजन'],
    hinglish: ['tv']
  },
  computer: {
    english: ['computer', 'pc', 'laptop', 'desktop'],
    hindi: ['कंप्यूटर', 'लैपटॉप'],
    hinglish: ['computer', 'laptop', 'pc']
  }
};

// Action keywords
const actionKeywords = {
  turn_on: {
    english: ['turn on', 'switch on', 'start', 'activate', 'power on', 'enable'],
    hindi: ['चालू करो', 'चालू कर दो', 'शुरू करो', 'ऑन करो'],
    hinglish: ['chalu karo', 'on karo', 'start karo', 'chalao']
  },
  turn_off: {
    english: ['turn off', 'switch off', 'stop', 'deactivate', 'power off', 'disable', 'shut down'],
    hindi: ['बंद करो', 'बंद कर दो', 'रोको', 'ऑफ करो'],
    hinglish: ['band karo', 'off karo', 'stop karo', 'bandh karo']
  },
  toggle: {
    english: ['toggle', 'switch', 'change', 'flip'],
    hindi: ['बदलो', 'स्विच करो'],
    hinglish: ['toggle karo', 'switch karo']
  },
  status: {
    english: ['status', 'state', 'how is', 'what is', 'check'],
    hindi: ['स्थिति', 'कैसा है', 'क्या हाल है'],
    hinglish: ['status kya hai', 'kaisa hai']
  }
};

// Location keywords
const locationKeywords = {
  bedroom: ['bedroom', 'bed room', 'सोने का कमरा', 'bedroom'],
  living_room: ['living room', 'hall', 'drawing room', 'बैठक', 'hall'],
  kitchen: ['kitchen', 'रसोई', 'kitchen'],
  bathroom: ['bathroom', 'washroom', 'गुसलखाना', 'bathroom'],
  balcony: ['balcony', 'बालकनी', 'balcony'],
  office: ['office', 'study', 'कार्यालय', 'office']
};

export class SmartVoiceProcessor {
  private appliances: Array<{
    uid: string;
    name: string;
    type: string;
    location?: string;
  }>;

  constructor(appliances: Array<{ uid: string; name: string; type: string; location?: string; }>) {
    this.appliances = appliances;
  }

  // Main processing function
  processVoiceCommand(transcript: string): VoiceCommand {
    const cleanTranscript = this.cleanTranscript(transcript);
    
    // Detect intent
    const intent = this.detectIntent(cleanTranscript);
    
    if (intent === 'appliance_control') {
      return this.processApplianceCommand(cleanTranscript);
    } else if (intent === 'energy_query') {
      return this.processEnergyQuery(cleanTranscript);
    } else if (intent === 'status_query') {
      return this.processStatusQuery(cleanTranscript);
    } else {
      return {
        intent: 'general_chat',
        confidence: 0.3,
        originalText: transcript
      };
    }
  }

  private cleanTranscript(transcript: string): string {
    return transcript.toLowerCase().trim()
      .replace(/[.,!?;]/g, '')
      .replace(/\s+/g, ' ');
  }

  private detectIntent(transcript: string): VoiceCommand['intent'] {
    // Check for appliance control keywords
    const hasApplianceKeyword = this.hasAnyKeyword(transcript, applianceKeywords);
    const hasActionKeyword = this.hasAnyKeyword(transcript, actionKeywords);
    
    if (hasApplianceKeyword && hasActionKeyword) {
      return 'appliance_control';
    }

    // Check for energy-related queries
    const energyKeywords = ['bill', 'cost', 'usage', 'consumption', 'energy', 'power', 'electricity', 'बिल', 'खर्च', 'बिजली'];
    if (energyKeywords.some(keyword => transcript.includes(keyword))) {
      return 'energy_query';
    }

    // Check for status queries
    const statusKeywords = ['status', 'how many', 'which', 'what', 'स्थिति', 'कितने', 'कौन से'];
    if (statusKeywords.some(keyword => transcript.includes(keyword))) {
      return 'status_query';
    }

    return 'general_chat';
  }

  private processApplianceCommand(transcript: string): VoiceCommand {
    const action = this.extractAction(transcript);
    const appliance = this.extractAppliance(transcript);
    const location = this.extractLocation(transcript);

    let confidence = 0.5;
    if (action && appliance) confidence = 0.9;
    else if (action || appliance) confidence = 0.7;

    return {
      intent: 'appliance_control',
      action,
      appliance,
      location,
      confidence,
      originalText: transcript
    };
  }

  private processEnergyQuery(transcript: string): VoiceCommand {
    return {
      intent: 'energy_query',
      confidence: 0.8,
      originalText: transcript
    };
  }

  private processStatusQuery(transcript: string): VoiceCommand {
    return {
      intent: 'status_query',
      confidence: 0.8,
      originalText: transcript
    };
  }

  private extractAction(transcript: string): VoiceCommand['action'] | undefined {
    for (const [action, keywords] of Object.entries(actionKeywords)) {
      for (const langKeywords of Object.values(keywords)) {
        if (langKeywords.some(keyword => transcript.includes(keyword))) {
          return action as VoiceCommand['action'];
        }
      }
    }
    return undefined;
  }

  private extractAppliance(transcript: string): string | undefined {
    let bestMatch = '';
    let highestScore = 0;

    for (const [appliance, keywords] of Object.entries(applianceKeywords)) {
      for (const langKeywords of Object.values(keywords)) {
        for (const keyword of langKeywords) {
          if (transcript.includes(keyword)) {
            const score = keyword.length; // Longer matches get higher scores
            if (score > highestScore) {
              highestScore = score;
              bestMatch = appliance;
            }
          }
        }
      }
    }

    return bestMatch || undefined;
  }

  private extractLocation(transcript: string): string | undefined {
    for (const [location, keywords] of Object.entries(locationKeywords)) {
      if (keywords.some(keyword => transcript.includes(keyword))) {
        return location;
      }
    }
    return undefined;
  }

  private hasAnyKeyword(transcript: string, keywordGroups: any): boolean {
    for (const group of Object.values(keywordGroups)) {
      for (const langKeywords of Object.values(group as any)) {
        if ((langKeywords as string[]).some(keyword => transcript.includes(keyword))) {
          return true;
        }
      }
    }
    return false;
  }

  // Find matching appliances
  findMatchingAppliances(command: VoiceCommand): ApplianceMatch[] {
    if (!command.appliance) return [];

    const matches: ApplianceMatch[] = [];

    for (const appliance of this.appliances) {
      let confidence = 0;

      // Exact name match
      if (appliance.name.toLowerCase().includes(command.appliance)) {
        confidence += 0.8;
      }

      // Type match
      if (appliance.type.toLowerCase().includes(command.appliance)) {
        confidence += 0.6;
      }

      // Location match
      if (command.location && appliance.location?.toLowerCase().includes(command.location)) {
        confidence += 0.4;
      }

      // Partial name match
      const applianceWords = appliance.name.toLowerCase().split(' ');
      const commandWords = command.appliance.split(' ');
      const commonWords = applianceWords.filter(word => commandWords.includes(word));
      if (commonWords.length > 0) {
        confidence += (commonWords.length / applianceWords.length) * 0.5;
      }

      if (confidence > 0.3) {
        matches.push({
          uid: appliance.uid,
          name: appliance.name,
          type: appliance.type,
          confidence
        });
      }
    }

    // Sort by confidence
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  // Generate natural language responses
  generateResponse(command: VoiceCommand, result?: any): string {
    switch (command.intent) {
      case 'appliance_control':
        if (result?.success) {
          const appliance = result.appliance;
          const responses = [
            `${appliance.name} has been turned ${appliance.state}.`,
            `I've ${appliance.state === 'on' ? 'switched on' : 'switched off'} the ${appliance.name}.`,
            `${appliance.name} is now ${appliance.state}.`
          ];
          return responses[Math.floor(Math.random() * responses.length)];
        } else {
          return result?.error || "I couldn't control that device. Please try again.";
        }

      case 'energy_query':
        return "Let me check your energy usage and costs for you.";

      case 'status_query':
        return "Here's the current status of your smart home devices.";

      default:
        return "I'm here to help you control your smart home devices. Try saying 'turn on the fan' or 'switch off the lights'.";
    }
  }
}

// Utility function to create processor instance
export const createVoiceProcessor = (appliances: Array<{ uid: string; name: string; type: string; location?: string; }>) => {
  return new SmartVoiceProcessor(appliances);
};