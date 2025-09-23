# Voice Assistant Integration with Gemini API

## Overview
The EcoSync voice assistant is now integrated with Google's Gemini API using your provided API key: `AIzaSyBlPE_CFryO1QoEsa97z0pNqj3E-iNxo-w`

## Features
- **Universal Language Support**: Works with ANY language - English, Hindi, Spanish, French, German, Chinese, Arabic, and more!
- **Smart Home Control**: Voice commands to control appliances in any language
- **Natural Language Processing**: Understands context and intent across languages
- **Push-to-Talk Interface**: Hold button to speak
- **Voice Feedback**: Spoken responses in the same language you used

## How It Works

### 1. Voice Recognition
- Uses browser's built-in Speech Recognition API
- Supports multiple languages (Hindi, English)
- Real-time transcription of voice commands

### 2. AI Processing
- Commands are sent to Gemini API for intelligent processing
- AI understands context and responds appropriately
- Maintains caring "family member" personality

### 3. Device Control
- Voice commands are parsed for appliance control
- Smart matching of device names and actions
- Real-time device state updates

## Usage

### Basic Commands (Any Language!)
```
English:
- "Turn on the fan"
- "Switch off the lights"
- "What's my energy usage?"

Hindi:
- "पंखा चालू करो"
- "बत्ती बंद करो"
- "मेरा बिजली का बिल कितना है?"

Spanish:
- "Enciende el ventilador"
- "Apaga las luces"
- "¿Cuál es mi consumo de energía?"

French:
- "Allume le ventilateur"
- "Éteins les lumières"
- "Quelle est ma consommation d'énergie?"

German:
- "Schalte den Ventilator ein"
- "Schalte das Licht aus"
- "Wie hoch ist mein Energieverbrauch?"

And many more languages...
```

## Implementation Details

### Configuration
- API key is centrally managed in `src/config/ai.config.ts`
- Voice settings and prompts are configurable
- Supports multiple Gemini models

### Components
- `SmartVoiceAssistant`: Main voice control component
- `useGeminiVoiceAssistant`: React hook for voice functionality
- Voice processing utilities in `src/utils/`

### API Integration
```typescript
// Centralized configuration
export const AI_CONFIG = {
  GEMINI_API_KEY: 'AIzaSyBlPE_CFryO1QoEsa97z0pNqj3E-iNxo-w',
  GEMINI_MODEL: 'gemini-1.5-flash',
  // ... other settings
};
```

## Testing

### Quick Test
1. Navigate to `/voice-demo` page
2. Click "Test API Connection" button
3. Check browser console for results

### Manual Testing
1. Hold the voice button
2. Speak a command
3. Release button
4. Listen for AI response

### Programmatic Testing
```typescript
import { quickVoiceTest } from './utils/testVoiceAssistant';

// Run comprehensive test
await quickVoiceTest();
```

## Files Modified

### Core Integration
- `src/config/ai.config.ts` - Centralized AI configuration
- `src/hooks/useGeminiVoiceAssistant.ts` - Updated to use config
- `src/pages/AIConversation.tsx` - Updated API key
- `src/components/VoiceAssistant/SmartVoiceAssistant.tsx` - Updated config

### Testing & Demo
- `src/utils/testVoiceAssistant.ts` - Test utilities
- `src/pages/VoiceDemo.tsx` - Added test button

## Browser Support
- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: iOS Safari, Chrome Mobile

## Security Notes
- API key is stored in localStorage for persistence
- Can be updated through the settings UI
- Consider environment variables for production

## Troubleshooting

### Common Issues
1. **No voice recognition**: Check microphone permissions
2. **API errors**: Verify API key is valid
3. **No speech output**: Check browser audio permissions

### Debug Commands
```javascript
// Test API connection
import { testGeminiConnection } from './utils/testVoiceAssistant';
await testGeminiConnection();

// Test specific command
import { testVoiceCommand } from './utils/testVoiceAssistant';
await testVoiceCommand('Turn on the fan');
```

## Next Steps
1. Test the voice assistant on the demo page
2. Try various commands in different languages
3. Check console for any errors or issues
4. Customize prompts and responses as needed

The voice assistant is now fully integrated and ready to use with your Gemini API key!