import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarCheck, Clock, Phone, AlertCircle, CheckCircle2, User } from "lucide-react";
import { format, isWeekend, isBefore, startOfDay, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
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

  // Load application + branding
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

  // Load all booked appointments
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

  // Check if already booked
  const existingAppointment = application?.interview_appointments?.[0];

  const applicantName = application ? `${application.first_name} ${application.last_name}` : "";
  const applicantPhone = application?.phone;

  // Filter time slots: hide past slots if today is selected
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
        .insert({
          application_id: id!,
          appointment_date: dateStr,
          appointment_time: timeStr,
        });
      if (insertError) throw insertError;

      // Update status via RPC
      const { error: rpcError } = await supabase.rpc("update_application_status", {
        _application_id: id!,
        _status: "termin_gebucht",
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
    onError: () => {
      setConfirmOpen(false);
    },
  });

  // Error state
  if (!isLoading && (error || !application)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ungültiger Link</h2>
            <p className="text-muted-foreground">
              Dieser Bewerbungslink ist ungültig oder nicht mehr aktiv.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  // Already booked or just booked
  if (existingAppointment || booked) {
    const appDate = booked
      ? bookedDate
      : format(new Date(existingAppointment.appointment_date), "dd. MMMM yyyy", { locale: de });
    const appTime = booked
      ? bookedTime
      : existingAppointment.appointment_time?.slice(0, 5);

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${brandColor}10, ${brandColor}05, #f8fafc)` }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-lg w-full shadow-xl border-0">
            <CardContent className="pt-10 pb-10 text-center space-y-6">
              {logoUrl && (
                <img src={logoUrl} alt={companyName || "Logo"} className="h-12 mx-auto object-contain" />
              )}
              <div
                className="h-16 w-16 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <CheckCircle2 className="h-8 w-8" style={{ color: brandColor }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Termin bestätigt!</h2>
                <p className="text-muted-foreground">
                  {applicantName}, Ihr Bewerbungsgespräch wurde erfolgreich gebucht.
                </p>
              </div>
              <div
                className="rounded-xl p-5 space-y-3"
                style={{ backgroundColor: `${brandColor}08` }}
              >
                <div className="flex items-center gap-3 justify-center">
                  <CalendarCheck className="h-5 w-5" style={{ color: brandColor }} />
                  <span className="font-semibold text-lg">{appDate}</span>
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <Clock className="h-5 w-5" style={{ color: brandColor }} />
                  <span className="font-semibold text-lg">{appTime} Uhr</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left bg-amber-50 border border-amber-200 rounded-lg p-4">
                <Phone className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  Bitte seien Sie zu diesem Zeitpunkt telefonisch erreichbar. Wir rufen Sie an.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Booking page
  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ background: `linear-gradient(135deg, ${brandColor}08, #f8fafc, ${brandColor}04)` }}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 pt-6"
        >
          {logoUrl && (
            <img src={logoUrl} alt={companyName || "Logo"} className="h-14 mx-auto object-contain" />
          )}
          <div>
            <h1 className="text-3xl font-bold">Termin buchen</h1>
            <p className="text-muted-foreground mt-2">
              Wählen Sie einen passenden Termin für Ihr Bewerbungsgespräch
              {companyName ? ` bei ${companyName}` : ""}.
            </p>
          </div>
        </motion.div>

        {/* Applicant Info */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-md border-0">
            <CardContent className="py-5 px-6 flex items-center gap-4">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <User className="h-5 w-5" style={{ color: brandColor }} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-lg">Hallo {applicantName}</p>
                {applicantPhone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {applicantPhone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar + Time slots */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Calendar */}
                <div className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5" style={{ color: brandColor }} />
                    Tag auswählen
                  </h3>
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
                  />
                </div>

                {/* Time slots */}
                <div className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" style={{ color: brandColor }} />
                    Uhrzeit auswählen
                  </h3>
                  {!selectedDate ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Bitte wählen Sie zuerst einen Tag aus.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                      <AnimatePresence mode="popLayout">
                        {availableTimeSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground col-span-2 py-4 text-center">
                            Keine verfügbaren Termine mehr für heute.
                          </p>
                        ) : availableTimeSlots.map((time) => {
                          const isBooked = bookedTimesForDate.has(time);
                          const isSelected = selectedTime === time;
                          return (
                            <motion.div
                              key={time}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <button
                                disabled={isBooked}
                                onClick={() => setSelectedTime(time)}
                                className={cn(
                                  "w-full py-2.5 px-3 rounded-lg text-sm font-medium transition-all border",
                                  isBooked
                                    ? "bg-muted text-muted-foreground/40 cursor-not-allowed border-transparent"
                                    : isSelected
                                    ? "text-white shadow-md border-transparent"
                                    : "bg-background border-border hover:border-primary/30 hover:bg-primary/5"
                                )}
                                style={
                                  isSelected && !isBooked
                                    ? { backgroundColor: brandColor, borderColor: brandColor }
                                    : undefined
                                }
                              >
                                {time} Uhr
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Book button */}
        <AnimatePresence>
          {selectedDate && selectedTime && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center"
            >
              <Button
                size="lg"
                className="text-white shadow-lg px-8 text-base"
                style={{ backgroundColor: brandColor }}
                onClick={() => setConfirmOpen(true)}
              >
                Termin buchen: {format(selectedDate, "dd.MM.yyyy")} um {selectedTime} Uhr
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Termin bestätigen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Möchten Sie folgenden Termin verbindlich buchen?
            </p>
            <div
              className="rounded-lg p-4 space-y-2"
              style={{ backgroundColor: `${brandColor}08` }}
            >
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" style={{ color: brandColor }} />
                <span className="font-medium">
                  {selectedDate && format(selectedDate, "EEEE, dd. MMMM yyyy", { locale: de })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: brandColor }} />
                <span className="font-medium">{selectedTime} Uhr</span>
              </div>
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
              {bookMutation.isPending ? "Wird gebucht..." : "Termin bestätigen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
