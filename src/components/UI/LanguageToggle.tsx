import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiLanguageVoice, SupportedLanguage } from '../../hooks/useMultiLanguageVoice';
import { Icon } from './Icon';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { selectedLanguage, setSelectedLanguage, supportedLanguages, getAvailableVoices } = useMultiLanguageVoice();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = supportedLanguages.find(lang => lang.code === selectedLanguage);

  const handleLanguageChange = (language: SupportedLanguage) => {
    setSelectedLanguage(language);
    setIsOpen(false);
    
    // Test the voice in the selected language
    const testText = supportedLanguages.find(lang => lang.code === language)?.name || 'Hello';
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(testText);
      const langConfig = supportedLanguages.find(lang => lang.code === language);
      if (langConfig) {
        utterance.lang = langConfig.locale;
        const voices = getAvailableVoices(language);
        if (voices.length > 0) {
          utterance.voice = voices[0];
        }
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-dark-surface/50 hover:bg-dark-surface/70 border border-dark-surface/50 rounded-lg transition-colors"
        aria-label="Select language for read aloud"
        title="Language for Read Aloud"
      >
        <span className="text-lg">{currentLanguage?.flag}</span>
        <span className="text-sm font-medium text-dark-text">{currentLanguage?.name}</span>
        <Icon 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={16} 
          className="text-dark-textSecondary" 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 bg-dark-surface border border-dark-surface/50 rounded-lg shadow-lg z-50 min-w-[200px]"
          >
            <div className="p-2">
              <div className="text-xs text-dark-textSecondary mb-2 px-2">
                Read Aloud Language
              </div>
              {supportedLanguages.map((language) => {
                const availableVoices = getAvailableVoices(language.code);
                const isSelected = selectedLanguage === language.code;
                
                return (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                      isSelected 
                        ? 'bg-primary/20 text-primary' 
                        : 'hover:bg-dark-surface/50 text-dark-text'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{language.flag}</span>
                      <span className="text-sm font-medium">{language.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {availableVoices.length > 0 && (
                        <span className="text-xs text-secondary">
                          {availableVoices.length} voice{availableVoices.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {isSelected && (
                        <Icon name="check" size={14} className="text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="border-t border-dark-surface/50 p-2">
              <div className="text-xs text-dark-textSecondary px-2">
                💡 Click any amount or heading to hear it in the selected language
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
