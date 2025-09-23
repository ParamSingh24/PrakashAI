import { useCallback, useState, useRef } from 'react';
import { useMultiLanguageVoice, SupportedLanguage } from './useMultiLanguageVoice';


export const useChatterboxTTS = () => {
  const { selectedLanguage, getAvailableVoices } = useMultiLanguageVoice();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Language mapping for Chatterbox model
  const languageMapping: Record<SupportedLanguage, string> = {
    'en': 'en-US',
    'hi': 'hi-IN',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'ja': 'ja-JP',
    'zh': 'zh-CN'
  };


  const translateContent = useCallback((content: string, language: SupportedLanguage): string => {
    // Basic translation mapping for common dashboard terms
    const translations: Record<SupportedLanguage, Record<string, string>> = {
      'en': {
        'Total energy consumption': 'Total energy consumption',
        'Monthly savings': 'Monthly savings',
        'Current usage': 'Current usage',
        'Energy efficiency': 'Energy efficiency',
        'Power consumption by appliances': 'Power consumption by appliances',
        'Room wise energy consumption': 'Room wise energy consumption',
        'AI insights and recommendations': 'AI insights and recommendations',
        'Savings analysis': 'Savings analysis',
        'rupees': 'rupees',
        'percent': 'percent',
        'increased': 'increased',
        'decreased': 'decreased'
      },
      'hi': {
        'Total energy consumption': 'कुल ऊर्जा खपत',
        'Monthly savings': 'मासिक बचत',
        'Current usage': 'वर्तमान उपयोग',
        'Energy efficiency': 'ऊर्जा दक्षता',
        'Power consumption by appliances': 'उपकरणों द्वारा बिजली की खपत',
        'Room wise energy consumption': 'कमरे के अनुसार ऊर्जा खपत',
        'AI insights and recommendations': 'एआई अंतर्दृष्टि और सुझाव',
        'Savings analysis': 'बचत विश्लेषण',
        'rupees': 'रुपये',
        'percent': 'प्रतिशत',
        'increased': 'बढ़ा है',
        'decreased': 'घटा है'
      },
      'es': {
        'Total energy consumption': 'Consumo total de energía',
        'Monthly savings': 'Ahorros mensuales',
        'Current usage': 'Uso actual',
        'Energy efficiency': 'Eficiencia energética',
        'Power consumption by appliances': 'Consumo de energía por electrodomésticos',
        'Room wise energy consumption': 'Consumo de energía por habitación',
        'AI insights and recommendations': 'Información y recomendaciones de IA',
        'Savings analysis': 'Análisis de ahorros',
        'rupees': 'rupias',
        'percent': 'por ciento',
        'increased': 'aumentado',
        'decreased': 'disminuido'
      },
      'fr': {
        'Total energy consumption': 'Consommation totale d\'énergie',
        'Monthly savings': 'Économies mensuelles',
        'Current usage': 'Utilisation actuelle',
        'Energy efficiency': 'Efficacité énergétique',
        'Power consumption by appliances': 'Consommation d\'énergie par appareils',
        'Room wise energy consumption': 'Consommation d\'énergie par pièce',
        'AI insights and recommendations': 'Informations et recommandations IA',
        'Savings analysis': 'Analyse des économies',
        'rupees': 'roupies',
        'percent': 'pour cent',
        'increased': 'augmenté',
        'decreased': 'diminué'
      },
      'de': {
        'Total energy consumption': 'Gesamter Energieverbrauch',
        'Monthly savings': 'Monatliche Einsparungen',
        'Current usage': 'Aktuelle Nutzung',
        'Energy efficiency': 'Energieeffizienz',
        'Power consumption by appliances': 'Stromverbrauch nach Geräten',
        'Room wise energy consumption': 'Energieverbrauch nach Räumen',
        'AI insights and recommendations': 'KI-Einblicke und Empfehlungen',
        'Savings analysis': 'Einsparungsanalyse',
        'rupees': 'Rupien',
        'percent': 'Prozent',
        'increased': 'gestiegen',
        'decreased': 'gesunken'
      },
      'ja': {
        'Total energy consumption': '総エネルギー消費量',
        'Monthly savings': '月間節約額',
        'Current usage': '現在の使用量',
        'Energy efficiency': 'エネルギー効率',
        'Power consumption by appliances': '家電製品別消費電力',
        'Room wise energy consumption': '部屋別エネルギー消費量',
        'AI insights and recommendations': 'AIの洞察と推奨事項',
        'Savings analysis': '節約分析',
        'rupees': 'ルピー',
        'percent': 'パーセント',
        'increased': '増加しました',
        'decreased': '減少しました'
      },
      'zh': {
        'Total energy consumption': '总能源消耗',
        'Monthly savings': '月度节省',
        'Current usage': '当前使用量',
        'Energy efficiency': '能源效率',
        'Power consumption by appliances': '家电能耗',
        'Room wise energy consumption': '按房间分类的能源消耗',
        'AI insights and recommendations': 'AI见解和建议',
        'Savings analysis': '节省分析',
        'rupees': '卢比',
        'percent': '百分比',
        'increased': '增加了',
        'decreased': '减少了'
      }
    };

    let translatedContent = content;
    const langTranslations = translations[language] || translations['en'];
    
    // Replace common terms with translations
    Object.entries(langTranslations).forEach(([english, translated]) => {
      const regex = new RegExp(english, 'gi');
      translatedContent = translatedContent.replace(regex, translated);
    });

    return translatedContent;
  }, []);

  const speakWithChatterbox = useCallback(async (text: string, language?: SupportedLanguage) => {
    const targetLanguage = language || selectedLanguage;
    const translatedText = translateContent(text, targetLanguage);
    
    setIsLoading(true);
    
    try {
      // For now, we'll use the Web Speech API with enhanced language support
      // In a real implementation, you would call the Chatterbox API here
      
      if (window.speechSynthesis) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(translatedText);
        utterance.lang = languageMapping[targetLanguage];
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to find the best voice for the language
        const voices = window.speechSynthesis.getVoices();
        const targetVoice = voices.find(voice => 
          voice.lang.toLowerCase().includes(targetLanguage) ||
          voice.name.toLowerCase().includes(targetLanguage)
        );
        
        if (targetVoice) {
          utterance.voice = targetVoice;
        }
        
        utterance.onstart = () => {
          setIsPlaying(true);
          setIsLoading(false);
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        utterance.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
        };
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Chatterbox TTS error:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [selectedLanguage, translateContent, languageMapping]);

  const speakChunked = useCallback(async (content: string, language?: SupportedLanguage) => {
    const targetLanguage = language || selectedLanguage;
    
    console.log('Chatterbox TTS - Target Language:', targetLanguage);
    console.log('Chatterbox TTS - Selected Language from hook:', selectedLanguage);
    
    // Clean content and handle undefined values
    const cleanContent = content
      .replace(/undefined/g, '0')
      .replace(/null/g, '0')
      .replace(/NaN/g, '0')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!cleanContent) {
      console.warn('No content to speak');
      return;
    }
    
    setIsLoading(true);
    setIsPlaying(true);
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Wait for voices to be loaded
      await new Promise<void>((resolve) => {
        if (window.speechSynthesis.getVoices().length > 0) {
          resolve();
        } else {
          window.speechSynthesis.onvoiceschanged = () => resolve();
        }
      });
      
      // Split content into manageable chunks
      const sentences = cleanContent.match(/[^.!?]+[.!?]+/g) || [cleanContent];
      const chunks: string[] = [];
      let currentChunk = '';
      
      sentences.forEach(sentence => {
        if ((currentChunk + sentence).length > 200) {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      });
      
      if (currentChunk) chunks.push(currentChunk.trim());
      
      // Get the best voice for the target language using multi-language voice system
      const availableVoices = getAvailableVoices(targetLanguage);
      let targetVoice = null;
      
      console.log('Available voices for', targetLanguage, ':', availableVoices?.length || 0);
      
      if (availableVoices && availableVoices.length > 0) {
        targetVoice = availableVoices[0];
        console.log('Selected voice:', targetVoice.name, targetVoice.lang);
      } else {
        // Fallback to system voice matching
        const voices = window.speechSynthesis.getVoices();
        targetVoice = voices.find(voice => {
          const voiceLang = voice.lang.toLowerCase();
          const mappedLang = languageMapping[targetLanguage].toLowerCase();
          return voiceLang === mappedLang || voiceLang.startsWith(targetLanguage);
        }) || voices.find(voice => voice.lang.startsWith('en'));
        console.log('Fallback voice:', targetVoice?.name, targetVoice?.lang);
      }
      
      // Speak chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        await new Promise<void>((resolve) => {
          const translatedChunk = translateContent(chunks[i], targetLanguage);
          const utterance = new SpeechSynthesisUtterance(translatedChunk);
          
          utterance.lang = languageMapping[targetLanguage];
          utterance.rate = 0.85;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          if (targetVoice) {
            utterance.voice = targetVoice;
          }
          
          console.log('Speaking chunk', i + 1, 'in language:', utterance.lang, 'with voice:', utterance.voice?.name);
          
          utterance.onstart = () => {
            if (i === 0) setIsLoading(false);
          };
          
          utterance.onend = () => resolve();
          utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            resolve();
          };
          
          window.speechSynthesis.speak(utterance);
        });
        
        // Small pause between chunks
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      console.error('Chatterbox TTS chunked speech error:', error);
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [selectedLanguage, translateContent, languageMapping, getAvailableVoices]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  return {
    speakWithChatterbox,
    speakChunked,
    stopSpeaking,
    isLoading,
    isPlaying,
    selectedLanguage,
    translateContent
  };
};
