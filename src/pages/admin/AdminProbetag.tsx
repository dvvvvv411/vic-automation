import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { sendSms } from "@/lib/sendSms";
import { buildBrandingUrl } from "@/lib/buildBrandingUrl";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { Calendar, ChevronLeft, ChevronRight, History, ArrowRight, CheckCircle, XCircle, Search, Trash2, MessageSquare, Link2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { format, addDays, subHours } from "date-fns";
import { toast } from "sonner";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";
import BrandingNotes from "@/components/admin/BrandingNotes";

const PAGE_SIZE = 20;
type ViewMode = "default" | "past" | "future";

export default function AdminProbetag() {
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [search, setSearch] = useState("");
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderPreview, setReminderPreview] = useState<{ item: any; message: string; name: string; phone: string; brandingId?: string; senderName?: string } | null>(null);
  const [successPreview, setSuccessPreview] = useState<{ item: any; message: string; name: string; phone: string; brandingId?: string; senderName?: string } | null>(null);
  const [spoofPreview, setSpoofPreview] = useState<{ item: any; message: string; name: string; phone: string; brandingId?: string; senderName?: string } | null>(null);
  const [sendingSuccess, setSendingSuccess] = useState<string | null>(null);
  const [sendingSpoof, setSendingSpoof] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { activeBrandingId, ready } = useBrandingFilter();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const tomorrow = format(addDays(now, 1), "yyyy-MM-dd");
  const cutoffTime = format(subHours(now, 3), "HH:mm:ss");

  const { data, isLoading } = useQuery({
    queryKey: ["trial-day-appointments-admin", page, viewMode, activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      let query = supabase
        .from("trial_day_appointments" as any)
        .select("*, applications!inner(first_name, last_name, email, phone, employment_type, branding_id, brandings(id, company_name))", { count: "exact" })
        .eq("applications.branding_id", activeBrandingId!);

      if (viewMode === "past") {
        query = query
          .or(`appointment_date.lt.${today},and(appointment_date.eq.${today},appointment_time.lt.${cutoffTime})`)
          .order("appointment_date", { ascending: false })
          .order("appointment_time", { ascending: false });
      } else if (viewMode === "future") {
        query = query.gt("appointment_date", tomorrow).order("appointment_date", { ascending: true }).order("appointment_time", { ascending: true });
      } else {
        query = query
          .or(`and(appointment_date.eq.${today},appointment_time.gte.${cutoffTime}),appointment_date.eq.${tomorrow}`)
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true });
      }

      const { data, error, count } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;

      return { items: (data || []) as any[], total: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handleStatusUpdate = async (item: any, newStatus: string) => {
    const { error } = await supabase.rpc("update_trial_day_status" as any, {
      _appointment_id: item.id,
      _status: newStatus,
    });
    if (error) {
      toast.error("Status konnte nicht aktualisiert werden.");
      return;
    }
    toast.success(`Status auf "${newStatus}" gesetzt.`);
    queryClient.invalidateQueries({ queryKey: ["trial-day-appointments-admin"] });
  };

  const handlePrepareReminder = async (item: any) => {
    const app = item.applications;
    if (!app?.phone) {
      toast.error("Keine Telefonnummer vorhanden");
      return;
    }
    setSendingReminder(item.id);
    try {
      const brandingId = app.brandings?.id;
      let senderName: string | undefined;
      if (brandingId) {
        const { data: branding } = await supabase
          .from("brandings")
          .select("sms_sender_name" as any)
          .eq("id", brandingId)
          .maybeSingle();
        senderName = (branding as any)?.sms_sender_name || undefined;
      }

      const { data: template } = await supabase
        .from("sms_templates" as any)
        .select("message")
        .eq("event_type", "probetag_erinnerung")
        .maybeSingle();

      const name = `${app.first_name} ${app.last_name}`;
      const smsText = ((template as any)?.message || "Hallo {name}, Sie hatten einen Probetag-Termin bei uns. Falls Sie den Termin nicht wahrnehmen konnten, buchen Sie bitte einen neuen Termin über den Link in Ihrer E-Mail.")
        .replace(/\{name\}/g, name);

      setReminderPreview({ item, message: smsText, name, phone: app.phone, brandingId, senderName });
    } catch (err) {
      console.error("Reminder prepare error:", err);
      toast.error("Fehler beim Laden der Vorlage");
    } finally {
      setSendingReminder(null);
    }
  };

  const handleConfirmReminder = async () => {
    if (!reminderPreview) return;
    const { item, message, name, brandingId, senderName } = reminderPreview;
    const app = item.applications;
    setSendingReminder(item.id);
    try {
      const smsOk = await sendSms({
        to: app.phone,
        text: message,
        event_type: "probetag_erinnerung",
        recipient_name: name,
        from: senderName,
        branding_id: brandingId || null,
      });

      const rebookingUrl = await buildBrandingUrl(brandingId || null, `/probetag/${item.application_id}`);

      await sendEmail({
        to: app.email,
        recipient_name: name,
        subject: "Erinnerung an Ihren Probetag",
        body_title: "Erinnerung an Ihren Probetag",
        body_lines: [
          `Sehr geehrte/r ${name},`,
          message,
          "Falls Sie den Termin nicht wahrnehmen konnten, haben Sie die Möglichkeit, einen neuen Termin zu buchen.",
        ],
        button_text: "Neuen Probetag buchen",
        button_url: rebookingUrl,
        branding_id: brandingId || null,
        event_type: "probetag_erinnerung",
        metadata: { appointment_id: item.id, application_id: item.application_id },
      });

      // Increment reminder_count and add timestamp
      const currentTimestamps = Array.isArray(item.reminder_timestamps) ? item.reminder_timestamps : [];
      await supabase
        .from("trial_day_appointments" as any)
        .update({
          reminder_count: (item.reminder_count || 0) + 1,
          reminder_timestamps: [...currentTimestamps, new Date().toISOString()],
        } as any)
        .eq("id", item.id);

      if (smsOk) {
        toast.success("Erinnerung (SMS + E-Mail) gesendet!");
      } else {
        toast.warning("E-Mail gesendet, SMS fehlgeschlagen");
      }
      queryClient.invalidateQueries({ queryKey: ["trial-day-appointments-admin"] });
    } catch (err) {
      console.error("Reminder error:", err);
      toast.error("Fehler beim Senden der Erinnerung");
    } finally {
      setSendingReminder(null);
      setReminderPreview(null);
    }
  };

  // === Success notification (Probetag erfolgreich) ===
  const handlePrepareSuccess = async (item: any) => {
    const app = item.applications;
    if (!app?.phone) {
      toast.error("Keine Telefonnummer vorhanden");
      return;
    }
    setSendingSuccess(item.id);
    try {
      const brandingId = app.brandings?.id;
      let senderName: string | undefined;
      if (brandingId) {
        const { data: branding } = await supabase
          .from("brandings")
          .select("sms_sender_name" as any)
          .eq("id", brandingId)
          .maybeSingle();
        senderName = (branding as any)?.sms_sender_name || undefined;
      }

      const { data: template } = await supabase
        .from("sms_templates" as any)
        .select("message")
        .eq("event_type", "probetag_erfolgreich")
        .maybeSingle();

      const name = `${app.first_name} ${app.last_name}`;
      const smsText = ((template as any)?.message || "Hallo {name}, herzlichen Glückwunsch! Ihr Probetag war erfolgreich. Wir freuen uns auf die Zusammenarbeit mit Ihnen!")
        .replace(/\{name\}/g, name);

      setSuccessPreview({ item, message: smsText, name, phone: app.phone, brandingId, senderName });
    } catch (err) {
      console.error("Success prepare error:", err);
      toast.error("Fehler beim Laden der Vorlage");
    } finally {
      setSendingSuccess(null);
    }
  };

  const handleConfirmSuccess = async () => {
    if (!successPreview) return;
    const { item, message, name, brandingId, senderName } = successPreview;
    const app = item.applications;
    setSendingSuccess(item.id);
    try {
      const smsOk = await sendSms({
        to: app.phone,
        text: message,
        event_type: "probetag_erfolgreich",
        recipient_name: name,
        from: senderName,
        branding_id: brandingId || null,
      });

      const dashboardUrl = await buildBrandingUrl(brandingId || null, "/");

      await sendEmail({
        to: app.email,
        recipient_name: name,
        subject: "Ihr Probetag war erfolgreich!",
        body_title: "Herzlichen Glückwunsch!",
        body_lines: [
          `Sehr geehrte/r ${name},`,
          "Ihr Probetag war erfolgreich! Wir freuen uns auf die Zusammenarbeit mit Ihnen.",
          "Bitte loggen Sie sich in Ihr Dashboard ein, um die nächsten Schritte einzusehen.",
        ],
        button_text: "Zum Dashboard",
        button_url: dashboardUrl,
        branding_id: brandingId || null,
        event_type: "probetag_erfolgreich",
        metadata: { appointment_id: item.id, application_id: item.application_id },
      });

      // Increment success_notification_count and add timestamp
      const currentTimestamps = Array.isArray(item.success_notification_timestamps) ? item.success_notification_timestamps : [];
      await supabase
        .from("trial_day_appointments" as any)
        .update({
          success_notification_count: (item.success_notification_count || 0) + 1,
          success_notification_timestamps: [...currentTimestamps, new Date().toISOString()],
        } as any)
        .eq("id", item.id);

      if (smsOk) {
        toast.success("Erfolgs-Benachrichtigung (SMS + E-Mail) gesendet!");
      } else {
        toast.warning("E-Mail gesendet, SMS fehlgeschlagen");
      }
      queryClient.invalidateQueries({ queryKey: ["trial-day-appointments-admin"] });
    } catch (err) {
      console.error("Success notification error:", err);
      toast.error("Fehler beim Senden");
    } finally {
      setSendingSuccess(null);
      setSuccessPreview(null);
    }
  };

  // === Spoof SMS with Dashboard Link ===
  const handlePrepareSpoof = async (item: any) => {
    const app = item.applications;
    if (!app?.phone) {
      toast.error("Keine Telefonnummer vorhanden");
      return;
    }
    setSendingSpoof(item.id);
    try {
      const brandingId = app.brandings?.id;
      let senderName: string | undefined;
      if (brandingId) {
        const { data: branding } = await supabase
          .from("brandings")
          .select("sms_sender_name" as any)
          .eq("id", brandingId)
          .maybeSingle();
        senderName = (branding as any)?.sms_sender_name || undefined;
      }

      const dashboardUrl = await buildBrandingUrl(brandingId || null, "/");
      const name = `${app.first_name} ${app.last_name}`;
      const smsText = `Logge dich jetzt in dein Dashboard ein: ${dashboardUrl}`;

      setSpoofPreview({ item, message: smsText, name, phone: app.phone, brandingId, senderName });
    } catch (err) {
      console.error("Spoof prepare error:", err);
      toast.error("Fehler beim Vorbereiten");
    } finally {
      setSendingSpoof(null);
    }
  };

  const handleConfirmSpoof = async () => {
    if (!spoofPreview) return;
    const { item, message, phone, brandingId, senderName, name } = spoofPreview;
    if (!senderName) {
      toast.error("Kein SMS-Absendername für dieses Branding konfiguriert");
      return;
    }
    setSendingSpoof(item.id);
    try {
      const { error } = await supabase.functions.invoke("sms-spoof", {
        body: {
          action: "send",
          to: phone,
          senderID: senderName,
          text: message,
          recipientName: name,
          brandingId: brandingId || undefined,
        },
      });
      if (error) throw error;
      toast.success("Dashboard-Link per SMS gesendet!");
    } catch (err) {
      console.error("Spoof send error:", err);
      toast.error("Fehler beim Senden der Spoof-SMS");
    } finally {
      setSendingSpoof(null);
      setSpoofPreview(null);
    }
  };

  const toggleView = (mode: ViewMode) => {
    setViewMode((prev) => (prev === mode ? "default" : mode));
    setPage(0);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "erfolgreich":
        return <Badge className="bg-green-600 text-white border-green-600">Erfolgreich</Badge>;
      case "fehlgeschlagen":
        return <Badge variant="destructive">Fehlgeschlagen</Badge>;
      default:
        return <Badge variant="outline">Neu</Badge>;
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Probetag-Termine</h2>
        <p className="text-muted-foreground mt-1">
          {viewMode === "default" && "Termine von heute und morgen."}
          {viewMode === "past" && "Vergangene Termine."}
          {viewMode === "future" && "Zukünftige Termine."}
        </p>
      </motion.div>

      {activeBrandingId && <BrandingNotes brandingId={activeBrandingId} pageContext="probetag" />}

      <div className="flex gap-2 mb-4">
        <Button variant={viewMode === "past" ? "default" : "outline"} size="sm" onClick={() => toggleView("past")}>
          <History className="h-4 w-4 mr-1" /> Vergangene Termine
        </Button>
        <Button variant={viewMode === "future" ? "default" : "outline"} size="sm" onClick={() => toggleView("future")}>
          <ArrowRight className="h-4 w-4 mr-1" /> Zukünftige Termine
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Name suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : (() => {
          const filteredItems = (data?.items ?? []).filter((item: any) => {
            if (!search.trim()) return true;
            const name = `${item.applications?.first_name ?? ""} ${item.applications?.last_name ?? ""}`.toLowerCase();
            return name.includes(search.toLowerCase().trim());
          });
          return !filteredItems.length ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Keine Probetag-Termine in dieser Ansicht.</p>
            </div>
          ) : (
            <>
              <div className="premium-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Uhrzeit</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Branding</TableHead>
                      <TableHead>Anstellungsart</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {new Date(item.appointment_date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                        </TableCell>
                        <TableCell><Badge variant="outline">{item.appointment_time?.slice(0, 5)} Uhr</Badge></TableCell>
                        <TableCell className="font-medium">{item.applications?.first_name} {item.applications?.last_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.applications?.phone ? (
                            <span className="cursor-pointer hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.applications.phone); toast.success("Telefonnummer kopiert!"); }}>{item.applications.phone}</span>
                          ) : "–"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.applications?.email}</TableCell>
                        <TableCell className="text-muted-foreground">{item.applications?.brandings?.company_name || "–"}</TableCell>
                        <TableCell className="text-muted-foreground">{item.applications?.employment_type || "–"}</TableCell>
                        <TableCell>{statusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {item.applications?.phone && (
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                  onClick={() => handlePrepareReminder(item)}
                                  disabled={sendingReminder === item.id}
                                  title="Erinnerungs-SMS & E-Mail senden"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                {item.reminder_count > 0 && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center cursor-pointer z-10">
                                        {item.reminder_count}
                                      </span>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
                                      <p className="text-sm font-semibold mb-2">Erinnerungen gesendet:</p>
                                      <ul className="space-y-1 text-xs text-muted-foreground">
                                        {(Array.isArray(item.reminder_timestamps) ? item.reminder_timestamps : []).map((ts: string, i: number) => (
                                          <li key={i}>{format(new Date(ts), "dd.MM.yyyy HH:mm")} Uhr</li>
                                        ))}
                                        {(!Array.isArray(item.reminder_timestamps) || item.reminder_timestamps.length === 0) && (
                                          <li className="italic">Keine Zeitstempel verfügbar</li>
                                        )}
                                      </ul>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            )}

                            {/* Success notification button — only for erfolgreich */}
                            {item.status === "erfolgreich" && item.applications?.phone && (
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handlePrepareSuccess(item)}
                                  disabled={sendingSuccess === item.id}
                                  title="Erfolgs-Benachrichtigung erneut senden"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                {(item.success_notification_count || 0) > 0 && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center cursor-pointer z-10">
                                        {item.success_notification_count}
                                      </span>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
                                      <p className="text-sm font-semibold mb-2">Erfolgs-Benachrichtigungen:</p>
                                      <ul className="space-y-1 text-xs text-muted-foreground">
                                        {(Array.isArray(item.success_notification_timestamps) ? item.success_notification_timestamps : []).map((ts: string, i: number) => (
                                          <li key={i}>{format(new Date(ts), "dd.MM.yyyy HH:mm")} Uhr</li>
                                        ))}
                                        {(!Array.isArray(item.success_notification_timestamps) || item.success_notification_timestamps.length === 0) && (
                                          <li className="italic">Keine Zeitstempel verfügbar</li>
                                        )}
                                      </ul>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            )}

                            {/* Spoof SMS dashboard link — only for erfolgreich */}
                            {item.status === "erfolgreich" && item.applications?.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handlePrepareSpoof(item)}
                                disabled={sendingSpoof === item.id}
                                title="Dashboard-Link per Spoof-SMS senden"
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            )}

                            {item.status !== "erfolgreich" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleStatusUpdate(item, "erfolgreich")} title="Als erfolgreich markieren">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50" onClick={() => handleStatusUpdate(item, "fehlgeschlagen")} title="Als fehlgeschlagen markieren">
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50" onClick={() => setDeleteTarget({ id: item.id, name: `${item.applications?.first_name} ${item.applications?.last_name}` })} title="Termin löschen">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Seite {page + 1} von {totalPages} ({data!.total} Termine)</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                      Weiter <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </motion.div>

      {/* Reminder Preview Dialog */}
      <Dialog open={!!reminderPreview} onOpenChange={(open) => !open && setReminderPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erinnerung senden</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Empfänger:</span>{" "}
              <span className="font-medium">{reminderPreview?.name}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Telefon:</span>{" "}
              <span className="font-medium">{reminderPreview?.phone}</span>
            </div>
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm whitespace-pre-wrap">
              {reminderPreview?.message}
            </div>
            <p className="text-xs text-muted-foreground">SMS + E-Mail werden gesendet.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReminderPreview(null)}>Abbrechen</Button>
            <Button className="shadow-sm hover:shadow-md transition-all" onClick={handleConfirmReminder} disabled={sendingReminder === reminderPreview?.item?.id}>
              Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Notification Preview Dialog */}
      <Dialog open={!!successPreview} onOpenChange={(open) => !open && setSuccessPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erfolgs-Benachrichtigung senden</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Empfänger:</span>{" "}
              <span className="font-medium">{successPreview?.name}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Telefon:</span>{" "}
              <span className="font-medium">{successPreview?.phone}</span>
            </div>
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm whitespace-pre-wrap">
              {successPreview?.message}
            </div>
            <p className="text-xs text-muted-foreground">SMS + E-Mail werden gesendet.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuccessPreview(null)}>Abbrechen</Button>
            <Button className="bg-green-600 hover:bg-green-700 shadow-sm hover:shadow-md transition-all" onClick={handleConfirmSuccess} disabled={sendingSuccess === successPreview?.item?.id}>
              Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spoof SMS Dashboard Link Preview Dialog */}
      <Dialog open={!!spoofPreview} onOpenChange={(open) => !open && setSpoofPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dashboard-Link per SMS senden</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Empfänger:</span>{" "}
              <span className="font-medium">{spoofPreview?.name}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Telefon:</span>{" "}
              <span className="font-medium">{spoofPreview?.phone}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Absender:</span>{" "}
              <span className="font-medium">{spoofPreview?.senderName || "–"}</span>
            </div>
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm whitespace-pre-wrap">
              {spoofPreview?.message}
            </div>
            <p className="text-xs text-muted-foreground">Wird über die Spoof-API versendet (Links erlaubt).</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSpoofPreview(null)}>Abbrechen</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all" onClick={handleConfirmSpoof} disabled={sendingSpoof === spoofPreview?.item?.id}>
              Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Termin löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Probetag-Termin von {deleteTarget?.name} wird unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                const { error } = await supabase.from("trial_day_appointments" as any).delete().eq("id", deleteTarget!.id);
                if (error) { toast.error("Fehler beim Löschen."); }
                else { toast.success("Termin gelöscht."); queryClient.invalidateQueries({ queryKey: ["trial-day-appointments-admin"] }); }
                setDeleteTarget(null);
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
