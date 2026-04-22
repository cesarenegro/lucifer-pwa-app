"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

function DiscoveryProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  
  const [isFound, setIsFound] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  
  // Get handle from query params
  const handle = searchParams.get("handle") || "";
  
  useEffect(() => {
    async function searchIdentity() {
      if (!handle || handle.toUpperCase() === "UNKNOWN") {
        setIsFound(false);
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("nickname", handle)
          .single();
          
        if (data && !error) {
          setIsFound(true);
          setProfileId(data.id);
        } else {
          setIsFound(false);
        }
      } catch (err) {
        console.error("Search error:", err);
        setIsFound(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    searchIdentity();
  }, [handle]);
  
  // Mock fingerprint
  const fingerprintParts = [
    "0x8A9B", "3F1C", "4E2D", "9A7B",
    "2C1D", "5F6E", "8B9A", "0C1D"
  ];

  async function handleInitiateChannel() {
    if (!profileId) return;
    setIsInitiating(true);
    
    try {
      const myId = localStorage.getItem("lucifer_profile_id");
      if (!myId) {
        console.error("No active profile");
        setIsInitiating(false);
        return;
      }

      // Check if node already exists between these two users
      const { data: existingNodes, error: checkError } = await supabase
        .from('nodes')
        .select('id')
        .or(`and(initiator_id.eq.${myId},receiver_id.eq.${profileId}),and(initiator_id.eq.${profileId},receiver_id.eq.${myId})`);

      if (checkError) throw checkError;

      if (existingNodes && existingNodes.length > 0) {
        // Node already exists, just route
        router.push(`/chat/detail?id=${profileId}`);
        return;
      }

      // Insert new node
      const { error: insertError } = await supabase
        .from('nodes')
        .insert([{ initiator_id: myId, receiver_id: profileId }]);

      if (insertError) throw insertError;

      router.push(`/chat/detail?id=${profileId}`);
    } catch (err) {
      console.error("Error initiating channel:", err);
      setIsInitiating(false);
    }
  }

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
          <h1 className="font-headline text-lg tracking-wide uppercase">{t("profile.identitySearch")}</h1>
          <p className="font-label text-[10px] text-outline mt-1 tracking-widest uppercase">{t("profile.networkQuery")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <span className="font-headline text-lg tracking-widest uppercase animate-pulse text-primary">{t("profile.networkQuery")}</span>
          </div>
        ) : isFound ? (
          <div className="flex-1 flex flex-col justify-evenly items-center max-w-sm mx-auto w-full pb-2">
            
            {/* Identity Info */}
            <div className="text-center">
              <div className="w-12 h-12 mx-auto border border-primary/50 bg-primary/5 flex items-center justify-center mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="font-headline text-2xl text-on-surface tracking-widest uppercase">{handle}</h2>
              <p className="font-label text-[10px] text-primary mt-1 tracking-widest uppercase">{t("profile.nodeFound")}</p>
            </div>

            {/* Trust Fingerprint */}
            <div className="w-full bg-surface-container-low py-3 px-4 border-y border-primary/20 relative overflow-hidden group">
              <div className="absolute left-0 top-0 w-1 h-full bg-primary/50" />
              <p className="font-label text-[9px] text-outline text-center tracking-widest uppercase mb-2">{t("profile.trustFingerprint")}</p>
              
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {fingerprintParts.map((part, i) => (
                  <div key={i} className="font-mono text-xs text-on-surface-variant tracking-wider text-center">
                    {part}
                  </div>
                ))}
              </div>
              
              <p className="font-label text-[8px] text-outline-variant text-center mt-3 tracking-widest uppercase">
                {t("profile.verify")}
              </p>
            </div>

            {/* Action */}
            <div className="w-full">
              <button 
                onClick={handleInitiateChannel}
                disabled={isInitiating}
                className="w-full bg-primary/10 border border-primary text-primary font-headline text-sm h-12 tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInitiating ? (
                  <span className="animate-pulse">{t("chat.encrypting") || "INITIATING..."}</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {t("profile.initiate")}
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-error mb-6">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 className="font-headline text-xl text-error tracking-widest uppercase mb-2">{t("profile.nodeNotFound")}</h2>
            <p className="font-label text-xs text-outline tracking-wider max-w-[250px]">
              {t("profile.notExist1")} "{handle}" {t("profile.notExist2")}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DiscoveryProfile() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-background flex items-center justify-center"><p className="text-primary font-headline">LOADING...</p></div>}>
      <DiscoveryProfileContent />
    </Suspense>
  );
}
