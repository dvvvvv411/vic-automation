import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  contract_id: string;
  sender_role: "admin" | "user";
  content: string;
  created_at: string;
  read: boolean;
}

interface UseChatRealtimeOptions {
  contractId?: string | null;
  onNewMessage?: (msg: ChatMessage) => void;
}

export function useChatRealtime({ contractId, onNewMessage }: UseChatRealtimeOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  // Load initial messages
  useEffect(() => {
    if (!contractId) { setLoading(false); return; }

    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: true })
        .limit(50);
      setMessages((data as ChatMessage[]) ?? []);
      setLoading(false);
    };
    load();
  }, [contractId]);

  // Realtime subscription
  useEffect(() => {
    if (!contractId) return;

    const channel = supabase
      .channel(`chat-${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `contract_id=eq.${contractId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          callbackRef.current?.(newMsg);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [contractId]);

  const sendMessage = useCallback(
    async (content: string, senderRole: "admin" | "user") => {
      if (!contractId || !content.trim()) return;
      await supabase.from("chat_messages").insert({
        contract_id: contractId,
        sender_role: senderRole,
        content: content.trim(),
      });
    },
    [contractId]
  );

  return { messages, loading, sendMessage };
}
