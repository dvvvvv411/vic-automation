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
import { MessageSquareText, Send, BarChart3, Users } from "lucide-react";

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

  const monthStart = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return startOfMonth(new Date(y, m - 1));
  }, [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);

  const fromISO = monthStart.toISOString();
  const toISO = monthEnd.toISOString();

  // Fetch profiles for mapping user IDs to emails
  const { data: profiles } = useQuery({
    queryKey: ["sms-history-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      return data ?? [];
    },
  });

  // Fetch sms_logs (seven.io)
  const { data: smsLogs, isLoading: smsLoading } = useQuery({
    queryKey: ["sms-history-logs", selectedMonth],
    queryFn: async () => {
      const { data } = await supabase
        .from("sms_logs")
        .select("*")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Fetch sms_spoof_logs
  const { data: spoofLogs, isLoading: spoofLoading } = useQuery({
    queryKey: ["sms-history-spoof", selectedMonth],
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
    const m = new Map<string, string>();
    profiles?.forEach((p) => m.set(p.id, p.full_name || p.id));
    return m;
  }, [profiles]);

  const getUserLabel = (uid: string | null) => {
    if (!uid) return "System";
    return profileMap.get(uid) || uid.slice(0, 8) + "…";
  };

  // Stats
  const smsCount = smsLogs?.length ?? 0;
  const spoofCount = spoofLogs?.length ?? 0;
  const totalCount = smsCount + spoofCount;

  // Per-user breakdown
  const perUser = useMemo(() => {
    const map = new Map<string, { sms: number; spoof: number }>();
    smsLogs?.forEach((l) => {
      const key = l.created_by ?? "system";
      const cur = map.get(key) || { sms: 0, spoof: 0 };
      cur.sms++;
      map.set(key, cur);
    });
    spoofLogs?.forEach((l) => {
      const key = l.created_by ?? "system";
      const cur = map.get(key) || { sms: 0, spoof: 0 };
      cur.spoof++;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([uid, counts]) => ({ uid, ...counts, total: counts.sms + counts.spoof }))
      .sort((a, b) => b.total - a.total);
  }, [smsLogs, spoofLogs]);

  const monthOptions = useMemo(getMonthOptions, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SMS History</h1>
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
            <CardTitle className="text-sm font-medium">Nutzerkonten</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perUser.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Per-User Breakdown */}
      {perUser.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nutzung pro Konto</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Konto</TableHead>
                  <TableHead className="text-right">seven.io</TableHead>
                  <TableHead className="text-right">Spoof</TableHead>
                  <TableHead className="text-right">Gesamt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perUser.map((u) => (
                  <TableRow key={u.uid}>
                    <TableCell className="font-medium">{getUserLabel(u.uid === "system" ? null : u.uid)}</TableCell>
                    <TableCell className="text-right">{u.sms}</TableCell>
                    <TableCell className="text-right">{u.spoof}</TableCell>
                    <TableCell className="text-right font-semibold">{u.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
                      <TableHead>Typ</TableHead>
                      <TableHead>Nachricht</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Konto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {smsLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(log.created_at), "dd.MM.yy HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.recipient_name && <span className="block text-xs text-muted-foreground">{log.recipient_name}</span>}
                          {log.recipient_phone}
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
                    {spoofLogs.map((log) => (
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
