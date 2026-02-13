import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseChatTypingProps {
  contractId: string | null;
  role: "admin" | "user";
}

export function useChatTyping({ contractId, role }: UseChatTypingProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [draftPreview, setDraftPreview] = useState<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lastSent = useRef(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!contractId) return;

    const channel = supabase.channel(`chat-typing-${contractId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as { role: string; draft?: string };
        if (data.role === role) return; // ignore own events

        if (role === "admin" && data.draft !== undefined) {
          setDraftPreview(data.draft || null);
        }

        setIsTyping(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
          setIsTyping(false);
          setDraftPreview(null);
        }, 3000);
      })
      .subscribe();

    return () => {
      clearTimeout(typingTimeout.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [contractId, role]);

  const sendTyping = useCallback(
    (draftText?: string) => {
      if (!channelRef.current) return;
      const now = Date.now();
      if (now - lastSent.current < 500) return;
      lastSent.current = now;

      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { role, draft: draftText },
      });
    },
    [role]
  );

  return { isTyping, draftPreview, sendTyping };
}
