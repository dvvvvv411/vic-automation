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
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Trash2, Ban, Check, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const WEEKDAYS = [
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
  { value: 7, label: "So" },
];

const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) => {
  const h = Math.floor(i / 1);
  return `${String(h).padStart(2, "0")}:00`;
}).filter((_, i) => i <= 23);

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

  // Load settings
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

  // Local form state
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [interval, setIntervalVal] = useState<number | null>(null);
  const [days, setDays] = useState<number[] | null>(null);
  const [newInterval, setNewInterval] = useState<number | null>(null);
  const [changeDate, setChangeDate] = useState<Date | null>(null);

  const effectiveStart = startTime ?? settings?.start_time?.slice(0, 5) ?? "08:00";
  const effectiveEnd = endTime ?? settings?.end_time?.slice(0, 5) ?? "18:00";
  const effectiveInterval = interval ?? settings?.slot_interval_minutes ?? 30;
  const effectiveDays = days ?? settings?.available_days ?? [1, 2, 3, 4, 5, 6];
  const effectiveNewInterval = newInterval ?? (settings as any)?.new_slot_interval_minutes ?? null;
  const effectiveChangeDate = changeDate ?? ((settings as any)?.interval_change_date ? new Date((settings as any).interval_change_date + "T00:00:00") : null);

  // Determine the interval to use for a given date
  const getIntervalForDate = (date: Date | undefined) => {
    if (!date || !effectiveChangeDate || !effectiveNewInterval) return effectiveInterval;
    return date >= effectiveChangeDate ? effectiveNewInterval : effectiveInterval;
  };

  // Load blocked slots
  const { data: blockedSlots } = useQuery({
    queryKey: ["schedule-blocked-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_blocked_slots")
        .select("*")
        .order("blocked_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Save settings mutation
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
          new_slot_interval_minutes: effectiveNewInterval,
          interval_change_date: effectiveChangeDate ? format(effectiveChangeDate, "yyyy-MM-dd") : null,
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
      setNewInterval(null);
      setChangeDate(null);
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
        .insert({ blocked_date: dateStr, blocked_time: time + ":00", reason: blockReason || null });
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
  const dateInterval = getIntervalForDate(selectedDate);
  const timeSlots = useMemo(
    () => generateTimeSlots(effectiveStart, effectiveEnd, dateInterval),
    [effectiveStart, effectiveEnd, dateInterval]
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
          <CardDescription>Definieren Sie die tägliche Zeitspanne und verfügbare Wochentage.</CardDescription>
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
                  <SelectItem value="30">30 Min</SelectItem>
                  <SelectItem value="60">60 Min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <Label className="text-base font-semibold">Intervallwechsel ab Stichtag</Label>
            <p className="text-sm text-muted-foreground">Optional: Ab einem bestimmten Datum ein anderes Intervall verwenden.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stichtag</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !effectiveChangeDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {effectiveChangeDate ? format(effectiveChangeDate, "dd.MM.yyyy") : "Datum wählen"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={effectiveChangeDate ?? undefined}
                      onSelect={(d) => setChangeDate(d ?? null)}
                      locale={de}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {effectiveChangeDate && (
                  <Button variant="ghost" size="sm" onClick={() => { setChangeDate(null as any); setNewInterval(null); }}>
                    Stichtag entfernen
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Neues Intervall</Label>
                <Select
                  value={effectiveNewInterval ? String(effectiveNewInterval) : ""}
                  onValueChange={(v) => setNewInterval(Number(v))}
                  disabled={!effectiveChangeDate}
                >
                  <SelectTrigger><SelectValue placeholder="Intervall wählen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Min</SelectItem>
                    <SelectItem value="20">20 Min</SelectItem>
                    <SelectItem value="30">30 Min</SelectItem>
                    <SelectItem value="60">60 Min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            {/* Calendar */}
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
            </div>

            {/* Time slots */}
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
    </div>
  );
}
