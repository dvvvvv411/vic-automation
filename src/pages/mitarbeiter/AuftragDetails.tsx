import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Apple, Play, Target, HelpCircle, Download, Star, CalendarCheck, MessageCircle, Upload, FileText, CheckCircle, XCircle, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { sendSms } from "@/lib/sendSms";
import { sendTelegram } from "@/lib/sendTelegram";
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
  description?: string;
  order_type?: string;
  work_steps?: Array<{ title: string; description: string }>;
  required_attachments?: Array<{ title: string; description: string }>;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
}

interface OrderAttachment {
  id: string;
  attachment_index: number;
  file_url: string;
  file_name: string | null;
  status: string;
}

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
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
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [submittingAttachments, setSubmittingAttachments] = useState(false);

  const loadAttachments = useCallback(async () => {
    if (!contract || !id) return;
    const { data } = await supabase
      .from("order_attachments" as any)
      .select("*")
      .eq("order_id", id)
      .eq("contract_id", contract.id);
    setAttachments((data ?? []) as unknown as OrderAttachment[]);
  }, [contract, id]);

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

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchError || !data) {
        setError("Auftrag konnte nicht geladen werden.");
      } else {
        setOrder(data as any);

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
      await loadAttachments();
      setLoading(false);
    };

    fetchOrder();
  }, [contract, id, loadAttachments]);

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

  const workSteps = order?.work_steps ?? [];
  const requiredAttachments = order?.required_attachments ?? [];

  const canReview = assignmentStatus === "offen" || assignmentStatus === "fehlgeschlagen";
  const reviewButtonText = assignmentStatus === "in_pruefung"
    ? "In Überprüfung"
    : assignmentStatus === "erfolgreich"
    ? "Erfolgreich abgeschlossen"
    : assignmentStatus === "fehlgeschlagen"
    ? "Erneut bewerten"
    : "Bewertung starten";

  const { data: blockedOrderSlots } = useQuery({
    queryKey: ["order-appointment-blocked-slots", selectedDate ? format(selectedDate, "yyyy-MM-dd") : null],
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("order_appointment_blocked_slots" as any)
        .select("blocked_time")
        .eq("blocked_date", dateStr);
      if (error) throw error;
      return (data || []) as unknown as Array<{ blocked_time: string }>;
    },
    enabled: !!selectedDate,
  });

  const availableTimeSlots = useMemo(() => {
    let slots = TIME_SLOTS;
    if (selectedDate && isToday(selectedDate)) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      slots = slots.filter((time) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m > currentMinutes;
      });
    }
    if (blockedOrderSlots && blockedOrderSlots.length > 0) {
      const blockedSet = new Set(blockedOrderSlots.map((s) => s.blocked_time?.slice(0, 5)));
      slots = slots.filter((time) => !blockedSet.has(time));
    }
    return slots;
  }, [selectedDate, blockedOrderSlots]);

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

    const formattedDate = format(selectedDate, "d. MMMM yyyy", { locale: de });
    const systemContent = `Auftragstermin gebucht: „${order.title}" am ${formattedDate} um ${selectedTime} Uhr. Der Auftrag wird im Livechat durchgeführt.`;

    await supabase.from("chat_messages").insert({
      contract_id: contract.id,
      sender_role: "system",
      content: systemContent,
    });

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
        subject: "Auftragstermin bestätigt",
        body_title: "Ihr Auftragstermin wurde gebucht",
        body_lines: [
          `Sehr geehrte/r ${contractData.first_name || ""} ${contractData.last_name || ""},`,
          `Ihr Termin für den Auftrag "${order.title}" wurde erfolgreich gebucht.`,
          `Datum: ${formattedDate}`,
          `Uhrzeit: ${selectedTime} Uhr`,
          "Der Auftrag wird im Livechat durchgeführt.",
        ],
        branding_id: brandingId || null,
        event_type: "termin_gebucht",
        metadata: { order_id: order.id, contract_id: contract.id },
      });
    }

    if (contractData?.phone) {
      const name = `${contractData.first_name || ""} ${contractData.last_name || ""}`.trim();
      const { data: tpl } = await supabase.from("sms_templates" as any).select("message").eq("event_type", "termin_gebucht").single();
      const smsText = (tpl as any)?.message
        ? (tpl as any).message.replace("{name}", name).replace("{datum}", formattedDate).replace("{uhrzeit}", selectedTime)
        : `Hallo ${name}, Ihr Termin am ${formattedDate} um ${selectedTime} Uhr wurde bestätigt.`;
      let smsSender: string | undefined;
      const brandingId = (contractData as any)?.applications?.branding_id;
      if (brandingId) {
        const { data: branding } = await supabase.from("brandings").select("sms_sender_name" as any).eq("id", brandingId).single();
        smsSender = (branding as any)?.sms_sender_name || undefined;
      }
      await sendSms({ to: contractData.phone, text: smsText, event_type: "termin_gebucht", recipient_name: name, from: smsSender, branding_id: brandingId || null });
    }

    const empName = contract.first_name || "Mitarbeiter";
    await sendTelegram("auftragstermin_gebucht", `📅 Auftragstermin gebucht\n\nMitarbeiter: ${empName}\nAuftrag: ${order.title}\nDatum: ${formattedDate}\nUhrzeit: ${selectedTime} Uhr`);

    setAppointment({ id: "new", appointment_date: dateStr, appointment_time: timeStr });
    toast.success("Termin erfolgreich gebucht!");
    setBooking(false);
  };

  const handleFileUpload = async (attachmentIndex: number, file: File) => {
    if (!contract || !order) return;
    setUploading(attachmentIndex);

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["png", "jpg", "jpeg", "pdf"];
    if (!ext || !allowed.includes(ext)) {
      toast.error("Nur PNG, JPG, JPEG und PDF Dateien erlaubt.");
      setUploading(null);
      return;
    }

    const path = `${contract.id}/${order.id}/${attachmentIndex}_${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("order-attachments").upload(path, file);
    if (uploadErr) {
      toast.error("Upload fehlgeschlagen.");
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("order-attachments").getPublicUrl(path);

    // Delete old attachment for this index if exists
    await supabase
      .from("order_attachments" as any)
      .delete()
      .eq("order_id", order.id)
      .eq("contract_id", contract.id)
      .eq("attachment_index", attachmentIndex);

    const { error: insertErr } = await supabase.from("order_attachments" as any).insert({
      order_id: order.id,
      contract_id: contract.id,
      attachment_index: attachmentIndex,
      file_url: urlData.publicUrl,
      file_name: file.name,
    } as any);

    if (insertErr) {
      toast.error("Anhang konnte nicht gespeichert werden.");
      setUploading(null);
      return;
    }

    await loadAttachments();
    toast.success("Anhang hochgeladen!");
    setUploading(null);
  };

  if (layoutLoading || loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-48 rounded-xl" />
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück
        </Button>
        {order.order_type && (
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
            {order.order_type}
          </Badge>
        )}
      </motion.div>

      {/* Title & Meta */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
        <Card className="border border-border/60 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/40" />
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">{order.title}</CardTitle>
            {order.description && (
              <p className="text-sm text-muted-foreground mt-1">{order.description}</p>
            )}
          </CardHeader>
          <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {order.provider && (
              <div>
                <span className="text-muted-foreground">Anbieter</span>
                <p className="font-medium text-foreground">{order.provider}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Prämie</span>
              <p className="font-semibold text-primary">{order.reward}{order.reward.includes("€") ? "" : " €"}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Downloads */}
      {(order.appstore_url || order.playstore_url) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Download className="h-4 w-4 text-primary" /> Downloads
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {order.appstore_url && (
                <a href={order.appstore_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2"><Apple className="h-4 w-4" /> App Store</Button>
                </a>
              )}
              {order.playstore_url && (
                <a href={order.playstore_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2"><Play className="h-4 w-4" /> Play Store</Button>
                </a>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Project Goal */}
      {order.project_goal && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Target className="h-4 w-4 text-primary" /> Projektziel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{order.project_goal}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Work Steps */}
      {workSteps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.17 }}>
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <ListChecks className="h-4 w-4 text-primary" /> Arbeitsschritte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workSteps.map((ws, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="font-medium text-foreground text-sm">{ws.title}</span>
                  </div>
                  {ws.description && (
                    <p className="text-sm text-muted-foreground ml-8">{ws.description}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Non-Placeholder: Appointment Booking */}
      {isNonPlaceholder && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          {appointment ? (
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <CalendarCheck className="h-4 w-4 text-primary" /> Termin gebucht
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center space-y-1">
                  <p className="font-medium text-foreground">{format(new Date(appointment.appointment_date), "EEEE, d. MMMM yyyy", { locale: de })}</p>
                  <p className="font-medium text-foreground">{appointment.appointment_time.slice(0, 5)} Uhr</p>
                </div>
                <div className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-4">
                  <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">Der Auftrag wird gemeinsam mit Ihrem Ansprechpartner im Livechat durchgeführt.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <CalendarCheck className="h-4 w-4 text-primary" /> Termin buchen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-4">
                  <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">Dieser Auftrag wird gemeinsam mit Ihrem Ansprechpartner im Livechat durchgeführt.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Datum</p>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                      disabled={(date) => isWeekend(date) || isBefore(date, startOfDay(new Date()))}
                      locale={de}
                      className="pointer-events-auto"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Uhrzeit</p>
                    {!selectedDate ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">Bitte wählen Sie zuerst ein Datum.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 max-h-[340px] overflow-y-auto">
                        {availableTimeSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground col-span-2 py-4 text-center">Keine verfügbaren Zeiten.</p>
                        ) : availableTimeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "py-2 px-3 rounded-md text-sm font-medium transition-colors border",
                              selectedTime === time
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border hover:bg-muted text-foreground"
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {selectedDate && selectedTime && (
                  <>
                    <Separator />
                    <Button className="w-full" onClick={handleBookAppointment} disabled={booking}>
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

      {/* Review Questions - always accessible */}
      {questions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <HelpCircle className="h-4 w-4 text-primary" /> Bewertungsfragen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed">{q}</li>
                ))}
              </ol>
              <Separator />
              <Button
                onClick={() => navigate(`/mitarbeiter/bewertung/${order.id}`)}
                disabled={!canReview}
                className="gap-2"
                variant={assignmentStatus === "fehlgeschlagen" ? "destructive" : "default"}
              >
                <Star className="h-4 w-4" />
                {reviewButtonText}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Required Attachments */}
      {requiredAttachments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-primary" /> Erforderliche Anhänge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {requiredAttachments.map((ra, i) => {
                const uploaded = attachments.find((a) => a.attachment_index === i);
                const statusColor = uploaded?.status === "genehmigt"
                  ? "border-green-300 bg-green-50/50"
                  : uploaded?.status === "abgelehnt"
                  ? "border-red-300 bg-red-50/50"
                  : uploaded
                  ? "border-blue-300 bg-blue-50/50"
                  : "border-border";

                return (
                  <div key={i} className={cn("rounded-lg border p-4 space-y-3", statusColor)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">{ra.title}</p>
                        {ra.description && <p className="text-xs text-muted-foreground mt-0.5">{ra.description}</p>}
                      </div>
                      {uploaded && (
                        <Badge variant={uploaded.status === "genehmigt" ? "default" : uploaded.status === "abgelehnt" ? "destructive" : "secondary"}>
                          {uploaded.status === "genehmigt" ? "Genehmigt" : uploaded.status === "abgelehnt" ? "Abgelehnt" : "Eingereicht"}
                        </Badge>
                      )}
                    </div>

                    {uploaded ? (
                      <div className="flex items-center gap-3">
                        <a href={uploaded.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {uploaded.file_name || "Datei ansehen"}
                        </a>
                        {(uploaded.status === "abgelehnt" || uploaded.status === "eingereicht") && (
                          <label className="cursor-pointer">
                            <Button variant="outline" size="sm" className="gap-1.5" asChild>
                              <span>
                                <Upload className="h-3.5 w-3.5" />
                                {uploaded.status === "abgelehnt" ? "Erneut hochladen" : "Ersetzen"}
                              </span>
                            </Button>
                            <input
                              type="file"
                              className="hidden"
                              accept=".png,.jpg,.jpeg,.pdf"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(i, f);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" className="gap-1.5" disabled={uploading === i} asChild>
                          <span>
                            <Upload className="h-3.5 w-3.5" />
                            {uploading === i ? "Wird hochgeladen..." : "Datei hochladen"}
                          </span>
                        </Button>
                        <input
                          type="file"
                          className="hidden"
                          accept=".png,.jpg,.jpeg,.pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(i, f);
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AuftragDetails;
