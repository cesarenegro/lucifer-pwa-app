"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Discovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [identity, setIdentity] = useState("007");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [handleToShare, setHandleToShare] = useState("");
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const savedName = localStorage.getItem("lucifer_nickname");
    if (savedName) setIdentity(savedName);
    
    const fetchProfiles = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id);
        if (data && !error) {
          setProfiles(data);
        }
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (!showScanner) return;

    let scanner: Html5QrcodeScanner | null = null;
    let isMounted = true;

    // Small delay to allow DOM to settle and bypass immediate unmount/remount in React Strict Mode
    const initTimer = setTimeout(() => {
      if (!isMounted) return;
      try {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );
        
        scanner.render(
          (decodedText) => {
            // Success
            if (scanner) {
              scanner.clear().catch(console.error);
            }
            setShowScanner(false);
            router.push(`/discovery/profile?handle=${encodeURIComponent(decodedText.trim())}`);
          },
          (error) => {
            // Ignore scanning errors, occurs on empty frames
          }
        );
      } catch (e) {
        console.error("Scanner init error:", e);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [showScanner, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discovery/profile?handle=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const openShareModal = (handle: string) => {
    setHandleToShare(handle);
    setShowShareModal(true);
  };

  const handleShareNearby = async () => {
    const shareData = {
      title: 'Lucifer Identity',
      text: `Connect with me on Lucifer. My identity handle is: ${handleToShare}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(handleToShare);
      alert("Handle copied to clipboard!");
    }
    setShowShareModal(false);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Connect with me on Lucifer. My identity handle is: ${handleToShare}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareModal(false);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`Connect with me on Lucifer. My identity handle is: ${handleToShare}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${text}`, '_blank');
    setShowShareModal(false);
  };

  const handleSwitchProfile = (p: any) => {
    localStorage.setItem("lucifer_profile_id", p.id);
    localStorage.setItem("lucifer_nickname", p.nickname);
    setIdentity(p.nickname);
  };

  return (
    <main className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-surface-variant/30">
        <button 
          onClick={() => router.back()}
          className="mr-4 text-outline hover:text-on-surface transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="font-headline text-lg tracking-wide uppercase">{t("discovery.addNode")}</h1>
          <p className="font-label text-[10px] text-primary mt-1 tracking-widest uppercase">{t("discovery.network")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        
        {/* Identity section */}
        <div className="bg-surface-container-low p-4 border border-surface-variant/30">
          <div className="flex justify-between items-center mb-4">
            <p className="font-label text-xs text-outline tracking-widest uppercase">{t("discovery.yourIdentity")}</p>
            <button 
              onClick={() => router.push("/onboarding")}
              className="text-primary font-label text-[10px] tracking-widest uppercase flex items-center gap-1 hover:text-primary/80"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14m-7-7h14" />
              </svg>
              NEW
            </button>
          </div>
          
          <div className="space-y-2">
            {profiles.length > 0 ? profiles.map(p => (
              <div 
                key={p.id} 
                className={`flex justify-between items-center p-3 border ${p.nickname === identity ? 'border-primary bg-primary/5' : 'border-surface-variant/30 hover:border-outline-variant/50 cursor-pointer transition-colors'}`}
                onClick={() => p.nickname !== identity && handleSwitchProfile(p)}
              >
                <div>
                  <p className={`font-headline text-lg tracking-widest ${p.nickname === identity ? 'text-primary' : 'text-on-surface'}`}>
                    {p.nickname}
                  </p>
                  {p.nickname === identity && (
                    <p className="font-label text-[10px] text-outline mt-1 tracking-wider">{t("discovery.share")}</p>
                  )}
                </div>
                {p.nickname === identity ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); openShareModal(p.nickname); }}
                    className="text-primary font-label text-xs tracking-widest uppercase hover:text-primary/80 px-2 py-1"
                  >
                    {t("discovery.shareBtn")}
                  </button>
                ) : (
                  <span className="text-outline font-label text-[10px] tracking-widest uppercase px-2 hover:text-on-surface">SWITCH</span>
                )}
              </div>
            )) : (
              // Fallback if no profiles array exists
              <div className="flex justify-between items-end p-3 border border-primary bg-primary/5">
                <div>
                  <p className="font-headline text-lg text-primary tracking-widest">{identity}</p>
                  <p className="font-label text-[10px] text-outline mt-1 tracking-wider">{t("discovery.share")}</p>
                </div>
                <button 
                  onClick={() => openShareModal(identity)}
                  className="text-primary font-label text-xs tracking-widest uppercase hover:text-primary/80"
                >
                  {t("discovery.shareBtn")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search section */}
        <div>
          <p className="font-label text-xs text-outline tracking-widest uppercase mb-4">{t("discovery.searchIdentity")}</p>
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("discovery.enterHandle")} 
              className="w-full bg-surface-container-high h-14 pl-12 pr-4 font-label text-sm outline-none focus:border-b-2 focus:border-primary text-on-surface placeholder:text-outline-variant transition-all rounded-none border-b-2 border-transparent"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
            </div>
            {searchQuery && (
              <button 
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-headline text-xs tracking-widest uppercase"
              >
                {t("discovery.find")}
              </button>
            )}
          </form>
        </div>

        {/* Scanner section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-label text-xs text-outline tracking-widest uppercase">{t("discovery.physical")}</p>
            <div className="h-[1px] flex-1 bg-surface-variant/30 ml-4"></div>
          </div>
          
          <button 
            onClick={() => setShowScanner(true)}
            className="w-full h-32 border border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center group"
          >
            <svg className="text-outline group-hover:text-primary transition-colors mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span className="font-headline text-sm tracking-widest text-on-surface group-hover:text-primary uppercase">{t("discovery.scanQr")}</span>
          </button>
        </div>

      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="bg-surface-container border border-primary/30 p-6 w-full max-w-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-headline text-lg tracking-widest text-primary uppercase">SCAN IDENTITY</h2>
                <p className="font-label text-[10px] text-outline mt-1 tracking-widest uppercase">Point camera at QR code</p>
              </div>
              <button 
                onClick={() => setShowScanner(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div id="qr-reader" className="w-full overflow-hidden border border-surface-variant/50"></div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container border border-surface-variant/30 p-6 w-full max-w-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-headline text-lg tracking-widest text-on-surface uppercase">CONDIVIDI</h2>
                <p className="font-label text-[10px] text-primary mt-1 tracking-widest uppercase">Select Network</p>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleShareNearby}
                className="w-full flex items-center justify-between p-4 border border-surface-variant/30 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <span className="font-headline text-sm tracking-widest text-on-surface group-hover:text-primary uppercase">Nearby / AirDrop</span>
                <svg className="text-outline group-hover:text-primary transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button 
                onClick={handleShareWhatsApp}
                className="w-full flex items-center justify-between p-4 border border-surface-variant/30 hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all group"
              >
                <span className="font-headline text-sm tracking-widest text-on-surface group-hover:text-[#25D366] uppercase">WhatsApp</span>
                <svg className="text-outline group-hover:text-[#25D366] transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <button 
                onClick={handleShareTelegram}
                className="w-full flex items-center justify-between p-4 border border-surface-variant/30 hover:border-[#0088cc] hover:bg-[#0088cc]/5 transition-all group"
              >
                <span className="font-headline text-sm tracking-widest text-on-surface group-hover:text-[#0088cc] uppercase">Telegram</span>
                <svg className="text-outline group-hover:text-[#0088cc] transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
