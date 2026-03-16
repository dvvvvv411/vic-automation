import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Trash2, Ban, Check, CalendarOff, ClipboardList } from "lucide-react";

import TrialDayBlocker from "@/components/admin/TrialDayBlocker";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

const WEEKDAYS = [
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
  { value: 7, label: "So" },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

function generateTimeSlots(start: string, end: string, interval: number) {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  for (let m = startMin; m < endMin; m += interval) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

const DEFAULT_START = "08:00";
const DEFAULT_END = "18:00";
const DEFAULT_INTERVAL = 20;
const DEFAULT_DAYS = [1, 2, 3, 4, 5, 6];

export default function AdminZeitplan() {
  const queryClient = useQueryClient();
  const { activeBrandingId, ready } = useBrandingFilter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [blockReason, setBlockReason] = useState("");

  // Load branding-specific settings for interview
  const { data: interviewSetting } = useQuery({
    queryKey: ["branding-schedule-settings", activeBrandingId, "interview"],
    enabled: ready && !!activeBrandingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branding_schedule_settings")
        .select("*")
        .eq("branding_id", activeBrandingId!)
        .eq("schedule_type" as any, "interview")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Load blocked slots for active branding + auto-delete past ones
  const { data: blockedSlots } = useQuery({
    queryKey: ["schedule-blocked-slots", activeBrandingId],
    enabled: ready && !!activeBrandingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_blocked_slots")
        .select("*")
        .eq("branding_id", activeBrandingId!)
        .order("blocked_date", { ascending: true });
      if (error) throw error;
      const today = format(new Date(), "yyyy-MM-dd");
      const past = (data || []).filter((s) => s.blocked_date < today);
      const current = (data || []).filter((s) => s.blocked_date >= today);
      if (past.length > 0) {
        supabase.from("schedule_blocked_slots").delete().in("id", past.map((s) => s.id)).then(() => {});
      }
      return current;
    },
  });

  // Save branding-specific settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (params: { start_time: string; end_time: string; slot_interval_minutes: number; available_days: number[]; schedule_type: string }) => {
      const { error } = await supabase
        .from("branding_schedule_settings")
        .upsert({
          branding_id: activeBrandingId!,
          start_time: params.start_time + ":00",
          end_time: params.end_time + ":00",
          slot_interval_minutes: params.slot_interval_minutes,
          available_days: params.available_days,
          schedule_type: params.schedule_type,
        } as any, { onConflict: "branding_id,schedule_type" as any });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Einstellungen gespeichert" });
      queryClient.invalidateQueries({ queryKey: ["branding-schedule-settings"] });
    },
    onError: () => toast({ title: "Fehler beim Speichern", variant: "destructive" }),
  });

  // Block slot mutation
  const blockMutation = useMutation({
    mutationFn: async (time: string) => {
      if (!selectedDate) return;
      const { error } = await supabase
        .from("schedule_blocked_slots")
        .insert({
          blocked_date: format(selectedDate, "yyyy-MM-dd"),
          blocked_time: time + ":00",
          reason: blockReason || null,
          branding_id: activeBrandingId,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-blocked-slots"] });
      setBlockReason("");
    },
    onError: () => toast({ title: "Fehler beim Blockieren", variant: "destructive" }),
  });

  // Unblock slot mutation
  const unblockMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase.from("schedule_blocked_slots").delete().eq("id", slotId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule-blocked-slots"] }),
    onError: () => toast({ title: "Fehler beim Freigeben", variant: "destructive" }),
  });

  const blockViewStart = interviewSetting?.start_time?.slice(0, 5) ?? DEFAULT_START;
  const blockViewEnd = interviewSetting?.end_time?.slice(0, 5) ?? DEFAULT_END;
  const blockViewInterval = interviewSetting?.slot_interval_minutes ?? DEFAULT_INTERVAL;

  const timeSlots = useMemo(
    () => generateTimeSlots(blockViewStart, blockViewEnd, blockViewInterval),
    [blockViewStart, blockViewEnd, blockViewInterval]
  );

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
    blockedSlots.forEach((s) => {
      const arr = groups.get(s.blocked_date) || [];
      arr.push(s);
      groups.set(s.blocked_date, arr);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, slots]) => ({ date, slots }));
  }, [blockedSlots]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Zeitplan</h2>
        <p className="text-muted-foreground text-sm">
          Verfügbare Zeiten und Blockierungen konfigurieren
        </p>
      </div>

      <Tabs defaultValue="interviews">
        <TabsList>
          <TabsTrigger value="interviews" className="gap-1.5">
            <CalendarOff className="h-4 w-4" />
            Bewerbungsgespräche
          </TabsTrigger>
          <TabsTrigger value="trials" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Probetage
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Bewerbungsgespräche */}
        <TabsContent value="interviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zeiteinstellungen</CardTitle>
              <CardDescription>Zeitspanne, Intervall und verfügbare Wochentage für Bewerbungsgespräche.</CardDescription>
            </CardHeader>
            <CardContent>
              <BrandingScheduleForm
                existing={interviewSetting ?? undefined}
                onSave={(params) => saveSettingsMutation.mutate({ ...params, schedule_type: "interview" })}
                isSaving={saveSettingsMutation.isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zeiten blockieren</CardTitle>
              <CardDescription>Wählen Sie ein Datum und blockieren Sie einzelne Zeitfenster.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={de} className="pointer-events-auto" />
                  <div className="mt-4 space-y-2">
                    <Label>Grund (optional)</Label>
                    <Input placeholder="z.B. Arzttermin" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
                  </div>
                </div>
                <div>
                  {!selectedDate ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Wählen Sie ein Datum aus dem Kalender.</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium mb-3">{format(selectedDate, "EEEE, dd. MMMM yyyy", { locale: de })}</p>
                      <div className="grid grid-cols-3 gap-1.5 max-h-[340px] overflow-y-auto">
                        {timeSlots.map((time) => {
                          const isBlocked = blockedForDate.has(time);
                          return (
                            <button
                              key={time}
                              onClick={() => isBlocked ? unblockMutation.mutate(blockedForDate.get(time)!) : blockMutation.mutate(time)}
                              className={cn(
                                "py-2 px-2 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-1",
                                isBlocked
                                  ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                                  : "bg-card border-border hover:bg-muted text-foreground"
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
              <CardHeader><CardTitle className="text-lg">Blockierte Zeitfenster</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {blockedByDate.map(({ date, slots }) => (
                  <div key={date}>
                    <p className="text-sm font-medium mb-2">{format(new Date(date), "EEEE, dd. MMMM yyyy", { locale: de })}</p>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s) => (
                        <Badge key={s.id} variant="secondary" className="gap-1.5 pr-1">
                          {s.blocked_time?.slice(0, 5)} Uhr
                          {s.reason && <span className="text-muted-foreground">({s.reason})</span>}
                          <button onClick={() => unblockMutation.mutate(s.id)} className="ml-1 hover:text-destructive transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Probetage */}
        <TabsContent value="trials" className="space-y-6">
          {activeBrandingId && (
            <TrialDayBlocker
              brandingId={activeBrandingId}
              onSaveSettings={(params) => saveSettingsMutation.mutate({ ...params, schedule_type: "trial" })}
              isSavingSettings={saveSettingsMutation.isPending}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-component for schedule settings
function BrandingScheduleForm({
  existing,
  onSave,
  isSaving,
}: {
  existing?: { start_time: string; end_time: string; slot_interval_minutes: number; available_days: number[] };
  onSave: (params: { start_time: string; end_time: string; slot_interval_minutes: number; available_days: number[] }) => void;
  isSaving: boolean;
}) {
  const [st, setSt] = useState(existing?.start_time?.slice(0, 5) || DEFAULT_START);
  const [et, setEt] = useState(existing?.end_time?.slice(0, 5) || DEFAULT_END);
  const [iv, setIv] = useState(existing?.slot_interval_minutes || DEFAULT_INTERVAL);
  const [ds, setDs] = useState<number[]>(existing?.available_days || DEFAULT_DAYS);

  const toggleDay = (day: number) => {
    setDs((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Startzeit</Label>
          <Select value={st} onValueChange={setSt}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t} Uhr</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Endzeit</Label>
          <Select value={et} onValueChange={setEt}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t} Uhr</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Intervall</Label>
          <Select value={String(iv)} onValueChange={(v) => setIv(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 Min</SelectItem>
              <SelectItem value="20">20 Min</SelectItem>
              <SelectItem value="30">30 Min</SelectItem>
              <SelectItem value="60">60 Min</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Verfügbare Wochentage</Label>
        <div className="flex flex-wrap gap-3">
          {WEEKDAYS.map((wd) => (
            <label key={wd.value} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={ds.includes(wd.value)} onCheckedChange={() => toggleDay(wd.value)} />
              <span className="text-sm">{wd.label}</span>
            </label>
          ))}
        </div>
      </div>
      <Button onClick={() => onSave({ start_time: st, end_time: et, slot_interval_minutes: iv, available_days: ds })} disabled={isSaving}>
        {isSaving ? "Speichern..." : "Einstellungen speichern"}
      </Button>
    </div>
  );
}
