import React, { createContext, useContext, useState, useEffect } from 'react';
import { translateToHindi, convertAmountToHindiWords } from '../utils/hindiTranslator';

export type Language = 'hi' | 'en';

interface LanguageContextType {
  language: Language;
  isHindi: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (text: string, fallback?: string) => string;
  autoTranslate: (text: string | null | undefined) => string;
  formatHindiAmountWords: (num: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'hi' || saved === 'en') return saved;
    } catch (e) {
      // fallback
    }
    return 'en'; // default English, toggleable to Hindi
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch (e) {
      // ignore
    }
  };

  const toggleLanguage = () => {
    const next = language === 'hi' ? 'en' : 'hi';
    setLanguage(next);
  };

  const isHindi = language === 'hi';

  // Translate static UI keys or fallbacks
  const t = (text: string, fallback?: string): string => {
    if (!isHindi) return fallback || text;
    return translateToHindi(text);
  };

  // Dynamically auto-translate dynamic customer names, addresses, products, notes
  const autoTranslate = (text: string | null | undefined): string => {
    if (!text) return '';
    if (!isHindi) return text;
    return translateToHindi(text);
  };

  const formatHindiAmountWords = (num: number): string => {
    return convertAmountToHindiWords(num);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        isHindi,
        setLanguage,
        toggleLanguage,
        t,
        autoTranslate,
        formatHindiAmountWords,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
