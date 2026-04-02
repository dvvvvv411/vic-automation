import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquareText, Send, BarChart3, Building2, CreditCard, RefreshCw } from "lucide-react";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";
import { sendSms } from "@/lib/sendSms";
import { toast } from "sonner";

const MONTHS_BACK = 12;
const PAGE_SIZE = 10;

async function fetchAllRows(buildQuery: () => any) {
  const BATCH = 1000;
  let all: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await buildQuery().range(from, from + BATCH - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < BATCH) break;
    from += BATCH;
  }
  return all;
}

function getMonthOptions() {
  const options = [];
  for (let i = 0; i < MONTHS_BACK; i++) {
    const d = subMonths(new Date(), i);
    options.push({
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy", { locale: de }),
    });
  }
  return options;
}

export default function AdminSmsHistory() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const { activeBrandingId, ready } = useBrandingFilter();
  const [smsLimit, setSmsLimit] = useState(PAGE_SIZE);
  const [spoofLimit, setSpoofLimit] = useState(PAGE_SIZE);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const queryClient = useQueryClient();

  const handleRetry = async (log: any) => {
    setRetryingId(log.id);
    try {
      const success = await sendSms({
        to: log.recipient_phone,
        text: log.message,
        event_type: log.event_type,
        recipient_name: log.recipient_name || undefined,
        branding_id: log.branding_id,
      });
      if (success) {
        await supabase
          .from("sms_logs")
          .update({ status: "sent", error_message: null })
          .eq("id", log.id);
        queryClient.invalidateQueries({ queryKey: ["sms-history-logs"] });
        toast.success("SMS erfolgreich erneut gesendet");
      } else {
        toast.error("SMS-Versand erneut fehlgeschlagen");
      }
    } catch {
      toast.error("Fehler beim erneuten Senden");
    } finally {
      setRetryingId(null);
    }
  };

  const failedLogs = useMemo(() => smsLogs?.filter((l: any) => l.status === "failed") ?? [], [smsLogs]);
  const failedCount = failedLogs.length;

  const handleRetryAll = async () => {
    setRetryingAll(true);
    let successCount = 0;
    for (const log of failedLogs) {
      try {
        const ok = await sendSms({
          to: log.recipient_phone,
          text: log.message,
          event_type: log.event_type,
          recipient_name: log.recipient_name || undefined,
          branding_id: log.branding_id,
        });
        if (ok) {
          await supabase.from("sms_logs").update({ status: "sent", error_message: null }).eq("id", log.id);
          successCount++;
        }
      } catch {}
    }
    queryClient.invalidateQueries({ queryKey: ["sms-history-logs"] });
    toast.success(`${successCount}/${failedLogs.length} SMS erfolgreich nachgesendet`);
    setRetryingAll(false);
  };
  const monthStart = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return startOfMonth(new Date(y, m - 1));
  }, [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);

  const fromISO = monthStart.toISOString();
  const toISO = monthEnd.toISOString();

  const { data: profiles } = useQuery({
    queryKey: ["sms-history-profiles", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data ?? [];
    },
  });

  const { data: brandings } = useQuery({
    queryKey: ["sms-history-brandings", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data } = await supabase.from("brandings").select("id, company_name, spoof_credits");
      return data ?? [];
    },
  });

  const { data: smsLogs, isLoading: smsLoading } = useQuery({
    queryKey: ["sms-history-logs", selectedMonth, activeBrandingId],
    enabled: ready && !!activeBrandingId,
    queryFn: async () => {
      const buildQuery = () => {
        let q = supabase
          .from("sms_logs")
          .select("*")
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
          .order("created_at", { ascending: false });
        if (activeBrandingId) q = q.eq("branding_id", activeBrandingId);
        return q;
      };
      return fetchAllRows(buildQuery);
    },
  });

  const { data: spoofLogs, isLoading: spoofLoading } = useQuery({
    queryKey: ["sms-history-spoof", selectedMonth, activeBrandingId],
    enabled: ready && !!activeBrandingId,
    queryFn: async () => {
      const buildQuery = () => {
        let q = supabase
          .from("sms_spoof_logs")
          .select("*")
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
          .order("created_at", { ascending: false });
        if (activeBrandingId) q = q.eq("branding_id", activeBrandingId);
        return q;
      };
      return fetchAllRows(buildQuery);
    },
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, { name: string; email: string | null }>();
    profiles?.forEach((p: any) => m.set(p.id, { name: p.full_name || p.id, email: p.email || null }));
    return m;
  }, [profiles]);

  const brandingMap = useMemo(() => {
    const m = new Map<string, string>();
    brandings?.forEach((b: any) => m.set(b.id, b.company_name));
    return m;
  }, [brandings]);

  const getUserLabel = (uid: string | null) => {
    if (!uid) return "System";
    const p = profileMap.get(uid);
    if (p?.email) return p.email;
    if (p?.name) return p.name;
    return uid.slice(0, 8) + "…";
  };

  const getBrandingLabel = (brandingId: string | null) => {
    if (!brandingId) return "–";
    return brandingMap.get(brandingId) || brandingId.slice(0, 8) + "…";
  };

  // Get spoof credits for active branding
  const activeBrandingCredits = useMemo(() => {
    if (!activeBrandingId || !brandings) return undefined;
    const b = brandings.find((b: any) => b.id === activeBrandingId);
    return b ? (b as any).spoof_credits : undefined;
  }, [brandings, activeBrandingId]);

  const smsCount = smsLogs?.length ?? 0;
  const spoofCount = spoofLogs?.length ?? 0;
  const totalCount = smsCount + spoofCount;

  const perBranding = useMemo(() => {
    const map = new Map<string, number>();
    smsLogs?.forEach((l: any) => {
      const key = l.branding_id ?? "unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([bid, count]) => ({ bid, count }))
      .sort((a, b) => b.count - a.count);
  }, [smsLogs]);

  const perSpoofBranding = useMemo(() => {
    const map = new Map<string, number>();
    spoofLogs?.forEach((l: any) => {
      const key = l.branding_id ?? "unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([bid, count]) => ({ bid, count }))
      .sort((a, b) => b.count - a.count);
  }, [spoofLogs]);

  const monthOptions = useMemo(getMonthOptions, []);

  const visibleSmsLogs = smsLogs?.slice(0, smsLimit) ?? [];
  const visibleSpoofLogs = spoofLogs?.slice(0, spoofLimit) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">SMS History</h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt SMS</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">seven.io SMS</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{smsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spoof SMS</CardTitle>
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spoofCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spoof Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${activeBrandingCredits !== null && activeBrandingCredits !== undefined && activeBrandingCredits < 0 ? "text-destructive" : ""}`}>
              {activeBrandingCredits === null || activeBrandingCredits === undefined ? "Unbegrenzt" : activeBrandingCredits}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perBranding.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> seven.io pro Branding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branding</TableHead>
                    <TableHead className="text-right">Anzahl</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perBranding.map((b) => (
                    <TableRow key={b.bid}>
                      <TableCell className="font-medium">
                        {b.bid === "unknown" ? <span className="text-muted-foreground">Ohne Zuordnung</span> : getBrandingLabel(b.bid)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{b.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {perSpoofBranding.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Spoof pro Branding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branding</TableHead>
                    <TableHead className="text-right">Anzahl</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perSpoofBranding.map((b) => (
                    <TableRow key={b.bid}>
                      <TableCell className="font-medium">
                        {b.bid === "unknown" ? <span className="text-muted-foreground">Ohne Zuordnung</span> : getBrandingLabel(b.bid)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{b.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sevenio">
        <TabsList>
          <TabsTrigger value="sevenio">seven.io SMS ({smsCount})</TabsTrigger>
          <TabsTrigger value="spoof">Spoof SMS ({spoofCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="sevenio">
          {smsLoading ? (
            <p className="text-muted-foreground text-sm py-4">Laden…</p>
          ) : smsLogs && smsLogs.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Empfänger</TableHead>
                      <TableHead>Branding</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Nachricht</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Konto</TableHead>
                      <TableHead>Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleSmsLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(log.created_at), "dd.MM.yy HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.recipient_name && <span className="block text-xs text-muted-foreground">{log.recipient_name}</span>}
                          {log.recipient_phone}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getBrandingLabel(log.branding_id)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{log.event_type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{log.message}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-xs">
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{getUserLabel(log.created_by)}</TableCell>
                        <TableCell>
                          {log.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={retryingId === log.id}
                              onClick={() => handleRetry(log)}
                            >
                              <RefreshCw className={`h-4 w-4 ${retryingId === log.id ? "animate-spin" : ""}`} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {smsCount > smsLimit && (
                  <div className="flex justify-center py-4">
                    <Button variant="outline" size="sm" onClick={() => setSmsLimit((l) => l + PAGE_SIZE)}>
                      Mehr anzeigen ({smsCount - smsLimit} weitere)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-sm py-4">Keine SMS in diesem Monat.</p>
          )}
        </TabsContent>

        <TabsContent value="spoof">
          {spoofLoading ? (
            <p className="text-muted-foreground text-sm py-4">Laden…</p>
          ) : spoofLogs && spoofLogs.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Empfänger</TableHead>
                      <TableHead>Absender</TableHead>
                      <TableHead>Nachricht</TableHead>
                      <TableHead>Branding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleSpoofLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(log.created_at), "dd.MM.yy HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.recipient_name && <span className="block text-xs text-muted-foreground">{log.recipient_name}</span>}
                          {log.recipient_phone}
                        </TableCell>
                        <TableCell className="text-sm">{log.sender_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{log.message}</TableCell>
                        <TableCell className="text-xs">{getBrandingLabel(log.branding_id)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {spoofCount > spoofLimit && (
                  <div className="flex justify-center py-4">
                    <Button variant="outline" size="sm" onClick={() => setSpoofLimit((l) => l + PAGE_SIZE)}>
                      Mehr anzeigen ({spoofCount - spoofLimit} weitere)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-sm py-4">Keine Spoof-SMS in diesem Monat.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
