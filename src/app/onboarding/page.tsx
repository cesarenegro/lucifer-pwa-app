"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

export default function Onboarding() {
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation();

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const alias = nickname.trim();
    if (!alias) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Check if we have an existing session
      const { data: sessionData } = await supabase.auth.getSession();
      let user: any = sessionData?.session?.user;

      if (!user) {
        // 2. Anonymous sign in if no session exists
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
        user = authData.user;
      }

      if (user) {
        // 3. Create profile linked to the user
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            nickname: alias
          })
          .select('id, nickname')
          .single();

        if (profileError) {
          if (profileError.code === '23505') { // Unique constraint violation
            throw new Error("Alias already taken. Please choose another.");
          }
          throw profileError;
        }

        // 4. Store locally for fast access
        localStorage.setItem("lucifer_profile_id", profileData.id);
        localStorage.setItem("lucifer_nickname", profileData.nickname);
        
        router.push("/home");
      }
    } catch (err: any) {
      console.error("Identity error:", err);
      setError(err.message || "Failed to establish identity.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-full w-full flex flex-col p-6 relative overflow-hidden bg-background">
      {/* Header */}
      <div className="mb-12 mt-8">
        <h1 className="font-headline text-3xl tracking-wide uppercase text-on-surface">{t("onboarding.establish")}</h1>
        <p className="font-label text-xs text-primary mt-2 tracking-widest uppercase">{t("onboarding.protocolInit")}</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        <div>
          <p className="font-label text-xs text-outline tracking-widest uppercase mb-4">{t("onboarding.chooseAlias")}</p>
          <form onSubmit={handleComplete} className="relative">
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t("onboarding.enterNickname")} 
              autoFocus
              className="w-full bg-surface-container-high h-14 px-4 font-headline text-lg tracking-widest outline-none focus:border-b-2 focus:border-primary text-on-surface placeholder:text-outline-variant transition-all rounded-none border-b-2 border-transparent uppercase"
            />
            {error && (
              <p className="text-red-500 font-label text-[10px] mt-4 tracking-widest uppercase">{error}</p>
            )}
            {nickname.trim() && (
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-12 bg-primary/10 border border-primary text-primary font-headline text-sm h-14 tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="animate-pulse">PROCESSING...</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    {t("onboarding.confirm")}
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="font-label text-[10px] text-outline-variant tracking-wider leading-relaxed">
            {t("onboarding.disclaimer")}
          </p>
        </div>
      </div>
    </main>
  );
}
