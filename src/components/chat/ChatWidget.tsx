import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useChatRealtime, type ChatMessage } from "./useChatRealtime";
import { useChatSounds } from "./useChatSounds";
import { useChatTyping } from "./useChatTyping";
import { ChatBubble, TypingIndicator, DateSeparator, SystemMessage } from "./ChatBubble";
import { AvatarUpload } from "./AvatarUpload";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  contractId: string | null;
  brandColor?: string | null;
}

const isOnline = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(formatter.format(now), 10);
  return hour >= 8 && hour < 19;
};

export function ChatWidget({ contractId, brandColor }: ChatWidgetProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminProfile, setAdminProfile] = useState<{ avatar_url: string | null; display_name: string | null }>({ avatar_url: null, display_name: null });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playNotification, playSend } = useChatSounds();
  const openRef = useRef(open);
  openRef.current = open;

  const { isTyping, sendTyping } = useChatTyping({ contractId, role: "user" });

  const { messages, loading, sendMessage } = useChatRealtime({
    contractId,
    onNewMessage: (msg: ChatMessage) => {
      if (msg.sender_role !== "user") {
        if (!openRef.current || document.hidden) {
          setUnreadCount((c) => c + 1);
          playNotification();
        } else {
          supabase.from("chat_messages").update({ read: true }).eq("id", msg.id).then(() => {});
        }
      }
    },
  });

  // Auto-welcome on first contact
  const welcomeSentRef = useRef(false);
  useEffect(() => {
    if (loading || !contractId || messages.length > 0 || welcomeSentRef.current) return;
    welcomeSentRef.current = true;

    const name = adminProfile.display_name;
    const text = name
      ? `Herzlich willkommen im Livechat! Mein Name ist ${name} und ich bin Ihr persönlicher Ansprechpartner. Wie kann ich Ihnen behilflich sein?`
      : `Herzlich willkommen im Livechat! Ich bin Ihr persönlicher Ansprechpartner. Wie kann ich Ihnen behilflich sein?`;

    sendMessage(text, "admin");
  }, [loading, contractId, messages.length, adminProfile.display_name, sendMessage]);

  // Load admin profile (with sessionStorage cache)
  useEffect(() => {
    const cached = sessionStorage.getItem("admin_chat_profile");
    if (cached) {
      try { setAdminProfile(JSON.parse(cached)); } catch {}
    }

    const loadAdmin = async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1);
      if (!roles || roles.length === 0) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("id", roles[0].user_id)
        .maybeSingle();
      if (profile) {
        const p = { avatar_url: profile.avatar_url, display_name: profile.display_name };
        setAdminProfile(p);
        sessionStorage.setItem("admin_chat_profile", JSON.stringify(p));
      }
    };
    loadAdmin();
  }, []);

  // Auto-scroll bei neuen Nachrichten
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages, loading, isTyping]);

  // Beim Oeffnen sofort ganz unten starten (vor dem Paint)
  useLayoutEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages, loading]);

  // Count unread on mount
  useEffect(() => {
    if (!contractId) return;
    supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("contract_id", contractId)
      .in("sender_role", ["admin", "system"])
      .eq("read", false)
      .then(({ count }) => setUnreadCount(count ?? 0));
  }, [contractId]);

  // Mark all as read when opening
  useEffect(() => {
    if (open && contractId && unreadCount > 0) {
      supabase
        .from("chat_messages")
        .update({ read: true })
        .eq("contract_id", contractId)
        .in("sender_role", ["admin", "system"])
        .eq("read", false)
        .then(() => setUnreadCount(0));
    }
  }, [open, contractId, unreadCount]);

  const handleInputChange = (val: string) => {
    setInput(val);
    sendTyping(val);
  };

  const handleSend = async () => {
    if (!input.trim() || !contractId) return;
    const text = input;
    setInput("");
    sendTyping("");
    playSend();
    await sendMessage(text, "user");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!contractId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="absolute bottom-16 right-0 w-[380px] h-[520px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <AvatarUpload
                    avatarUrl={adminProfile.avatar_url}
                    name={adminProfile.display_name || "Admin"}
                    size={36}
                  />
                  <span className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-primary",
                    isOnline() ? "bg-green-500" : "bg-gray-400"
                  )} />
                </div>
                <div>
                  <h3 className="text-primary-foreground font-semibold text-sm leading-tight">
                    {adminProfile.display_name || "Admin"}
                  </h3>
                  <p className="text-primary-foreground/70 text-xs">Dein Ansprechpartner</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-6">
                  <p>Willkommen! Schreibe uns eine Nachricht und wir helfen dir weiter.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate && <DateSeparator date={msg.created_at} />}
                      {msg.sender_role === "system" ? (
                        <SystemMessage content={msg.content} />
                      ) : (
                        <ChatBubble
                          content={msg.content}
                          senderRole={msg.sender_role}
                          createdAt={msg.created_at}
                          isOwnMessage={msg.sender_role === "user"}
                          avatarUrl={msg.sender_role === "admin" ? adminProfile.avatar_url : undefined}
                          senderName={msg.sender_role === "admin" ? (adminProfile.display_name || "Admin") : undefined}
                        />
                      )}
                    </div>
                  );
                })
              )}
              {isTyping && <TypingIndicator />}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nachricht schreiben..."
                  className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[40px] max-h-[100px]"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={cn(
                    "shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    input.trim()
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105",
          "bg-primary text-primary-foreground",
          !open && unreadCount > 0 && "animate-pulse"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
