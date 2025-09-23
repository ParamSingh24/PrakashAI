import { useCallback, useState } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export type SupportedLanguage = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  flag: string;
  locale: string;
  voicePattern: string[];
}

const supportedLanguages: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    locale: 'en-US',
    voicePattern: ['en-', 'english']
  },
  {
    code: 'hi',
    name: 'हिंदी',
    flag: '🇮🇳',
    locale: 'hi-IN',
    voicePattern: ['hi-', 'hindi', 'devanagari']
  },
  {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    locale: 'es-ES',
    voicePattern: ['es-', 'spanish', 'español']
  },
  {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    locale: 'fr-FR',
    voicePattern: ['fr-', 'french', 'français']
  },
  {
    code: 'de',
    name: 'Deutsch',
    flag: '🇩🇪',
    locale: 'de-DE',
    voicePattern: ['de-', 'german', 'deutsch']
  },
  {
    code: 'ja',
    name: '日本語',
    flag: '🇯🇵',
    locale: 'ja-JP',
    voicePattern: ['ja-', 'japanese', '日本']
  },
  {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳',
    locale: 'zh-CN',
    voicePattern: ['zh-', 'chinese', '中文', 'mandarin']
  }
];

// Translations for common dashboard elements
const translations = {
  en: {
    welcomeBack: (name: string) => `Welcome back, ${name}!`,
    energyOverview: "Here's your energy overview",
    totalConsumption: "Total energy consumption",
    monthlySavings: "Monthly savings",
    currentUsage: "Current usage",
    recommendations: "Energy saving recommendations",
    insights: "AI insights for your energy usage"
  },
  hi: {
    welcomeBack: (name: string) => `आपका स्वागत है, ${name}!`,
    energyOverview: "यहाँ आपकी ऊर्जा की जानकारी है",
    totalConsumption: "कुल ऊर्जा खपत",
    monthlySavings: "मासिक बचत",
    currentUsage: "वर्तमान उपयोग",
    recommendations: "ऊर्जा बचत के सुझाव",
    insights: "आपकी ऊर्जा उपयोग के लिए एआई सुझाव"
  },
  es: {
    welcomeBack: (name: string) => `¡Bienvenido de vuelta, ${name}!`,
    energyOverview: "Aquí está tu resumen de energía",
    totalConsumption: "Consumo total de energía",
    monthlySavings: "Ahorros mensuales",
    currentUsage: "Uso actual",
    recommendations: "Recomendaciones de ahorro de energía",
    insights: "Información de IA para tu uso de energía"
  },
  fr: {
    welcomeBack: (name: string) => `Bon retour, ${name}!`,
    energyOverview: "Voici votre aperçu énergétique",
    totalConsumption: "Consommation totale d'énergie",
    monthlySavings: "Économies mensuelles",
    currentUsage: "Utilisation actuelle",
    recommendations: "Recommandations d'économie d'énergie",
    insights: "Informations IA pour votre utilisation d'énergie"
  },
  de: {
    welcomeBack: (name: string) => `Willkommen zurück, ${name}!`,
    energyOverview: "Hier ist Ihre Energieübersicht",
    totalConsumption: "Gesamter Energieverbrauch",
    monthlySavings: "Monatliche Einsparungen",
    currentUsage: "Aktuelle Nutzung",
    recommendations: "Energiespar-Empfehlungen",
    insights: "KI-Einblicke für Ihren Energieverbrauch"
  },
  ja: {
    welcomeBack: (name: string) => `おかえりなさい、${name}さん！`,
    energyOverview: "エネルギーの概要をご覧ください",
    totalConsumption: "総エネルギー消費量",
    monthlySavings: "月間節約額",
    currentUsage: "現在の使用量",
    recommendations: "省エネのおすすめ",
    insights: "エネルギー使用に関するAIの洞察"
  },
  zh: {
    welcomeBack: (name: string) => `欢迎回来，${name}！`,
    energyOverview: "这是您的能源概览",
    totalConsumption: "总能源消耗",
    monthlySavings: "月度节省",
    currentUsage: "当前使用量",
    recommendations: "节能建议",
    insights: "您能源使用的AI见解"
  }
};

export const useMultiLanguageVoice = () => {
  const { speak, textToSpeech } = useAccessibility();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');

  const getAvailableVoices = useCallback((language: SupportedLanguage) => {
    const langConfig = supportedLanguages.find(lang => lang.code === language);
    if (!langConfig) return [];

    return textToSpeech.voices.filter(voice => {
      const voiceName = voice.name.toLowerCase();
      const voiceLang = voice.lang.toLowerCase();
      
      return langConfig.voicePattern.some(pattern => 
        voiceName.includes(pattern.toLowerCase()) || 
        voiceLang.includes(pattern.toLowerCase())
      );
    });
  }, [textToSpeech.voices]);

  const speakInLanguage = useCallback((text: string, language?: SupportedLanguage) => {
    const targetLang = language || selectedLanguage;
    const langConfig = supportedLanguages.find(lang => lang.code === targetLang);
    
    if (!langConfig) {
      speak(text);
      return;
    }

    // Create utterance with specific language settings
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langConfig.locale;
      
      // Try to find the best voice for this language
      const availableVoices = getAvailableVoices(targetLang);
      if (availableVoices.length > 0) {
        utterance.voice = availableVoices[0];
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  }, [selectedLanguage, getAvailableVoices, speak]);

  const getTranslation = useCallback((key: keyof typeof translations.en, userName?: string) => {
    const langTranslations = translations[selectedLanguage] || translations.en;
    const translation = langTranslations[key];
    
    if (typeof translation === 'function' && userName) {
      return translation(userName);
    }
    return translation;
  }, [selectedLanguage]);

  const announceWelcome = useCallback((userName: string) => {
    const welcomeText = getTranslation('welcomeBack', userName) as string;
    const overviewText = getTranslation('energyOverview') as string;
    speakInLanguage(`${welcomeText} ${overviewText}`);
  }, [getTranslation, speakInLanguage]);

  const announceElement = useCallback((elementType: keyof typeof translations.en, value?: string | number) => {
    const elementText = getTranslation(elementType) as string;
    const announcement = value ? `${elementText}: ${value}` : elementText;
    speakInLanguage(announcement);
  }, [getTranslation, speakInLanguage]);

  return {
    selectedLanguage,
    setSelectedLanguage,
    supportedLanguages,
    speakInLanguage,
    getTranslation,
    announceWelcome,
    announceElement,
    getAvailableVoices
  };
};
