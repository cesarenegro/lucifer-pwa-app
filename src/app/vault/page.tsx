"use client";

import { useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { LanguageCode } from "@/locales/dictionaries";

export default function PrivacyVault() {
  const { language, setLanguage, t } = useTranslation();
  const [settings, setSettings] = useState({
    autoBurn: false,
    ghostMode: true,
    haptic: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageCode);
  };

  return (
    <main className="h-full flex flex-col p-4 bg-background overflow-y-auto overflow-x-hidden pb-20">
      <div className="mb-6">
        <h1 className="font-headline text-2xl tracking-wide">{t("vault.title")}</h1>
        <p className="font-label text-xs text-outline mt-1 tracking-widest uppercase">{t("vault.config")}</p>
      </div>

      <div className="space-y-4">
        {/* Toggle Items */}
        <div className="flex items-center justify-between p-4 bg-surface-container-low border-l-2 border-transparent hover:border-surface-container-high transition-all">
          <div>
            <p className="font-headline text-sm text-on-surface uppercase tracking-wide">{t("vault.autoBurn")}</p>
            <p className="font-label text-[10px] mt-1 text-on-surface-variant tracking-wider">{t("vault.destroy")}</p>
          </div>
          <div 
            className={`toggle-switch ${settings.autoBurn ? 'toggle-active' : ''}`} 
            onClick={() => toggle('autoBurn')}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-surface-container-low border-l-2 border-transparent hover:border-surface-container-high transition-all">
          <div>
            <p className="font-headline text-sm text-on-surface uppercase tracking-wide">{t("vault.ghostMode")}</p>
            <p className="font-label text-[10px] mt-1 text-on-surface-variant tracking-wider">{t("vault.hideTyping")}</p>
          </div>
          <div 
            className={`toggle-switch ${settings.ghostMode ? 'toggle-active' : ''}`} 
            onClick={() => toggle('ghostMode')}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-surface-container-low border-l-2 border-transparent hover:border-surface-container-high transition-all">
          <div>
            <p className="font-headline text-sm text-on-surface uppercase tracking-wide">{t("vault.haptic")}</p>
            <p className="font-label text-[10px] mt-1 text-on-surface-variant tracking-wider">{t("vault.physicalConfirm")}</p>
          </div>
          <div 
            className={`toggle-switch ${settings.haptic ? 'toggle-active' : ''}`} 
            onClick={() => toggle('haptic')}
          />
        </div>

        {/* Interface Language */}
        <div className="flex items-center justify-between p-4 bg-surface-container-low border-l-2 border-transparent hover:border-surface-container-high transition-all">
          <div>
            <p className="font-headline text-sm text-on-surface uppercase tracking-wide">{t("vault.lang")}</p>
            <p className="font-label text-[10px] mt-1 text-on-surface-variant tracking-wider">{t("vault.sysTrans")}</p>
          </div>
          <div className="relative">
            <select 
              value={language} 
              onChange={handleLanguageChange}
              className="appearance-none bg-surface-variant text-primary font-headline text-xs px-4 py-2 pr-8 outline-none border border-outline-variant/30 cursor-pointer"
            >
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="SLO">SLO</option>
              <option value="RU">RU</option>
              <option value="DE">DE</option>
              <option value="EN">EN</option>
              <option value="FR">FR</option>
              <option value="ES">ES</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button at the bottom */}
      <div className="mt-auto pt-4">
        <button className="w-full border border-error text-error font-headline text-sm h-14 tracking-widest uppercase hover:bg-error/10 transition-colors">
          {t("vault.burn")}
        </button>
      </div>
    </main>
  );
}
