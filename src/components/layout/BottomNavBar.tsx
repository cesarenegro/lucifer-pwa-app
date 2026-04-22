"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

import { useTranslation } from '@/contexts/LanguageContext';

export default function BottomNavBar() {
  const [showOblivion, setShowOblivion] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();
  const router = useRouter();

  // Do not show on Security Shield (login root)
  if (pathname === '/') return null;

  const handleOblivion = async () => {
    try {
      // Get current user session
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (user) {
        // Attempt to delete profiles from supabase
        await supabase.from('profiles').delete().eq('user_id', user.id);
      }

      // Sign out
      await supabase.auth.signOut();

      // Clear local storage
      localStorage.removeItem("lucifer_profile_id");
      localStorage.removeItem("lucifer_nickname");
      localStorage.removeItem("lucifer_uid");
      localStorage.removeItem("lucifer_profiles");

      setShowOblivion(false);
      router.push('/');
    } catch (error) {
      console.error("Oblivion error:", error);
      // Even if API fails, clear local state
      localStorage.clear();
      router.push('/');
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 z-40 w-full h-[80px] bg-surface flex items-center justify-between px-4">
        {/* Top ghost border */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-outline-variant/30" />
        
        {/* LEFT: Setting */}
        <Link
          href="/vault"
          className={`flex flex-col items-center justify-center w-20 h-full transition-all duration-300 relative ${
            pathname.startsWith('/vault') ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {pathname.startsWith('/vault') && (
            <div className="absolute top-0 w-full h-full bg-surface-container-high/20" />
          )}
          <span className="font-label text-xs tracking-[0.2em] relative z-10">SETTING</span>
          {pathname.startsWith('/vault') && (
            <div className="absolute top-0 w-12 h-[2px] bg-primary shadow-[0_0_8px_rgba(185,200,222,0.8)]" />
          )}
        </Link>

        {/* CENTER: Home */}
        <Link
          href="/home"
          className={`flex flex-col items-center justify-center w-20 h-full transition-all duration-300 relative ${
            pathname.startsWith('/home') ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {pathname.startsWith('/home') && (
            <div className="absolute top-0 w-full h-full bg-surface-container-high/20" />
          )}
          <span className="font-label text-xs tracking-[0.2em] relative z-10">HOME</span>
          {pathname.startsWith('/home') && (
            <div className="absolute top-0 w-12 h-[2px] bg-primary shadow-[0_0_8px_rgba(185,200,222,0.8)]" />
          )}
        </Link>

        {/* RIGHT: Oblivion */}
        <button
          onClick={() => setShowOblivion(true)}
          className="flex flex-col items-center justify-center w-24 h-12 bg-[#c62b38] text-white transition-all duration-300 relative rounded-sm uppercase tracking-widest font-label text-xs"
        >
          OBLIVION
        </button>
      </nav>

      {/* Oblivion Pop-up */}
      {showOblivion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="bg-surface-container border border-[#c62b38]/50 p-6 w-full max-w-sm text-center">
            <h2 className="font-headline text-xl text-[#c62b38] tracking-widest uppercase mb-4">ATTENZIONE</h2>
            <p className="font-label text-sm text-on-surface tracking-wider mb-8 uppercase leading-relaxed">
              cancella tutto, profili e chat definitivamente
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={handleOblivion}
                className="flex-1 bg-[#c62b38] text-white py-3 font-headline text-sm tracking-widest uppercase hover:opacity-80 transition-opacity"
              >
                SI
              </button>
              <button 
                onClick={() => setShowOblivion(false)}
                className="flex-1 border border-outline-variant text-on-surface py-3 font-headline text-sm tracking-widest uppercase hover:bg-surface-variant transition-colors"
              >
                NO
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
