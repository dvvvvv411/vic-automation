import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Phone } from "lucide-react";
import { format, isWeekend, isBefore, startOfDay, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${min}`;
});

export default function Bewerbungsgespraech() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedDate, setBookedDate] = useState<string>("");
  const [bookedTime, setBookedTime] = useState<string>("");

  const { data: application, isLoading, error } = useQuery({
    queryKey: ["application-public", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, brandings(company_name, logo_url, brand_color), interview_appointments(appointment_date, appointment_time)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: bookedSlots } = useQuery({
    queryKey: ["booked-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_appointments")
        .select("appointment_date, appointment_time");
      if (error) throw error;
      return data || [];
    },
  });

  const brandColor = application?.brandings?.brand_color || "#3B82F6";
  const logoUrl = application?.brandings?.logo_url;
  const companyName = application?.brandings?.company_name;
  const existingAppointment = application?.interview_appointments?.[0];
  const applicantName = application ? `${application.first_name} ${application.last_name}` : "";
  const applicantPhone = application?.phone;

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return TIME_SLOTS;
    if (!isToday(selectedDate)) return TIME_SLOTS;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return TIME_SLOTS.filter((time) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m > currentMinutes;
    });
  }, [selectedDate]);

  const bookedTimesForDate = useMemo(() => {
    if (!selectedDate || !bookedSlots) return new Set<string>();
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return new Set(
      bookedSlots
        .filter((s: any) => s.appointment_date === dateStr)
        .map((s: any) => s.appointment_time?.slice(0, 5))
    );
  }, [selectedDate, bookedSlots]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      const timeStr = selectedTime! + ":00";
      const { error: insertError } = await supabase
        .from("interview_appointments")
        .insert({ application_id: id!, appointment_date: dateStr, appointment_time: timeStr });
      if (insertError) throw insertError;
      const { error: rpcError } = await supabase.rpc("update_application_status", {
        _application_id: id!, _status: "termin_gebucht",
      });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      setBookedDate(format(selectedDate!, "dd. MMMM yyyy", { locale: de }));
      setBookedTime(selectedTime!);
      setBooked(true);
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["application-public", id] });
      queryClient.invalidateQueries({ queryKey: ["booked-slots"] });
    },
    onError: () => setConfirmOpen(false),
  });

  // --- Error state ---
  if (!isLoading && (error || !application)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-1">Ungültiger Link</h2>
          <p className="text-sm text-muted-foreground">
            Dieser Bewerbungslink ist ungültig oder nicht mehr aktiv.
          </p>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-muted-foreground text-sm">Laden...</div>
      </div>
    );
  }

  // --- Confirmation / Already booked ---
  if (existingAppointment || booked) {
    const appDate = booked
      ? bookedDate
      : format(new Date(existingAppointment.appointment_date), "dd. MMMM yyyy", { locale: de });
    const appTime = booked
      ? bookedTime
      : existingAppointment.appointment_time?.slice(0, 5);

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
          {logoUrl && (
            <img src={logoUrl} alt={companyName || "Logo"} className="h-10 mx-auto object-contain" />
          )}
          <div className="text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 mx-auto" style={{ color: brandColor }} />
            <h2 className="text-xl font-semibold">Termin bestätigt</h2>
            <p className="text-sm text-muted-foreground">
              {applicantName}, Ihr Bewerbungsgespräch wurde erfolgreich gebucht.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 space-y-1 text-center">
            <p className="font-medium">{appDate}</p>
            <p className="font-medium">{appTime} Uhr</p>
          </div>
          <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Bitte seien Sie zu diesem Zeitpunkt telefonisch erreichbar. Wir rufen Sie an.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Booking page: ONE unified card ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-start justify-center">
      <div className="max-w-2xl w-full mt-8 md:mt-16">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header section */}
          <div className="p-6 pb-0 space-y-4">
            {logoUrl && (
              <img src={logoUrl} alt={companyName || "Logo"} className="h-10 object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Termin buchen</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Wählen Sie einen passenden Termin für Ihr Bewerbungsgespräch
                {companyName ? ` bei ${companyName}` : ""}.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{applicantName}</span>
              {applicantPhone && (
                <span className="ml-3">{applicantPhone}</span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 mx-6 mt-4" />

          {/* Calendar + Time slots */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Calendar */}
            <div className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Datum</p>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d);
                  setSelectedTime(null);
                }}
                disabled={(date) =>
                  isWeekend(date) || isBefore(date, startOfDay(new Date()))
                }
                locale={de}
                className="pointer-events-auto"
                classNames={{
                  day_selected: "!text-white",
                }}
                modifiersStyles={{
                  selected: { backgroundColor: brandColor, color: "white" },
                }}
              />
            </div>

            {/* Time slots */}
            <div className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Uhrzeit</p>
              {!selectedDate ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Bitte wählen Sie zuerst ein Datum.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 max-h-[340px] overflow-y-auto">
                  {availableTimeSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-2 py-4 text-center">
                      Keine verfügbaren Zeiten.
                    </p>
                  ) : availableTimeSlots.map((time) => {
                    const isBooked = bookedTimesForDate.has(time);
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        disabled={isBooked}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "py-2 px-3 rounded-md text-sm font-medium transition-colors border",
                          isBooked
                            ? "bg-slate-50 text-slate-300 cursor-not-allowed border-transparent"
                            : isSelected
                            ? "text-white border-transparent"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-foreground"
                        )}
                        style={
                          isSelected && !isBooked
                            ? { backgroundColor: brandColor }
                            : undefined
                        }
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Book button */}
          <AnimatePresence>
            {selectedDate && selectedTime && (
              <div className="p-6 pt-0">
                <div className="border-t border-slate-200 pt-5">
                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: brandColor }}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Termin buchen: {format(selectedDate, "dd.MM.yyyy")} um {selectedTime} Uhr
                  </Button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Termin bestätigen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Möchten Sie folgenden Termin verbindlich buchen?
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1 text-sm">
              <p className="font-medium">
                {selectedDate && format(selectedDate, "EEEE, dd. MMMM yyyy", { locale: de })}
              </p>
              <p className="font-medium">{selectedTime} Uhr</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
              className="text-white"
              style={{ backgroundColor: brandColor }}
            >
              {bookMutation.isPending ? "Wird gebucht..." : "Bestätigen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
