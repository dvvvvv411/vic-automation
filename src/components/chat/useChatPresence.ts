import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseChatPresenceOptions {
  contractId: string | null;
  role: "user" | "admin";
  active?: boolean; // whether to track own presence (default: true)
}

export function useChatPresence({ contractId, role, active = true }: UseChatPresenceOptions) {
  const [onlineContractIds, setOnlineContractIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel("chat-presence", {
      config: { presence: { key: role === "user" ? contractId ?? "unknown" : "admin" } },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        for (const key of Object.keys(state)) {
          for (const presence of state[key]) {
            const p = presence as any;
            if (p.role === "user" && p.contract_id) {
              ids.add(p.contract_id);
            }
          }
        }
        setOnlineContractIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && active && role === "user" && contractId) {
          await channel.track({
            contract_id: contractId,
            role: "user",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [contractId, role, active]);

  // Track/untrack when active changes
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || role !== "user" || !contractId) return;

    if (active) {
      channel.track({
        contract_id: contractId,
        role: "user",
        online_at: new Date().toISOString(),
      });
    } else {
      channel.untrack();
    }
  }, [active, contractId, role]);

  return { onlineContractIds };
}
