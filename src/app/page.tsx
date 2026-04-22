"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SecurityShield() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="h-full w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(72,72,75,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(72,72,75,0.1)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="z-10 flex flex-col items-center space-y-12">
          {/* Main "Scanner" */}
          <div className="relative flex items-center justify-center w-64 h-64">
            {/* Architectural Border - no rounding */}
            <div className="absolute inset-0 border border-outline-variant/40" />
            <div className="absolute w-[calc(100%+16px)] h-[1px] bg-outline-variant/60" />
            <div className="absolute h-[calc(100%+16px)] w-[1px] bg-outline-variant/60" />

            {/* Pulsing Core */}
            <div className={`w-32 h-32 bg-primary transition-all duration-[2000ms] ease-in-out ${pulse ? 'scale-110 opacity-100 cipher-glow' : 'scale-100 opacity-60'}`} />

            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
          </div>

          <div className="flex flex-col items-center text-center space-y-4">
            <h1 className="font-headline text-3xl text-on-surface tracking-tight">IDENTITY REQUIRED</h1>
            <p className="font-label text-xs tracking-[0.3em] text-on-surface-variant uppercase">
              Handshake Protocol // Active
            </p>
          </div>

          <Link href="/onboarding" className="w-full max-w-sm mt-8">
            <button className="w-full h-14 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline text-sm tracking-widest uppercase transition-transform hover:scale-[1.02] active:scale-[0.98]">
              Authenticate
            </button>
          </Link>

        </div>
      </main>
  );
}
