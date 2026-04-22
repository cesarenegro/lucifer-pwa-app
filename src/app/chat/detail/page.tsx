"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string | number;
  text: string;
  type: "inbound" | "outbound" | "system";
  time: string;
  status: string;
}

function EncryptedChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contactId = searchParams.get("id") || "";
  const { t } = useTranslation();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingDestroy, setIsConfirmingDestroy] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let isMounted = true;
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    async function initChat() {
      if (!contactId) return;
      
      const uid = localStorage.getItem("lucifer_profile_id");
      if (!uid) {
        setIsLoading(false);
        return;
      }
      if (isMounted) setMyId(uid);

      // Find node
      const { data: nodes, error: nodeError } = await supabase
        .from("nodes")
        .select("id")
        .or(`and(initiator_id.eq.${uid},receiver_id.eq.${contactId}),and(initiator_id.eq.${contactId},receiver_id.eq.${uid})`);
        
      if (nodeError || !nodes || nodes.length === 0) {
        console.error("Node not found", nodeError);
        if (isMounted) setIsLoading(false);
        return;
      }
      
      const currentNodeId = nodes[0].id;
      if (isMounted) setNodeId(currentNodeId);

      // Fetch message history
      const { data: msgHistory, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("node_id", currentNodeId)
        .order("created_at", { ascending: true });

      if (!msgError && msgHistory && isMounted) {
        setMessages(msgHistory.map(m => formatMessage(m, uid)));
      }

      // Add system message if chat is empty
      if ((!msgHistory || msgHistory.length === 0) && isMounted) {
        setMessages([{
          id: "sys-1",
          text: t("chat.init") || "SECURE CHANNEL ESTABLISHED",
          type: "system",
          time: new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5),
          status: t("chat.verified") || "VERIFIED"
        }]);
      }

      if (isMounted) setIsLoading(false);

      if (!isMounted) return;

      // Subscribe to real-time messages for this node
      // Use unique channel name per mount to prevent Strict Mode collisions
      const channelName = `chat_${currentNodeId}_${Date.now()}`;
      subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `node_id=eq.${currentNodeId}` },
          (payload) => {
            console.log("Realtime payload received!", payload);
            const newMsg = payload.new;
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, formatMessage(newMsg as any, uid)];
            });
          }
        )
        .subscribe((status, err) => {
          console.log("Realtime subscription status:", status, err || "");
          if (status === "SUBSCRIBED") {
            console.log("Successfully subscribed to messages for node:", currentNodeId);
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            console.error("Realtime subscription failed:", status, err);
          }
        });
    }

    initChat();

    return () => {
      isMounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [contactId, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatMessage = (msg: { id: string | number; sender_id: string; created_at: string; content: string }, uid: string): Message => {
    const isOutbound = msg.sender_id === uid;
    const date = new Date(msg.created_at);
    return {
      id: msg.id,
      text: msg.content,
      type: isOutbound ? "outbound" : "inbound",
      time: date.toLocaleTimeString('en-US', { hour12: false }).substring(0, 5),
      status: isOutbound ? (t("chat.sent") || "SENT") : (t("chat.decrypted") || "DECRYPTED")
    };
  };

  const handleSend = async () => {
    if (!input.trim() || !myId || !nodeId) return;
    
    const content = input.trim();
    setInput("");
    
    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newMsg: Message = { 
      id: tempId, 
      text: content, 
      type: "outbound", 
      time: new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5), 
      status: t("chat.encrypting") || "ENCRYPTING..."
    };
    
    setMessages(prev => [...prev, newMsg]);

    const { data, error } = await supabase
      .from("messages")
      .insert([{ node_id: nodeId, sender_id: myId, content }])
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      showToast(`Database Error: ${error.message}`, "error");
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? formatMessage(data, myId) : m));
    }
  };

  const handleDestroy = async () => {
    if (!isConfirmingDestroy) {
      setIsConfirmingDestroy(true);
      setTimeout(() => setIsConfirmingDestroy(false), 4000);
      return;
    }

    if (!nodeId) {
      showToast("ERROR: No node selected or chat is still loading.", "error");
      return;
    }

    try {
      setIsLoading(true);
      // Attempt to delete messages
      const { error: msgErr } = await supabase.from("messages").delete().eq("node_id", nodeId);
      if (msgErr) {
        console.warn("Could not delete messages from backend:", msgErr);
      }

      // Attempt to delete node
      const { error: nodeErr } = await supabase.from("nodes").delete().eq("id", nodeId);
      if (nodeErr) {
        console.warn("Could not delete node from backend:", nodeErr);
      }

      showToast("CHAT PERMANENTLY DESTROYED.", "success");
      
      // Navigate away immediately
      setTimeout(() => {
        router.refresh();
        router.push("/home");
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      console.error("Exception destroying node:", err);
      showToast(`Exception: ${err.message}`, "error");
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-background relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 border font-label text-xs tracking-widest uppercase shadow-lg transition-all animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'error' 
            ? 'bg-error/10 text-error border-error/50 shadow-[0_0_15px_rgba(var(--color-error),0.2)]' 
            : 'bg-[#B5121B]/20 text-[#B5121B] border-[#B5121B]/50 shadow-[0_0_15px_rgba(181,18,27,0.2)]'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-surface-container-low border-b border-outline-variant/30 shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/home">
            <span className="font-label text-primary text-xs tracking-widest uppercase">{t("chat.back") || "ABORT"}</span>
          </Link>
          <div className="w-[1px] h-4 bg-outline-variant/50" />
          <div>
            <h2 className="font-headline text-sm tracking-wide text-on-surface">NODE {contactId ? contactId.substring(0,6) : "UNKNOWN"}</h2>
            <p className="font-label text-[10px] text-primary-dim tracking-widest mt-0.5">{t("chat.secureConn") || "SECURE CONNECTION"}</p>
          </div>
        </div>
        
        <button 
          onClick={handleDestroy}
          disabled={isLoading || (!nodeId && isConfirmingDestroy)}
          className={`px-4 py-2 font-label text-xs tracking-[0.2em] uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isConfirmingDestroy 
              ? "bg-[#690005] text-[#ffdad6] border border-[#ffdad6] animate-pulse shadow-[0_0_25px_rgba(181,18,27,0.8)]" 
              : "bg-[#B5121B] text-white hover:bg-[#93000f] shadow-[0_0_15px_rgba(181,18,27,0.5)]"
          }`}
        >
          {isLoading ? "DESTROYING..." : (isConfirmingDestroy ? "CLICK TO CONFIRM" : "DESTROY")}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <span className="font-label text-primary animate-pulse tracking-widest">{t("chat.encrypting") || "DECRYPTING NODE..."}</span>
          </div>
        ) : messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.type === 'outbound' ? 'items-end' : 'items-start'}`}>
            <div className={`p-4 max-w-[85%] 
              ${msg.type === 'system' ? 'bg-surface-container-high w-full border-t border-b border-outline-variant/40 text-center items-center' : ''}
              ${msg.type === 'inbound' ? 'bg-surface-container-low border-b-2 border-primary' : ''}
              ${msg.type === 'outbound' ? 'bg-secondary-container border-b-2 border-primary' : ''}
            `}>
              <p className={`font-body text-sm ${msg.type === 'system' ? 'font-label text-xs tracking-widest text-outline uppercase' : 'text-on-surface'}`} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.text}
              </p>
            </div>
            {msg.type !== 'system' && (
              <div className={`mt-2 flex items-center space-x-2 ${msg.type === 'outbound' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <span className="font-label text-[10px] text-outline tracking-wider">{msg.time}</span>
                <span className="font-label text-[10px] text-primary-dim tracking-widest uppercase">{msg.status}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface border-t border-outline-variant/30 shrink-0">
        <div className="flex items-center space-x-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t("chat.encryptMsg") || "ENCRYPT MESSAGE..."} 
            disabled={isLoading || !nodeId}
            className="flex-1 bg-surface-container-low h-12 px-4 font-label text-xs outline-none focus:ghost-border text-on-surface placeholder:text-outline-variant transition-all rounded-none uppercase disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !nodeId || !input.trim()}
            className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center hover:bg-primary-dim transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-label text-xs tracking-widest leading-none">&gt;</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function EncryptedChat() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-background flex items-center justify-center"><p className="text-primary font-headline">LOADING...</p></div>}>
      <EncryptedChatContent />
    </Suspense>
  );
}
