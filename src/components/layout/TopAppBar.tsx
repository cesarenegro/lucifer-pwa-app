"use client";

import React from 'react';
import { useTranslation } from "@/contexts/LanguageContext";

export default function TopAppBar() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-50 w-full h-[60px] bg-background/80 backdrop-blur-[20px] flex items-center justify-between px-4">
      {/* Ghost border bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-outline-variant/20" />
      
      <div className="flex items-center space-x-3">
        {/* Status indicator */}
        <div className="w-2 h-2 bg-primary rounded-none shadow-[0_0_10px_rgba(185,200,222,0.8)]" />
        <span className="font-label text-[10px] tracking-widest text-primary-dim uppercase">
          NEXUS {t("home.active")}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Connection Hash */}
        <span className="font-label text-[10px] tracking-widest text-outline">
          0X4C...8F2
        </span>
      </div>
    </header>
  );
}
