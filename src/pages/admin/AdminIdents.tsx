import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Video, Clock, User, ArrowLeft, Plus, X, Save, Phone, MessageSquare, Loader2, RefreshCw, StopCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface IdentSession {
  id: string;
  order_id: string;
  contract_id: string;
  assignment_id: string;
  status: string;
  phone_api_url: string | null;
  test_data: Array<{ label: string; value: string }>;
  created_at: string;
  updated_at: string;
  branding_id: string | null;
}

interface AnosimSms {
  messageSender: string;
  messageDate: string;
  messageText: string;
}

const DEFAULT_FIELDS = ["Identcode", "Identlink", "Anmeldename", "Email", "Passwort"];

export default function AdminIdents() {
  const { activeBrandingId } = useBrandingFilter();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<IdentSession | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["ident-sessions", activeBrandingId],
    enabled: !!activeBrandingId,
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ident_sessions" as any)
        .select("*")
        .eq("branding_id", activeBrandingId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as IdentSession[];
    },
  });

  // Realtime for new sessions
  useEffect(() => {
    if (!activeBrandingId) return;
    const channel = supabase
      .channel("admin-ident-sessions")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "ident_sessions", filter: `branding_id=eq.${activeBrandingId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ident-sessions", activeBrandingId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeBrandingId, queryClient]);

  // Fetch employee names for sessions
  const contractIds = [...new Set(sessions.map(s => s.contract_id))];
  const { data: contracts = [] } = useQuery({
    queryKey: ["ident-contracts", contractIds],
    enabled: contractIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("employment_contracts")
        .select("id, first_name, last_name")
        .in("id", contractIds);
      return data ?? [];
    },
  });

  const orderIds = [...new Set(sessions.map(s => s.order_id))];
  const { data: orders = [] } = useQuery({
    queryKey: ["ident-orders", orderIds],
    enabled: orderIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, title").in("id", orderIds);
      return data ?? [];
    },
  });

  const getContractName = (contractId: string) => {
    const c = contracts.find(c => c.id === contractId);
    return c ? `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Unbekannt" : "...";
  };

  const getOrderTitle = (orderId: string) => {
    const o = orders.find(o => o.id === orderId);
    return o?.title ?? "...";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "waiting": return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Wartet</Badge>;
      case "data_sent": return <Badge className="gap-1 bg-blue-500"><MessageSquare className="h-3 w-3" /> Daten gesendet</Badge>;
      case "completed": return <Badge className="gap-1 bg-green-500">Abgeschlossen</Badge>;
      case "cancelled": return <Badge variant="destructive" className="gap-1">Abgebrochen</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeSessions = sessions.filter(s => s.status === "waiting" || s.status === "data_sent");
  const completedSessions = sessions.filter(s => s.status === "completed" || s.status === "cancelled");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Idents</h2>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Idents</h2>
          <p className="text-sm text-muted-foreground">Video-Chat Verifizierungen verwalten</p>
        </div>
        {activeSessions.length > 0 && (
          <Badge variant="secondary" className="text-sm gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {activeSessions.length} aktiv
          </Badge>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <Video className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Keine Ident-Sessions vorhanden.</p>
            <p className="text-xs text-muted-foreground mt-1">Sessions werden automatisch erstellt, wenn Mitarbeiter einen Video-Chat starten.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeSessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Aktiv</h3>
              <div className="grid gap-3">
                {activeSessions.map(session => (
                  <Card
                    key={session.id}
                    className="border border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => { setSelectedSession(session); setDetailOpen(true); }}
                  >
                    <CardContent className="py-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{getContractName(session.contract_id)}</p>
                        <p className="text-xs text-muted-foreground truncate">{getOrderTitle(session.order_id)}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        {statusBadge(session.status)}
                        <p className="text-[10px] text-muted-foreground">{format(new Date(session.created_at), "dd.MM.yyyy HH:mm")}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedSessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Abgeschlossen</h3>
              <div className="grid gap-3">
                {completedSessions.map(session => (
                  <Card
                    key={session.id}
                    className="border border-border/60 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => { setSelectedSession(session); setDetailOpen(true); }}
                  >
                    <CardContent className="py-3 flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{getContractName(session.contract_id)}</p>
                        <p className="text-xs text-muted-foreground truncate">{getOrderTitle(session.order_id)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {statusBadge(session.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      {selectedSession && (
        <IdentDetailDialog
          session={selectedSession}
          open={detailOpen}
          onOpenChange={(open) => { setDetailOpen(open); if (!open) setSelectedSession(null); }}
          employeeName={getContractName(selectedSession.contract_id)}
          orderTitle={getOrderTitle(selectedSession.order_id)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ["ident-sessions", activeBrandingId] })}
        />
      )}
    </div>
  );
}

// ── Detail Dialog ──
function IdentDetailDialog({
  session,
  open,
  onOpenChange,
  employeeName,
  orderTitle,
  onUpdate,
}: {
  session: IdentSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  orderTitle: string;
  onUpdate: () => void;
}) {
  const [phoneUrl, setPhoneUrl] = useState(session.phone_api_url ?? "");
  const [testData, setTestData] = useState<Array<{ label: string; value: string }>>(
    session.test_data?.length > 0 ? session.test_data : DEFAULT_FIELDS.map(f => ({ label: f, value: "" }))
  );
  const [saving, setSaving] = useState(false);
  const [smsMessages, setSmsMessages] = useState<AnosimSms[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  // Fetch phone numbers
  const { data: phoneEntries = [] } = useQuery({
    queryKey: ["phone_numbers"],
    queryFn: async () => {
      const { data } = await supabase.from("phone_numbers").select("id, api_url").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Resolve phone numbers to display numbers
  const [phoneDisplayMap, setPhoneDisplayMap] = useState<Record<string, string>>({});
  useEffect(() => {
    phoneEntries.forEach(async (entry) => {
      if (phoneDisplayMap[entry.api_url]) return;
      try {
        const { data } = await supabase.functions.invoke("anosim-proxy", { body: { url: entry.api_url } });
        if (data?.number) {
          setPhoneDisplayMap(prev => ({ ...prev, [entry.api_url]: data.number }));
        }
      } catch {}
    });
  }, [phoneEntries]);

  // Fetch SMS
  useEffect(() => {
    const apiUrl = phoneUrl || session.phone_api_url;
    if (!apiUrl) { setSmsMessages([]); return; }

    const fetchSms = async () => {
      setSmsLoading(true);
      try {
        const { data } = await supabase.functions.invoke("anosim-proxy", { body: { url: apiUrl } });
        if (data?.sms) {
          const sorted = [...data.sms].sort((a: AnosimSms, b: AnosimSms) => new Date(b.messageDate).getTime() - new Date(a.messageDate).getTime());
          setSmsMessages(sorted);
        }
      } catch {}
      setSmsLoading(false);
    };

    fetchSms();
    const interval = setInterval(fetchSms, 5000);
    return () => clearInterval(interval);
  }, [phoneUrl, session.phone_api_url]);

  const handleSave = async () => {
    setSaving(true);
    const filteredData = testData.filter(d => d.value.trim() !== "");
    const normalizedUrl = phoneUrl.trim().replace("/share/orderbooking?", "/api/v1/orderbookingshare?");

    const { error } = await supabase
      .from("ident_sessions" as any)
      .update({
        phone_api_url: normalizedUrl || null,
        test_data: filteredData,
        status: filteredData.length > 0 ? "data_sent" : session.status,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", session.id);

    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Gespeichert", description: "Daten wurden aktualisiert und an den Mitarbeiter gesendet." });
      onUpdate();
    }
    setSaving(false);
  };

  const handleEndSession = async () => {
    await supabase
      .from("ident_sessions" as any)
      .update({ status: "cancelled", updated_at: new Date().toISOString() } as any)
      .eq("id", session.id);
    toast({ title: "Session beendet" });
    onUpdate();
    onOpenChange(false);
  };

  const addField = () => {
    const label = newFieldLabel.trim() || `Feld ${testData.length + 1}`;
    setTestData(prev => [...prev, { label, value: "" }]);
    setNewFieldLabel("");
  };

  const updateField = (i: number, patch: Partial<{ label: string; value: string }>) => {
    setTestData(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  };

  const removeField = (i: number) => {
    setTestData(prev => prev.filter((_, idx) => idx !== i));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Ident: {employeeName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{orderTitle}</p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left: Phone + SMS */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium">Telefonnummer (Anosim)</Label>
              {phoneEntries.length > 0 && (
                <Select value={phoneUrl} onValueChange={setPhoneUrl}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nummer auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneEntries.map(entry => (
                      <SelectItem key={entry.id} value={entry.api_url}>
                        {phoneDisplayMap[entry.api_url] || "Laden..."}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                placeholder="Oder Anosim Share-Link einfügen..."
                value={phoneUrl}
                onChange={(e) => setPhoneUrl(e.target.value)}
                className="text-xs"
              />
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4" /> SMS Nachrichten
                {smsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </h4>
              <ScrollArea className="h-64 border rounded-lg">
                {smsMessages.length === 0 ? (
                  <p className="p-4 text-xs text-muted-foreground text-center">
                    {phoneUrl ? "Keine SMS empfangen." : "Telefonnummer zuweisen um SMS zu sehen."}
                  </p>
                ) : (
                  <div className="p-2 space-y-1.5">
                    {smsMessages.map((sms, i) => (
                      <div key={i} className={`rounded-md border p-2 text-xs ${i === 0 ? "border-primary/40 bg-primary/5" : "bg-background"}`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium">{sms.messageSender}</span>
                          <span className="text-muted-foreground text-[10px]">{format(new Date(sms.messageDate), "dd.MM. HH:mm")}</span>
                        </div>
                        <p className="text-foreground leading-snug">{sms.messageText}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Right: Test Data */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Test-Daten</h4>
            <div className="space-y-3">
              {testData.map((field, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        className="h-7 text-xs font-medium"
                        placeholder="Feldname"
                      />
                      <button onClick={() => removeField(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      value={field.value}
                      onChange={(e) => updateField(i, { value: e.target.value })}
                      placeholder={`${field.label} eingeben...`}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Select value="" onValueChange={(v) => {
                if (!testData.find(d => d.label === v)) {
                  setTestData(prev => [...prev, { label: v, value: "" }]);
                }
              }}>
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue placeholder="Standardfeld hinzufügen..." />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_FIELDS.filter(f => !testData.find(d => d.label === f)).map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Input
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Eigenes Feld..."
                  className="h-8 text-xs w-32"
                  onKeyDown={(e) => e.key === "Enter" && addField()}
                />
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={addField}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Speichern..." : "Speichern & Senden"}
              </Button>
              {(session.status === "waiting" || session.status === "data_sent") && (
                <Button variant="destructive" size="sm" onClick={handleEndSession} className="gap-1.5">
                  <StopCircle className="h-4 w-4" /> Beenden
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
