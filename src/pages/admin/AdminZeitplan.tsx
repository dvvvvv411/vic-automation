import { useState, useMemo, useEffect } from "react";
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
import { Trash2, Ban, Check } from "lucide-react";
import OrderAppointmentBlocker from "@/components/admin/OrderAppointmentBlocker";

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

export default function AdminZeitplan() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [blockReason, setBlockReason] = useState("");
  const [blockBrandingId, setBlockBrandingId] = useState<string>("all");

  // Load brandings
  const { data: brandings = [] } = useQuery({
    queryKey: ["brandings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brandings").select("id, company_name").order("company_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Load global settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["schedule-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Load branding-specific settings
  const { data: brandingSettings = [] } = useQuery({
    queryKey: ["branding-schedule-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branding_schedule_settings" as any)
        .select("*");
      if (error) throw error;
      return (data || []) as unknown as Array<{
        id: string;
        branding_id: string;
        start_time: string;
        end_time: string;
        slot_interval_minutes: number;
        available_days: number[];
      }>;
    },
  });

  // Local form state for global settings
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [interval, setIntervalVal] = useState<number | null>(null);
  const [days, setDays] = useState<number[] | null>(null);

  const effectiveStart = startTime ?? settings?.start_time?.slice(0, 5) ?? "08:00";
  const effectiveEnd = endTime ?? settings?.end_time?.slice(0, 5) ?? "18:00";
  const effectiveInterval = interval ?? settings?.slot_interval_minutes ?? 20;
  const effectiveDays = days ?? settings?.available_days ?? [1, 2, 3, 4, 5, 6];

  // Load blocked slots + auto-delete past ones
  const { data: blockedSlots } = useQuery({
    queryKey: ["schedule-blocked-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_blocked_slots")
        .select("*")
        .order("blocked_date", { ascending: true });
      if (error) throw error;
      const today = format(new Date(), "yyyy-MM-dd");
      const past = (data || []).filter((s) => s.blocked_date < today);
      const current = (data || []).filter((s) => s.blocked_date >= today);
      // Auto-delete past slots in background
      if (past.length > 0) {
        const pastIds = past.map((s) => s.id);
        supabase.from("schedule_blocked_slots").delete().in("id", pastIds).then(() => {});
      }
      return current;
    },
  });

  // Save global settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) return;
      const { error } = await supabase
        .from("schedule_settings")
        .update({
          start_time: effectiveStart + ":00",
          end_time: effectiveEnd + ":00",
          slot_interval_minutes: effectiveInterval,
          available_days: effectiveDays,
          new_slot_interval_minutes: null,
          interval_change_date: null,
        } as any)
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Einstellungen gespeichert" });
      queryClient.invalidateQueries({ queryKey: ["schedule-settings"] });
      setStartTime(null);
      setEndTime(null);
      setIntervalVal(null);
      setDays(null);
    },
    onError: () => toast({ title: "Fehler beim Speichern", variant: "destructive" }),
  });

  // Save branding-specific settings
  const saveBrandingSettingsMutation = useMutation({
    mutationFn: async (params: { branding_id: string; start_time: string; end_time: string; slot_interval_minutes: number; available_days: number[] }) => {
      const { error } = await supabase
        .from("branding_schedule_settings" as any)
        .upsert({
          branding_id: params.branding_id,
          start_time: params.start_time + ":00",
          end_time: params.end_time + ":00",
          slot_interval_minutes: params.slot_interval_minutes,
          available_days: params.available_days,
        } as any, { onConflict: "branding_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Branding-Einstellungen gespeichert" });
      queryClient.invalidateQueries({ queryKey: ["branding-schedule-settings"] });
    },
    onError: () => toast({ title: "Fehler beim Speichern", variant: "destructive" }),
  });

  // Block slot mutation
  const blockMutation = useMutation({
    mutationFn: async (time: string) => {
      if (!selectedDate) return;
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { error } = await supabase
        .from("schedule_blocked_slots")
        .insert({
          blocked_date: dateStr,
          blocked_time: time + ":00",
          reason: blockReason || null,
          branding_id: blockBrandingId === "all" ? null : blockBrandingId,
        } as any);
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
      const { error } = await supabase
        .from("schedule_blocked_slots")
        .delete()
        .eq("id", slotId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule-blocked-slots"] }),
    onError: () => toast({ title: "Fehler beim Freigeben", variant: "destructive" }),
  });

  // Time slots for selected date
  const timeSlots = useMemo(
    () => generateTimeSlots(effectiveStart, effectiveEnd, effectiveInterval),
    [effectiveStart, effectiveEnd, effectiveInterval]
  );

  // Blocked times for selected date
  const blockedForDate = useMemo(() => {
    if (!selectedDate || !blockedSlots) return new Map<string, string>();
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const map = new Map<string, string>();
    blockedSlots
      .filter((s) => s.blocked_date === dateStr)
      .forEach((s) => map.set(s.blocked_time?.slice(0, 5), s.id));
    return map;
  }, [selectedDate, blockedSlots]);

  // All blocked slots grouped by date for the list
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

  const toggleDay = (day: number) => {
    const current = days ?? effectiveDays;
    setDays(
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()
    );
  };

  if (settingsLoading) {
    return <div className="p-6 text-muted-foreground text-sm">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zeitplan</h1>
        <p className="text-muted-foreground text-sm">
          Verfügbare Zeiten für Bewerbungsgespräche konfigurieren
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allgemeine Zeiteinstellungen</CardTitle>
          <CardDescription>Definieren Sie die globale tägliche Zeitspanne und verfügbare Wochentage (Fallback für alle Brandings).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Startzeit</Label>
              <Select value={effectiveStart} onValueChange={setStartTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t} Uhr</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Endzeit</Label>
              <Select value={effectiveEnd} onValueChange={setEndTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t} Uhr</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Intervall (Minuten)</Label>
              <Select value={String(effectiveInterval)} onValueChange={(v) => setIntervalVal(Number(v))}>
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
                  <Checkbox
                    checked={effectiveDays.includes(wd.value)}
                    onCheckedChange={() => toggleDay(wd.value)}
                  />
                  <span className="text-sm">{wd.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Speichern..." : "Einstellungen speichern"}
          </Button>
        </CardContent>
      </Card>

      {/* Per-Branding Settings */}
      {brandings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Branding-spezifische Zeiteinstellungen</CardTitle>
            <CardDescription>Individuelle Einstellungen pro Branding. Ohne Einstellung wird der globale Fallback verwendet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={brandings[0]?.id}>
              <TabsList className="flex flex-wrap h-auto gap-1">
                {brandings.map((b) => (
                  <TabsTrigger key={b.id} value={b.id} className="text-xs">
                    {b.company_name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {brandings.map((b) => {
                const bs = brandingSettings.find((s) => s.branding_id === b.id);
                return (
                  <TabsContent key={b.id} value={b.id}>
                    <BrandingScheduleForm
                      brandingId={b.id}
                      brandingName={b.company_name}
                      existing={bs}
                      globalStart={effectiveStart}
                      globalEnd={effectiveEnd}
                      globalInterval={effectiveInterval}
                      globalDays={effectiveDays}
                      onSave={(params) => saveBrandingSettingsMutation.mutate(params)}
                      isSaving={saveBrandingSettingsMutation.isPending}
                    />
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Block Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zeiten blockieren</CardTitle>
          <CardDescription>
            Wählen Sie ein Datum und blockieren Sie einzelne Zeitfenster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={de}
                className="pointer-events-auto"
              />

              <div className="mt-4 space-y-2">
                <Label>Grund (optional)</Label>
                <Input
                  placeholder="z.B. Arzttermin"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
              {brandings.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label>Branding</Label>
                  <Select value={blockBrandingId} onValueChange={setBlockBrandingId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Brandings</SelectItem>
                      {brandings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              {!selectedDate ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Wählen Sie ein Datum aus dem Kalender.
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium mb-3">
                    {format(selectedDate, "EEEE, dd. MMMM yyyy", { locale: de })}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 max-h-[340px] overflow-y-auto">
                    {timeSlots.map((time) => {
                      const isBlocked = blockedForDate.has(time);
                      return (
                        <button
                          key={time}
                          onClick={() => {
                            if (isBlocked) {
                              const slotId = blockedForDate.get(time)!;
                              unblockMutation.mutate(slotId);
                            } else {
                              blockMutation.mutate(time);
                            }
                          }}
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

      {/* List of all blocked slots */}
      {blockedByDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blockierte Zeitfenster</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {blockedByDate.map(({ date, slots }) => (
              <div key={date}>
                <p className="text-sm font-medium mb-2">
                  {format(new Date(date), "EEEE, dd. MMMM yyyy", { locale: de })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <Badge
                      key={s.id}
                      variant="secondary"
                      className="gap-1.5 pr-1"
                    >
                      {s.blocked_time?.slice(0, 5)} Uhr
                      {s.reason && <span className="text-muted-foreground">({s.reason})</span>}
                      <button
                        onClick={() => unblockMutation.mutate(s.id)}
                        className="ml-1 hover:text-destructive transition-colors"
                      >
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

      {/* Order Appointment Blocking */}
      <OrderAppointmentBlocker />
    </div>
  );
}

// Sub-component for per-branding schedule settings
function BrandingScheduleForm({
  brandingId,
  brandingName,
  existing,
  globalStart,
  globalEnd,
  globalInterval,
  globalDays,
  onSave,
  isSaving,
}: {
  brandingId: string;
  brandingName: string;
  existing?: { start_time: string; end_time: string; slot_interval_minutes: number; available_days: number[] };
  globalStart: string;
  globalEnd: string;
  globalInterval: number;
  globalDays: number[];
  onSave: (params: { branding_id: string; start_time: string; end_time: string; slot_interval_minutes: number; available_days: number[] }) => void;
  isSaving: boolean;
}) {
  const [st, setSt] = useState(existing?.start_time?.slice(0, 5) || globalStart);
  const [et, setEt] = useState(existing?.end_time?.slice(0, 5) || globalEnd);
  const [iv, setIv] = useState(existing?.slot_interval_minutes || globalInterval);
  const [ds, setDs] = useState<number[]>(existing?.available_days || globalDays);

  const toggleDay = (day: number) => {
    setDs((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  };

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        {existing ? `Individuelle Einstellung für ${brandingName}` : `Noch keine individuelle Einstellung – nutzt globale Werte`}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Startzeit</Label>
          <Select value={st} onValueChange={setSt}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t} Uhr</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Endzeit</Label>
          <Select value={et} onValueChange={setEt}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t} Uhr</SelectItem>
              ))}
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
      <Button
        onClick={() => onSave({ branding_id: brandingId, start_time: st, end_time: et, slot_interval_minutes: iv, available_days: ds })}
        disabled={isSaving}
      >
        {isSaving ? "Speichern..." : "Branding-Einstellungen speichern"}
      </Button>
    </div>
  );
}
