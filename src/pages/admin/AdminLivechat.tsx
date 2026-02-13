import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList, type Conversation } from "@/components/chat/ConversationList";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TemplateManager } from "@/components/chat/TemplateManager";
import { useChatRealtime, type ChatMessage } from "@/components/chat/useChatRealtime";
import { MessageCircle } from "lucide-react";

export default function AdminLivechat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [contractData, setContractData] = useState<{ first_name?: string | null; last_name?: string | null }>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    // Get all contracts that have messages
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("contract_id, content, created_at, read, sender_role")
      .order("created_at", { ascending: false });

    if (!msgs) return;

    // Group by contract_id
    const map = new Map<string, { last_message: string; last_message_at: string; unread_count: number }>();
    for (const m of msgs) {
      if (!map.has(m.contract_id)) {
        map.set(m.contract_id, {
          last_message: m.content,
          last_message_at: m.created_at,
          unread_count: 0,
        });
      }
      const entry = map.get(m.contract_id)!;
      if (m.sender_role === "user" && !m.read) {
        entry.unread_count++;
      }
    }

    // Fetch contract names
    const contractIds = Array.from(map.keys());
    if (!contractIds.length) { setConversations([]); return; }

    const { data: contracts } = await supabase
      .from("employment_contracts")
      .select("id, first_name, last_name")
      .in("id", contractIds);

    const convs: Conversation[] = (contracts ?? [])
      .filter((c) => map.has(c.id))
      .map((c) => ({
        contract_id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        ...map.get(c.id)!,
      }))
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    setConversations(convs);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Realtime for all messages (admin sees all)
  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadConversations]);

  // Active chat realtime
  const { messages, loading, sendMessage } = useChatRealtime({
    contractId: active?.contract_id ?? null,
  });

  // Load contract data for template variables
  useEffect(() => {
    if (!active) return;
    supabase
      .from("employment_contracts")
      .select("first_name, last_name")
      .eq("id", active.contract_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContractData(data);
      });
  }, [active?.contract_id]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark user messages as read when viewing
  useEffect(() => {
    if (!active) return;
    supabase
      .from("chat_messages")
      .update({ read: true })
      .eq("contract_id", active.contract_id)
      .eq("sender_role", "user")
      .eq("read", false)
      .then(() => loadConversations());
  }, [active?.contract_id, messages.length]);

  const handleSend = async (text: string) => {
    if (!active) return;
    await sendMessage(text, "admin");
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex rounded-2xl overflow-hidden border border-border bg-background shadow-sm">
      {/* Conversation list */}
      <div className="w-80 shrink-0">
        <ConversationList
          activeId={active?.contract_id ?? null}
          onSelect={setActive}
          conversations={conversations}
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {active ? (
          <>
            {/* Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-card shrink-0">
              <div>
                <h2 className="font-semibold text-foreground">
                  {active.first_name} {active.last_name}
                </h2>
                <p className="text-xs text-muted-foreground">Konversation</p>
              </div>
              <TemplateManager />
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Noch keine Nachrichten
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    content={msg.content}
                    senderRole={msg.sender_role}
                    createdAt={msg.created_at}
                    isOwnMessage={msg.sender_role === "admin"}
                  />
                ))
              )}
            </div>

            {/* Input with templates */}
            <ChatInput onSend={handleSend} showTemplates contractData={contractData} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm">Wähle eine Konversation aus</p>
          </div>
        )}
      </div>
    </div>
  );
}
