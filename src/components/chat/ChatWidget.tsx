import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useChatRealtime, type ChatMessage } from "./useChatRealtime";
import { useChatSounds } from "./useChatSounds";
import { ChatBubble } from "./ChatBubble";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  contractId: string | null;
  brandColor?: string | null;
}

export function ChatWidget({ contractId, brandColor }: ChatWidgetProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playNotification, playSend } = useChatSounds();
  const openRef = useRef(open);
  openRef.current = open;

  const { messages, loading, sendMessage } = useChatRealtime({
    contractId,
    onNewMessage: (msg: ChatMessage) => {
      if (msg.sender_role === "admin") {
        if (!openRef.current || document.hidden) {
          setUnreadCount((c) => c + 1);
          playNotification();
        } else {
          // Mark as read immediately
          supabase.from("chat_messages").update({ read: true }).eq("id", msg.id).then(() => {});
        }
      }
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Count unread on mount
  useEffect(() => {
    if (!contractId) return;
    supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("contract_id", contractId)
      .eq("sender_role", "admin")
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
        .eq("sender_role", "admin")
        .eq("read", false)
        .then(() => setUnreadCount(0));
    }
  }, [open, contractId, unreadCount]);

  const handleSend = async () => {
    if (!input.trim() || !contractId) return;
    const text = input;
    setInput("");
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
              <div>
                <h3 className="text-primary-foreground font-semibold text-base">Support</h3>
                <p className="text-primary-foreground/70 text-xs">Wir antworten sofort</p>
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
                messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    content={msg.content}
                    senderRole={msg.sender_role}
                    createdAt={msg.created_at}
                    isOwnMessage={msg.sender_role === "user"}
                  />
                ))
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
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
