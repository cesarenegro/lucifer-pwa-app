"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

export default function SecureInbox() {
  const [search, setSearch] = useState("");
  const [nodes, setNodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchNodes() {
      try {
        const uid = localStorage.getItem("lucifer_profile_id");
        if (!uid) {
          setIsLoading(false);
          return;
        }

        // Fetch nodes where user is either initiator or receiver
        const { data, error } = await supabase
          .from('nodes')
          .select(`
            id,
            status,
            initiator:initiator_id (id, nickname),
            receiver:receiver_id (id, nickname)
          `)
          .or(`initiator_id.eq.${uid},receiver_id.eq.${uid}`);

        if (error) throw error;

        if (data) {
          const formattedNodes = data.map((node: any) => {
            const isInitiator = node.initiator.id === uid;
            const contact = isInitiator ? node.receiver : node.initiator;
            return {
              id: contact.id, // For routing to chat/detail
              node_id: node.id,
              hash: contact.nickname,
              status: node.status === 'active' ? 'ACTIVE' : 'DORMANT',
              unread: false, // Will be implemented with messages
              lastPing: 'just now'
            };
          });
          setNodes(formattedNodes);
        }
      } catch (err) {
        console.error("Error fetching nodes:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNodes();
  }, []);

  return (
    <main className="flex-1 flex flex-col p-4 bg-background">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-headline text-2xl tracking-wide">{t("home.secureChannels")}</h1>
          <p className="font-label text-xs text-outline mt-1 tracking-widest uppercase">{t("home.selectNode")}</p>
        </div>
        <Link href="/discovery" className="font-headline text-primary text-sm tracking-widest uppercase hover:text-primary/80 transition-colors">
          {t("home.addNode") || "NEW NODE"}
        </Link>
      </div>

      <div className="mb-6 relative">
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("home.searchHash")} 
          className="w-full bg-surface-container-low h-12 px-4 font-label text-sm outline-none focus:ghost-border text-on-surface placeholder:text-outline-variant transition-all rounded-none"
        />
      </div>

      <div className="flex flex-col space-y-4">
        {isLoading ? (
          <div className="text-center p-8 text-primary font-label text-xs tracking-widest uppercase animate-pulse">
            LOADING SECURE CHANNELS...
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 mt-10 border border-dashed border-outline-variant/50">
            <div className="text-outline-variant font-label text-xs tracking-widest uppercase mb-6 text-center">
              NO ACTIVE CHANNELS
            </div>
            <Link 
              href="/discovery" 
              className="bg-primary/10 text-primary border border-primary/50 px-6 py-3 font-headline text-sm tracking-widest uppercase hover:bg-primary/20 transition-all flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14m-7-7h14" strokeLinecap="round"/>
              </svg>
              CONNECT WITH IDENTITY
            </Link>
          </div>
        ) : nodes.filter(n => n.hash.toLowerCase().includes(search.toLowerCase())).map(node => (
          <Link key={node.node_id} href={`/chat/detail?id=${node.id}`}>
            <div className="relative w-full bg-surface-container-high hover:bg-surface-variant p-4 transition-colors cursor-pointer group flex items-center justify-between">
              {node.unread && (
                <div className="absolute left-0 top-0 h-full w-1 bg-primary glow-line" />
              )}
              
              <div>
                <p className="font-label text-sm tracking-wider text-on-surface">
                  {node.hash}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className={`w-1.5 h-1.5 ${node.status === 'ACTIVE' ? 'bg-primary' : 'bg-outline-variant'}`} />
                  <span className="font-label text-[10px] text-outline tracking-widest">{node.status === 'ACTIVE' ? t("home.active") : t("home.dormant")}</span>
                </div>
              </div>

              <div className="text-right">
                <p className="font-label text-[10px] text-outline tracking-wider">{node.lastPing}</p>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-label text-primary text-xs tracking-widest uppercase">{t("home.enter")}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Floating Action Button for New Message */}
      <Link href="/discovery" className="absolute bottom-24 right-6 w-14 h-14 bg-primary text-on-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] hover:bg-primary-dim transition-all z-50 rounded-full">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14m-7-7h14" strokeLinecap="round"/>
        </svg>
      </Link>
    </main>
  );
}
