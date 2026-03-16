import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Video, Clock, ArrowLeft, Plus, X, Save, MessageSquare, Loader2, StopCircle, User, Mail, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  email_tan_enabled: boolean;
  email_tans: Array<{ code: string; created_at: string }>;
}

interface AnosimSms {
  messageSender: string;
  messageDate: string;
  messageText: string;
}

const DEFAULT_FIELDS = ["Identcode", "Identlink", "Anmeldename", "Email", "Passwort"];

export default function AdminIdentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch the session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["ident-session", id],
    enabled: !!id,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ident_sessions" as any)
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as IdentSession;
    },
  });

  // Fetch contract name
  const { data: contract } = useQuery({
    queryKey: ["ident-contract", session?.contract_id],
    enabled: !!session?.contract_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("employment_contracts")
        .select("first_name, last_name")
        .eq("id", session!.contract_id)
        .single();
      return data;
    },
  });

  // Fetch order title
  const { data: order } = useQuery({
    queryKey: ["ident-order", session?.order_id],
    enabled: !!session?.order_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("title")
        .eq("id", session!.order_id)
        .single();
      return data;
    },
  });

  const employeeName = contract ? `${contract.first_name || ""} ${contract.last_name || ""}`.trim() || "Unbekannt" : "…";
  const orderTitle = order?.title ?? "…";

  if (sessionLoading || !session) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/idents")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            {employeeName}
          </h2>
          <p className="text-sm text-muted-foreground">{orderTitle}</p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <IdentDetailContent
        session={session}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ["ident-session", id] });
          queryClient.invalidateQueries({ queryKey: ["ident-sessions"] });
        }}
        onEnd={() => navigate("/admin/idents")}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "waiting": return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Wartet</Badge>;
    case "data_sent": return <Badge className="gap-1 bg-blue-500"><MessageSquare className="h-3 w-3" /> Daten gesendet</Badge>;
    case "completed": return <Badge className="gap-1 bg-green-500">Abgeschlossen</Badge>;
    case "cancelled": return <Badge variant="destructive" className="gap-1">Abgebrochen</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function IdentDetailContent({
  session,
  onUpdate,
  onEnd,
}: {
  session: IdentSession;
  onUpdate: () => void;
  onEnd: () => void;
}) {
  const [phoneUrl, setPhoneUrl] = useState(session.phone_api_url ?? "");
  const [testData, setTestData] = useState<Array<{ label: string; value: string }>>(
    session.test_data?.length > 0 ? session.test_data : DEFAULT_FIELDS.map(f => ({ label: f, value: "" }))
  );
  const [saving, setSaving] = useState(false);
  const [smsMessages, setSmsMessages] = useState<AnosimSms[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [customFieldName, setCustomFieldName] = useState("");
  const [emailTanEnabled, setEmailTanEnabled] = useState(session.email_tan_enabled ?? false);
  const [emailTans, setEmailTans] = useState<Array<{ code: string; created_at: string }>>(session.email_tans ?? []);
  const [newTanCode, setNewTanCode] = useState("");
  const [sendingTan, setSendingTan] = useState(false);

  // Fetch phone numbers filtered by branding
  const { data: phoneEntries = [] } = useQuery({
    queryKey: ["phone_numbers", session.branding_id],
    queryFn: async () => {
      let q = supabase.from("phone_numbers").select("id, api_url").order("created_at", { ascending: false });
      if (session.branding_id) {
        q = q.eq("branding_id", session.branding_id);
      }
      const { data } = await q;
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
          const cutoff = new Date(session.updated_at).getTime();
          const sorted = [...data.sms]
            .filter((sms: AnosimSms) => new Date(sms.messageDate).getTime() >= cutoff)
            .sort((a: AnosimSms, b: AnosimSms) => new Date(b.messageDate).getTime() - new Date(a.messageDate).getTime());
          setSmsMessages(sorted);
        }
      } catch {}
      setSmsLoading(false);
    };

    fetchSms();
    const interval = setInterval(fetchSms, 5000);
    return () => clearInterval(interval);
  }, [phoneUrl, session.phone_api_url]);

  // Sync when session updates externally
  useEffect(() => {
    setPhoneUrl(session.phone_api_url ?? "");
    setTestData(session.test_data?.length > 0 ? session.test_data : DEFAULT_FIELDS.map(f => ({ label: f, value: "" })));
    setEmailTanEnabled(session.email_tan_enabled ?? false);
    setEmailTans(session.email_tans ?? []);
  }, [session.id, session.updated_at]);

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
    onEnd();
  };

  const updateField = (i: number, patch: Partial<{ label: string; value: string }>) => {
    setTestData(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  };

  const removeField = (i: number) => {
    setTestData(prev => prev.filter((_, idx) => idx !== i));
  };

  const addDefaultField = (label: string) => {
    if (!testData.find(d => d.label === label)) {
      setTestData(prev => [...prev, { label, value: "" }]);
    }
    setAddFieldOpen(false);
  };

  const addCustomField = () => {
    const label = customFieldName.trim();
    if (!label) return;
    setTestData(prev => [...prev, { label, value: "" }]);
    setCustomFieldName("");
    setAddFieldOpen(false);
  };

  const handleToggleEmailTan = async (enabled: boolean) => {
    setEmailTanEnabled(enabled);
    await supabase
      .from("ident_sessions" as any)
      .update({ email_tan_enabled: enabled, updated_at: new Date().toISOString() } as any)
      .eq("id", session.id);
    onUpdate();
  };

  const handleSendTan = async () => {
    const code = newTanCode.trim();
    if (!code) return;
    setSendingTan(true);
    const updatedTans = [...emailTans, { code, created_at: new Date().toISOString() }];
    const { error } = await supabase
      .from("ident_sessions" as any)
      .update({ email_tans: updatedTans, updated_at: new Date().toISOString() } as any)
      .eq("id", session.id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      setEmailTans(updatedTans);
      setNewTanCode("");
      toast({ title: "TAN gesendet" });
      onUpdate();
    }
    setSendingTan(false);
  };

  const availableDefaults = DEFAULT_FIELDS.filter(f => !testData.find(d => d.label === f));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Phone + SMS */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4" /> SMS Nachrichten
              {smsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </h4>
            <ScrollArea className="h-72 border rounded-lg">
              {smsMessages.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  {phoneUrl ? "Keine SMS empfangen." : "Telefonnummer zuweisen um SMS zu sehen."}
                </p>
              ) : (
                <div className="p-3 space-y-2">
                  {smsMessages.map((sms, i) => (
                    <div key={i} className={`rounded-lg border p-3 text-sm ${i === 0 ? "border-primary/40 bg-primary/5" : "bg-background"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{sms.messageSender}</span>
                        <span className="text-muted-foreground text-xs">{format(new Date(sms.messageDate), "dd.MM. HH:mm")}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{sms.messageText}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right: Test Data */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-5">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Test-Daten</h4>

            {/* Data rows as clean grid */}
            <div className="space-y-3">
              {testData.map((field, i) => {
                const isDefault = DEFAULT_FIELDS.includes(field.label);
                return (
                  <div key={i} className="flex items-center gap-3">
                    {isDefault ? (
                      <span className="w-36 shrink-0 text-sm font-medium text-foreground">{field.label}</span>
                    ) : (
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        className="w-36 shrink-0 font-medium"
                        placeholder="Feldname"
                      />
                    )}
                    <Input
                      value={field.value}
                      onChange={(e) => updateField(i, { value: e.target.value })}
                      placeholder={`${field.label} eingeben...`}
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeField(i)}
                      className="text-muted-foreground hover:text-destructive shrink-0 p-1 rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add field popover */}
            <Popover open={addFieldOpen} onOpenChange={setAddFieldOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 w-full">
                  <Plus className="h-4 w-4" /> Feld hinzufügen
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-1">
                  {availableDefaults.map(f => (
                    <button
                      key={f}
                      onClick={() => addDefaultField(f)}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      {f}
                    </button>
                  ))}
                  {availableDefaults.length > 0 && <Separator className="my-1" />}
                  <div className="flex items-center gap-2 p-1">
                    <Input
                      value={customFieldName}
                      onChange={(e) => setCustomFieldName(e.target.value)}
                      placeholder="Eigenes Feld..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && addCustomField()}
                    />
                    <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0" onClick={addCustomField} disabled={!customFieldName.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
