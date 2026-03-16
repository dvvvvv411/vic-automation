import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquareText, Send, BarChart3, Building2 } from "lucide-react";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

const MONTHS_BACK = 12;

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

  const monthStart = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return startOfMonth(new Date(y, m - 1));
  }, [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);

  const fromISO = monthStart.toISOString();
  const toISO = monthEnd.toISOString();

  // Fetch profiles for mapping user IDs to names/emails
  const { data: profiles } = useQuery({
    queryKey: ["sms-history-profiles", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data ?? [];
    },
  });

  // Fetch brandings for mapping branding IDs to company names
  const { data: brandings } = useQuery({
    queryKey: ["sms-history-brandings", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data } = await supabase.from("brandings").select("id, company_name");
      return data ?? [];
    },
  });

  // Fetch sms_logs (seven.io)
  const { data: smsLogs, isLoading: smsLoading } = useQuery({
    queryKey: ["sms-history-logs", selectedMonth, activeBrandingId],
    enabled: ready && !!activeBrandingId,
    queryFn: async () => {
      let q = supabase
        .from("sms_logs")
        .select("*")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false });
      if (activeBrandingId) q = q.eq("branding_id", activeBrandingId);
      const { data } = await q;
      return data ?? [];
    },
  });

  // Fetch sms_spoof_logs
  const { data: spoofLogs, isLoading: spoofLoading } = useQuery({
    queryKey: ["sms-history-spoof", selectedMonth, activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data } = await supabase
        .from("sms_spoof_logs")
        .select("*")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false });
      return data ?? [];
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

  // Stats
  const smsCount = smsLogs?.length ?? 0;
  const spoofCount = spoofLogs?.length ?? 0;
  const totalCount = smsCount + spoofCount;

  // Per-branding breakdown for seven.io
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

  // Per-user breakdown for spoof
  const perSpoofUser = useMemo(() => {
    const map = new Map<string, number>();
    spoofLogs?.forEach((l: any) => {
      const key = l.created_by ?? "system";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([uid, count]) => ({ uid, count }))
      .sort((a, b) => b.count - a.count);
  }, [spoofLogs]);

  const monthOptions = useMemo(getMonthOptions, []);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Per-Branding for seven.io */}
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

        {/* Per-User for Spoof */}
        {perSpoofUser.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquareText className="h-4 w-4" /> Spoof pro Nutzerkonto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Konto</TableHead>
                    <TableHead className="text-right">Anzahl</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perSpoofUser.map((u) => (
                    <TableRow key={u.uid}>
                      <TableCell className="font-medium">{getUserLabel(u.uid === "system" ? null : u.uid)}</TableCell>
                      <TableCell className="text-right font-semibold">{u.count}</TableCell>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {smsLogs.map((log: any) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                      <TableHead>Konto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spoofLogs.map((log: any) => (
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
                        <TableCell className="text-xs">{getUserLabel(log.created_by)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
