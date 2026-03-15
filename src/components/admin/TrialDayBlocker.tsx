import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Trash2, Ban, Check } from "lucide-react";

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${min}`;
});

export default function TrialDayBlocker() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [blockReason, setBlockReason] = useState("");
  const [blockBrandingId, setBlockBrandingId] = useState<string>("all");

  const { data: brandings = [] } = useQuery({
    queryKey: ["brandings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brandings").select("id, company_name").order("company_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: blockedSlots } = useQuery({
    queryKey: ["trial-day-blocked-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_day_blocked_slots" as any)
        .select("*")
        .order("blocked_date", { ascending: true });
      if (error) throw error;
      const allSlots = (data || []) as unknown as Array<{
        id: string; blocked_date: string; blocked_time: string; reason: string | null; branding_id: string | null;
      }>;
      const today = format(new Date(), "yyyy-MM-dd");
      const past = allSlots.filter((s) => s.blocked_date < today);
      const current = allSlots.filter((s) => s.blocked_date >= today);
      if (past.length > 0) {
        supabase.from("trial_day_blocked_slots" as any).delete().in("id", past.map((s) => s.id)).then(() => {});
      }
      return current;
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (time: string) => {
      if (!selectedDate) return;
      const { error } = await supabase
        .from("trial_day_blocked_slots" as any)
        .insert({
          blocked_date: format(selectedDate, "yyyy-MM-dd"),
          blocked_time: time + ":00",
          reason: blockReason || null,
          branding_id: blockBrandingId === "all" ? null : blockBrandingId,
        });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trial-day-blocked-slots"] }); setBlockReason(""); },
    onError: () => toast({ title: "Fehler beim Blockieren", variant: "destructive" }),
  });

  const unblockMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase.from("trial_day_blocked_slots" as any).delete().eq("id", slotId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trial-day-blocked-slots"] }),
    onError: () => toast({ title: "Fehler beim Freigeben", variant: "destructive" }),
  });

  const blockedForDate = useMemo(() => {
    if (!selectedDate || !blockedSlots) return new Map<string, string>();
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const map = new Map<string, string>();
    blockedSlots.filter((s) => s.blocked_date === dateStr).forEach((s) => map.set(s.blocked_time?.slice(0, 5), s.id));
    return map;
  }, [selectedDate, blockedSlots]);

  const blockedByDate = useMemo(() => {
    if (!blockedSlots) return [];
    const groups = new Map<string, typeof blockedSlots>();
    blockedSlots.forEach((s) => { const arr = groups.get(s.blocked_date) || []; arr.push(s); groups.set(s.blocked_date, arr); });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, slots]) => ({ date, slots }));
  }, [blockedSlots]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Probetag-Termine blockieren</CardTitle>
          <CardDescription>Wählen Sie ein Datum und blockieren Sie einzelne Zeitfenster für Probetage.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={de} className="pointer-events-auto" />
              <div className="mt-4 space-y-2">
                <Label>Grund (optional)</Label>
                <Input placeholder="z.B. Feiertag" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
              </div>
              {brandings.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label>Branding</Label>
                  <Select value={blockBrandingId} onValueChange={setBlockBrandingId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Brandings</SelectItem>
                      {brandings.map((b) => <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div>
              {!selectedDate ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Wählen Sie ein Datum aus dem Kalender.</p>
              ) : (
                <>
                  <p className="text-sm font-medium mb-3">{format(selectedDate, "EEEE, dd. MMMM yyyy", { locale: de })}</p>
                  <div className="grid grid-cols-3 gap-1.5 max-h-[340px] overflow-y-auto">
                    {TIME_SLOTS.map((time) => {
                      const isBlocked = blockedForDate.has(time);
                      return (
                        <button
                          key={time}
                          onClick={() => isBlocked ? unblockMutation.mutate(blockedForDate.get(time)!) : blockMutation.mutate(time)}
                          className={cn(
                            "py-2 px-2 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-1",
                            isBlocked ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20" : "bg-card border-border hover:bg-muted text-foreground"
                          )}
                        >
                          {isBlocked ? <Ban className="h-3 w-3" /> : <Check className="h-3 w-3 text-muted-foreground" />}
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {blockedByDate.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Blockierte Probetag-Zeitfenster</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {blockedByDate.map(({ date, slots }) => (
              <div key={date}>
                <p className="text-sm font-medium mb-2">{format(new Date(date), "EEEE, dd. MMMM yyyy", { locale: de })}</p>
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <Badge key={s.id} variant="secondary" className="gap-1.5 pr-1">
                      {s.blocked_time?.slice(0, 5)} Uhr
                      {s.reason && <span className="text-muted-foreground">({s.reason})</span>}
                      <button onClick={() => unblockMutation.mutate(s.id)} className="ml-1 hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
