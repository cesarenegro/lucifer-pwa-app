"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dictionaries, LanguageCode } from "@/locales/dictionaries";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("EN");

  useEffect(() => {
    const saved = localStorage.getItem("lucifer_language") as LanguageCode;
    if (saved && dictionaries[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("lucifer_language", lang);
  };

  const t = (key: string): string => {
    const dict = dictionaries[language] || dictionaries["EN"];
    return dict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
