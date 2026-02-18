import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Apple, Play, Target, HelpCircle, Download, Star, CalendarCheck, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { sendSms } from "@/lib/sendSms";
import { format, isWeekend, isBefore, startOfDay, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContextType {
  contract: { id: string; first_name: string | null; application_id: string } | null;
  branding: { logo_url: string | null; company_name: string; brand_color: string | null } | null;
  loading: boolean;
}

interface Order {
  id: string;
  order_number: string;
  title: string;
  provider: string;
  reward: string;
  is_placeholder: boolean;
  appstore_url: string | null;
  playstore_url: string | null;
  project_goal: string | null;
  review_questions: unknown;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
}

const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${min}`;
});

const AuftragDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contract, loading: layoutLoading } = useOutletContext<ContextType>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<string>("offen");
  const [reviewUnlocked, setReviewUnlocked] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!contract || !id) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      const { data: assignment } = await supabase
        .from("order_assignments")
        .select("id, status, review_unlocked")
        .eq("order_id", id)
        .eq("contract_id", contract.id)
        .maybeSingle();

      if (!assignment) {
        setError("Dieser Auftrag ist dir nicht zugewiesen.");
        setLoading(false);
        return;
      }

      setAssignmentStatus(assignment.status ?? "offen");
      setReviewUnlocked(!!(assignment as any).review_unlocked);

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchError || !data) {
        setError("Auftrag konnte nicht geladen werden.");
      } else {
        setOrder(data);

        // Load existing appointment for non-placeholder
        if (!data.is_placeholder) {
          const { data: appt } = await supabase
            .from("order_appointments")
            .select("id, appointment_date, appointment_time")
            .eq("order_id", id)
            .eq("contract_id", contract.id)
            .maybeSingle();
          if (appt) setAppointment(appt as Appointment);
        }
      }
      setLoading(false);
    };

    fetchOrder();
  }, [contract, id]);

  const questions: string[] = (() => {
    if (!order?.review_questions) return [];
    try {
      const parsed = Array.isArray(order.review_questions)
        ? order.review_questions
        : JSON.parse(String(order.review_questions));
      return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === "string") : [];
    } catch {
      return [];
    }
  })();

  const canReview = assignmentStatus === "offen" || assignmentStatus === "fehlgeschlagen";
  const reviewButtonText = assignmentStatus === "in_pruefung"
    ? "In Überprüfung"
    : assignmentStatus === "erfolgreich"
    ? "Erfolgreich abgeschlossen"
    : assignmentStatus === "fehlgeschlagen"
    ? "Erneut bewerten"
    : "Bewertung starten";

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

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !contract || !order) return;
    setBooking(true);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const timeStr = selectedTime + ":00";

    const { error: insertError } = await supabase
      .from("order_appointments")
      .insert({
        order_id: order.id,
        contract_id: contract.id,
        appointment_date: dateStr,
        appointment_time: timeStr,
      });

    if (insertError) {
      toast.error("Termin konnte nicht gebucht werden.");
      setBooking(false);
      return;
    }

    // Insert system message in chat
    const formattedDate = format(selectedDate, "d. MMMM yyyy", { locale: de });
    const systemContent = `Auftragstermin gebucht: „${order.title}" am ${formattedDate} um ${selectedTime} Uhr. Der Auftrag wird im Livechat durchgeführt.`;

    const { error: chatError } = await supabase.from("chat_messages").insert({
      contract_id: contract.id,
      sender_role: "system",
      content: systemContent,
    });
    if (chatError) {
      console.error("Systemnachricht konnte nicht gesendet werden:", chatError);
    }

    // Send confirmation email
    const { data: contractData } = await supabase
      .from("employment_contracts")
      .select("email, first_name, last_name, phone, applications(branding_id)")
      .eq("id", contract.id)
      .single();

    if (contractData?.email) {
      const brandingId = (contractData as any)?.applications?.branding_id;
      await sendEmail({
        to: contractData.email,
        recipient_name: `${contractData.first_name || ""} ${contractData.last_name || ""}`.trim(),
        subject: "Auftragstermin bestaetigt",
        body_title: "Ihr Auftragstermin wurde gebucht",
        body_lines: [
          `Sehr geehrte/r ${contractData.first_name || ""} ${contractData.last_name || ""},`,
          `Ihr Termin fuer den Auftrag "${order.title}" wurde erfolgreich gebucht.`,
          `Datum: ${formattedDate}`,
          `Uhrzeit: ${selectedTime} Uhr`,
          "Der Auftrag wird im Livechat durchgefuehrt. Bitte seien Sie zum vereinbarten Zeitpunkt erreichbar.",
        ],
        branding_id: brandingId || null,
        event_type: "termin_gebucht",
        metadata: { order_id: order.id, contract_id: contract.id },
      });
    }

    // SMS
    if (contractData?.phone) {
      const name = `${contractData.first_name || ""} ${contractData.last_name || ""}`.trim();
      const { data: tpl } = await supabase.from("sms_templates" as any).select("message").eq("event_type", "termin_gebucht").single();
      const smsText = (tpl as any)?.message
        ? (tpl as any).message.replace("{name}", name).replace("{datum}", formattedDate).replace("{uhrzeit}", selectedTime)
        : `Hallo ${name}, Ihr Termin am ${formattedDate} um ${selectedTime} Uhr wurde bestätigt.`;
      await sendSms({ to: contractData.phone, text: smsText, event_type: "termin_gebucht", recipient_name: name });
    }

    setAppointment({
      id: "new",
      appointment_date: dateStr,
      appointment_time: timeStr,
    });
    toast.success("Termin erfolgreich gebucht!");
    setBooking(false);
  };

  if (layoutLoading || loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück
        </Button>
        <Card className="border-destructive/40">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) return null;

  const isNonPlaceholder = !order.is_placeholder;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück
        </Button>
        <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
          #{order.order_number}
        </Badge>
      </motion.div>

      {/* Title & Meta */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="border border-border/60 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/40" />
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              {order.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Anbieter</span>
              <p className="font-medium text-foreground">{order.provider}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Prämie</span>
              <p className="font-semibold text-primary">{order.reward}{order.reward.includes("€") ? "" : " €"}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Downloads */}
      {(order.appstore_url || order.playstore_url) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Download className="h-4 w-4 text-primary" />
                Downloads
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {order.appstore_url && (
                <a href={order.appstore_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Apple className="h-4 w-4" /> App Store
                  </Button>
                </a>
              )}
              {order.playstore_url && (
                <a href={order.playstore_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Play className="h-4 w-4" /> Play Store
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Project Goal */}
      {order.project_goal && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Target className="h-4 w-4 text-primary" />
                Projektziel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {order.project_goal}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Non-Placeholder: Appointment Booking */}
      {isNonPlaceholder && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {appointment ? (
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  Termin gebucht
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center space-y-1">
                  <p className="font-medium text-foreground">
                    {format(new Date(appointment.appointment_date), "EEEE, d. MMMM yyyy", { locale: de })}
                  </p>
                  <p className="font-medium text-foreground">
                    {appointment.appointment_time.slice(0, 5)} Uhr
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-4">
                  <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Der Auftrag wird gemeinsam mit Ihrem Ansprechpartner im Livechat durchgeführt. Bitte seien Sie zum vereinbarten Zeitpunkt im Chat erreichbar.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  Termin buchen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-4">
                  <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Dieser Auftrag wird gemeinsam mit Ihrem Ansprechpartner im Livechat durchgeführt. Bitte buchen Sie einen Termin.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <div>
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
                    />
                  </div>

                  {/* Time slots */}
                  <div>
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
                          const isSelected = selectedTime === time;
                          return (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={cn(
                                "py-2 px-3 rounded-md text-sm font-medium transition-colors border",
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-card border-border hover:bg-muted text-foreground"
                              )}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {selectedDate && selectedTime && (
                  <>
                    <Separator />
                    <Button
                      className="w-full"
                      onClick={handleBookAppointment}
                      disabled={booking}
                    >
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      {booking ? "Wird gebucht..." : `Termin buchen: ${format(selectedDate, "dd.MM.yyyy")} um ${selectedTime} Uhr`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Review Questions (only for placeholder orders) */}
      {questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <HelpCircle className="h-4 w-4 text-primary" />
                Bewertungsfragen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {q}
                  </li>
                ))}
              </ol>
              <Separator />
              {/* Placeholder orders: always show review button */}
              {/* Non-placeholder orders: only show if review_unlocked */}
              {order.is_placeholder || reviewUnlocked ? (
                <Button
                  onClick={() => navigate(`/mitarbeiter/bewertung/${order.id}`)}
                  disabled={!canReview}
                  className="gap-2"
                  variant={assignmentStatus === "fehlgeschlagen" ? "destructive" : "default"}
                >
                  <Star className="h-4 w-4" />
                  {reviewButtonText}
                </Button>
              ) : (
                <div className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-4">
                  <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Die Bewertung wird nach Freigabe durch Ihren Ansprechpartner freigeschaltet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AuftragDetails;
