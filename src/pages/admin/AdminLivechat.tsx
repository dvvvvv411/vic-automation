import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationList, type Conversation } from "@/components/chat/ConversationList";
import { ChatBubble, TypingIndicator, DateSeparator, SystemMessage } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TemplateManager } from "@/components/chat/TemplateManager";
import { AvatarUpload } from "@/components/chat/AvatarUpload";
import { useChatRealtime, type ChatMessage } from "@/components/chat/useChatRealtime";
import { useChatTyping } from "@/components/chat/useChatTyping";
import { sendSms } from "@/lib/sendSms";
import { MessageCircle, Pencil, Smartphone, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminLivechat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [contractData, setContractData] = useState<{ first_name?: string | null; last_name?: string | null; phone?: string | null }>({});
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const [adminDisplayName, setAdminDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState<{ avatar_url: string | null; display_name: string | null }>({ avatar_url: null, display_name: null });
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [quickSmsCode, setQuickSmsCode] = useState("");
  const [quickSmsSending, setQuickSmsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isTyping, draftPreview, sendTyping } = useChatTyping({
    contractId: active?.contract_id ?? null,
    role: "admin",
  });

  // Load admin profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_url, display_name, full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setAdminAvatar(data.avatar_url);
          setAdminDisplayName(data.display_name || data.full_name || "");
        }
      });
  }, [user]);

  const saveDisplayName = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ display_name: adminDisplayName } as any).eq("id", user.id);
    toast.success("Anzeigename gespeichert");
    setEditingName(false);
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("contract_id, content, created_at, read, sender_role")
      .order("created_at", { ascending: false });

    if (!msgs) return;

    const map = new Map<string, { last_message: string; last_message_at: string; unread_count: number }>();
    for (const m of msgs) {
      if (!map.has(m.contract_id)) {
        map.set(m.contract_id, { last_message: m.content, last_message_at: m.created_at, unread_count: 0 });
      }
      const entry = map.get(m.contract_id)!;
      if (m.sender_role === "user" && !m.read) entry.unread_count++;
    }

    const contractIds = Array.from(map.keys());
    if (!contractIds.length) { setConversations([]); return; }

    const { data: contracts } = await supabase
      .from("employment_contracts")
      .select("id, first_name, last_name, user_id")
      .in("id", contractIds);

    const convs: Conversation[] = (contracts ?? [])
      .filter((c) => map.has(c.id))
      .map((c) => ({ contract_id: c.id, first_name: c.first_name, last_name: c.last_name, ...map.get(c.id)! }))
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    setConversations(convs);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Realtime for all messages
  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadConversations]);

  const { messages, loading, sendMessage } = useChatRealtime({ contractId: active?.contract_id ?? null });

  // Load contract data + employee profile
  useEffect(() => {
    if (!active) return;
    supabase
      .from("employment_contracts")
      .select("first_name, last_name, phone, user_id")
      .eq("id", active.contract_id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setContractData(data);
          if (data.user_id) {
            supabase
              .from("profiles")
              .select("avatar_url, display_name, full_name")
              .eq("id", data.user_id)
              .maybeSingle()
              .then(({ data: profile }: any) => {
                if (profile) setEmployeeProfile({ avatar_url: profile.avatar_url, display_name: profile.display_name || profile.full_name });
                else setEmployeeProfile({ avatar_url: null, display_name: null });
              });
          }
        }
      });
  }, [active?.contract_id]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages, loading, isTyping, draftPreview]);

  // Mark user messages as read
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

  const handleTyping = (draft: string) => {
    sendTyping(draft);
  };

  const handleQuickSms = async () => {
    if (!contractData.phone || !quickSmsCode.trim()) return;
    setQuickSmsSending(true);
    const name = `${contractData.first_name || ""} ${contractData.last_name || ""}`.trim();
    const smsFullText = `Ihr Ident-Code lautet: ${quickSmsCode.trim()}.`;
    let smsSender: string | undefined;
    if (active) {
      const { data: contractFull } = await supabase
        .from("employment_contracts")
        .select("applications(branding_id)")
        .eq("id", active.contract_id)
        .single();
      const brandingId = (contractFull as any)?.applications?.branding_id;
      if (brandingId) {
        const { data: branding } = await supabase.from("brandings").select("sms_sender_name" as any).eq("id", brandingId).single();
        smsSender = (branding as any)?.sms_sender_name || undefined;
      }
    }
    const success = await sendSms({
      to: contractData.phone,
      text: smsFullText,
      event_type: "manuell",
      recipient_name: name,
      from: smsSender,
    });
    setQuickSmsSending(false);
    if (success) {
      toast.success("SMS gesendet!");
      setQuickSmsCode("");
    } else {
      toast.error("SMS-Versand fehlgeschlagen");
    }
  };
  const handleSendSms = async () => {
    if (!contractData.phone || !smsCode.trim()) return;
    setSmsSending(true);
    const name = `${contractData.first_name || ""} ${contractData.last_name || ""}`.trim();
    const smsFullText = `Ihr Ident-Code lautet: ${smsCode.trim()}.`;
    let smsSender: string | undefined;
    if (active) {
      const { data: contractFull } = await supabase
        .from("employment_contracts")
        .select("applications(branding_id)")
        .eq("id", active.contract_id)
        .single();
      const brandingId = (contractFull as any)?.applications?.branding_id;
      if (brandingId) {
        const { data: branding } = await supabase.from("brandings").select("sms_sender_name" as any).eq("id", brandingId).single();
        smsSender = (branding as any)?.sms_sender_name || undefined;
      }
    }
    const success = await sendSms({
      to: contractData.phone,
      text: smsFullText,
      event_type: "manuell",
      recipient_name: name,
      from: smsSender,
    });
    setSmsSending(false);
    if (success) {
      toast.success("SMS gesendet!");
      setSmsCode("");
      setSmsDialogOpen(false);
    } else {
      toast.error("SMS-Versand fehlgeschlagen");
    }
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {active ? (
          <>
            {/* Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-card shrink-0">
              <div className="flex items-center gap-3">
                <AvatarUpload avatarUrl={employeeProfile.avatar_url} name={active.first_name} size={36} />
                <div>
                  <h2 className="font-semibold text-foreground">
                    {active.first_name} {active.last_name}
                  </h2>
                  <p className="text-xs text-muted-foreground">Konversation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {contractData.phone && (
                  <>
                    <div className="flex items-center gap-1">
                      <Input
                        value={quickSmsCode}
                        onChange={(e) => setQuickSmsCode(e.target.value)}
                        placeholder="Code"
                        className="h-9 w-20 text-sm"
                        onKeyDown={(e) => { if (e.key === "Enter") handleQuickSms(); }}
                      />
                      <Button
                        variant="default"
                        size="icon"
                        className="h-9 w-9"
                        disabled={!quickSmsCode.trim() || quickSmsSending}
                        onClick={handleQuickSms}
                        title="Ident-Code per SMS senden"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setSmsDialogOpen(true)}
                      title="SMS-Dialog öffnen"
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <TemplateManager />
                {/* Admin profile popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="cursor-pointer">
                      <AvatarUpload avatarUrl={adminAvatar} name={adminDisplayName || "Admin"} size={36} />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="end">
                    <p className="text-xs text-muted-foreground mb-3">Admin-Profil</p>
                    <div className="flex justify-center mb-3">
                      <AvatarUpload
                        avatarUrl={adminAvatar}
                        name={adminDisplayName || "Admin"}
                        size={56}
                        editable
                        onUploaded={(url) => setAdminAvatar(url)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">Anzeigename</label>
                      <div className="flex gap-2">
                        <Input
                          value={adminDisplayName}
                          onChange={(e) => setAdminDisplayName(e.target.value)}
                          placeholder="Dein Name..."
                          className="h-8 text-sm"
                        />
                        <button
                          onClick={saveDisplayName}
                          className="shrink-0 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
                          senderRole={msg.sender_role as "admin" | "user"}
                          createdAt={msg.created_at}
                          isOwnMessage={msg.sender_role === "admin"}
                          avatarUrl={msg.sender_role === "user" ? employeeProfile.avatar_url : undefined}
                          senderName={msg.sender_role === "user" ? (employeeProfile.display_name || `${active.first_name} ${active.last_name}`) : undefined}
                        />
                      )}
                    </div>
                  );
                })
              )}
              {isTyping && <TypingIndicator />}
            </div>

            {/* Draft preview */}
            {draftPreview && (
              <div className="px-6 py-2 border-t border-border bg-muted/30 flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground italic truncate">
                  {active.first_name} schreibt: {draftPreview}
                </p>
              </div>
            )}

            {/* Input with templates */}
            <ChatInput onSend={handleSend} showTemplates contractData={contractData} onTyping={handleTyping} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm">Wähle eine Konversation aus</p>
          </div>
        )}
      </div>

      {/* SMS Dialog */}
      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              SMS senden
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Empfänger</Label>
              <p className="text-sm font-medium">{contractData.first_name} {contractData.last_name}</p>
              <p className="text-xs text-muted-foreground">{contractData.phone}</p>
            </div>
            <div className="space-y-2">
              <Label>Ident-Code</Label>
              <Input
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="z.B. 5258"
              />
              {smsCode.trim() && (
                <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
                  Ihr Ident-Code lautet: <span className="font-semibold text-foreground">{smsCode.trim()}</span>.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSendSms} disabled={smsSending || !smsCode.trim()}>
              {smsSending ? "Wird gesendet..." : "SMS senden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
