import { VoiceCommand, ApplianceControl } from '../types/voice.types';

// Hindi to English command mapping
const commandMappings = {
  // Appliances
  'पंखा': 'fan',
  'pankha': 'fan',
  'एसी': 'ac',
  'ac': 'ac',
  'लाइट': 'light',
  'light': 'light',
  'बत्ती': 'light',
  'पंप': 'pump',
  'pump': 'pump',
  'हीटर': 'heater',
  'heater': 'heater',
  
  // Actions
  'चालू': 'on',
  'on': 'on',
  'बंद': 'off',
  'off': 'off',
  'band': 'off',
  'chalu': 'on',
  
  // Status queries
  'स्टेटस': 'status',
  'status': 'status',
  'कैसा': 'status',
  'kaisa': 'status',
  
  // Energy queries
  'बिल': 'bill',
  'bill': 'bill',
  'खर्च': 'cost',
  'kharcha': 'cost',
  'पैसा': 'money',
  'paisa': 'money',
  'रिपोर्ट': 'report',
  'report': 'report'
};

export const parseVoiceCommand = (transcript: string): VoiceCommand => {
  const lowerTranscript = transcript.toLowerCase();
  
  // Extract appliance
  let appliance = '';
  let action = '';
  
  for (const [hindi, english] of Object.entries(commandMappings)) {
    if (lowerTranscript.includes(hindi)) {
      if (['fan', 'ac', 'light', 'pump', 'heater'].includes(english)) {
        appliance = english;
      } else if (['on', 'off', 'status'].includes(english)) {
        action = english;
      }
    }
  }
  
  // Determine intent
  let intent = 'unknown';
  
  if (appliance && action) {
    intent = 'appliance_control';
  } else if (lowerTranscript.includes('bill') || lowerTranscript.includes('बिल') || 
             lowerTranscript.includes('cost') || lowerTranscript.includes('खर्च')) {
    intent = 'energy_query';
  } else if (lowerTranscript.includes('report') || lowerTranscript.includes('रिपोर्ट')) {
    intent = 'energy_report';
  } else if (lowerTranscript.includes('status') || lowerTranscript.includes('स्टेटस')) {
    intent = 'status_query';
  }
  
  return {
    intent,
    entity: appliance,
    action: action as 'on' | 'off' | 'status',
    confidence: appliance && action ? 0.9 : 0.6
  };
};

export const generateResponse = (
  command: VoiceCommand, 
  appliances: ApplianceControl[],
  energyData: any
): string => {
  
  switch (command.intent) {
    case 'appliance_control':
      if (command.entity && command.action) {
        const appliance = appliances.find(a => a.type === command.entity);
        if (appliance) {
          const hindiName = appliance.hindiName;
          if (command.action === 'on') {
            return `${hindiName} अब चालू हो गया। आज आपने ₹${appliance.cost} का खर्च किया।`;
          } else if (command.action === 'off') {
            const savings = Math.round(appliance.cost * 0.1);
            const co2Saved = Math.round(appliance.power * 0.0005 * 100) / 100;
            return `${hindiName} अब बंद हो गया। आपने ₹${savings} और ${co2Saved} kg CO₂ बचाया!`;
          }
        }
      }
      return 'मुझे समझ नहीं आया। कृपया फिर से कहें।';
      
    case 'energy_query':
      return `आज आपका अनुमानित बिल है ₹${energyData?.dailyCost || 120}। क्या आप ज्यादा बचत के लिए कोई सुझाव चाहेंगे?`;
      
    case 'energy_report':
      return `आज तक आपने ₹${energyData?.monthlyCost || 2500} खर्च किया है। आपने ${energyData?.co2Saved || 15} kg CO₂ बचाया है।`;
      
    case 'status_query':
      const activeAppliances = appliances.filter(a => a.status === 'on').length;
      return `अभी ${activeAppliances} उपकरण चालू हैं। कुल खर्च ₹${energyData?.currentUsage || 45} प्रति घंटा।`;
      
    default:
      return 'मैं आपकी मदद के लिए यहाँ हूँ। आप मुझसे पंखा, लाइट, या बिल के बारे में पूछ सकते हैं।';
  }
};

export const getApplianceByName = (name: string, appliances: ApplianceControl[]): ApplianceControl | undefined => {
  return appliances.find(appliance => 
    appliance.type === name || 
    appliance.name.toLowerCase().includes(name.toLowerCase()) ||
    appliance.hindiName.includes(name)
  );
};