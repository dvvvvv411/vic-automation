import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, MessageCircle, ClipboardList, CheckCircle, XCircle, Lock, Unlock, Star, ChevronDown, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { sendEmail } from "@/lib/sendEmail";
import { sendSms } from "@/lib/sendSms";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import AssignmentDialog from "@/components/admin/AssignmentDialog";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "–";
  try {
    return format(parseISO(dateStr), "dd. MMMM yyyy", { locale: de });
  } catch {
    return "–";
  }
}

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground">{value || "–"}</span>
  </div>
);

const statusBadge = (status: string, isSuspended: boolean) => {
  const badges = [];
  switch (status) {
    case "unterzeichnet":
      badges.push(<Badge key="s" variant="outline" className="text-green-600 border-green-300 bg-green-50">Unterzeichnet</Badge>);
      break;
    case "genehmigt":
      badges.push(<Badge key="s" className="bg-green-600 text-white border-green-600">Genehmigt</Badge>);
      break;
    case "eingereicht":
      badges.push(<Badge key="s" className="bg-yellow-500 text-white border-yellow-500">Eingereicht</Badge>);
      break;
    default:
      badges.push(<Badge key="s" variant="outline">Offen</Badge>);
  }
  if (isSuspended) {
    badges.push(<Badge key="x" variant="outline" className="text-red-600 border-red-300 bg-red-50">Gesperrt</Badge>);
  }
  return <div className="flex gap-1.5">{badges}</div>;
};

const assignmentStatusBadge = (status: string) => {
  switch (status) {
    case "erfolgreich":
      return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Erfolgreich</Badge>;
    case "in_pruefung":
      return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">In Prüfung</Badge>;
    case "fehlgeschlagen":
      return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Fehlgeschlagen</Badge>;
    default:
      return <Badge variant="outline">Offen</Badge>;
  }
};

export default function AdminMitarbeiterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useUserQueryKey();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<{ isSuspended: boolean } | null>(null);
  const [startDateDialogOpen, setStartDateDialogOpen] = useState(false);
  const [confirmedStartDate, setConfirmedStartDate] = useState<Date | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [reviewProcessing, setReviewProcessing] = useState<string | null>(null);

  // Fetch contract with branding
  const { data: contract, isLoading } = useQuery({
    queryKey: ["admin-contract-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employment_contracts")
        .select("*, applications(brandings(company_name))")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch assignments with orders and appointments
  const { data: assignments } = useQuery({
    queryKey: ["admin-contract-assignments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_assignments")
        .select("*, orders(order_number, title, provider, reward)")
        .eq("contract_id", id!)
        .order("assigned_at", { ascending: false });
      if (error) throw error;

      // Fetch appointments for this contract
      const { data: appointments } = await supabase
        .from("order_appointments")
        .select("*")
        .eq("contract_id", id!);

      return (data ?? []).map((a: any) => ({
        ...a,
        appointment: (appointments ?? []).find((ap: any) => ap.order_id === a.order_id),
      }));
    },
    enabled: !!id,
  });

  // Fetch reviews
  const { data: reviews } = useQuery({
    queryKey: ["admin-contract-reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_reviews")
        .select("*, orders(order_number, title)")
        .eq("contract_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  // Group reviews by order
  const reviewsByOrder = (reviews ?? []).reduce((acc: Record<string, { order: any; items: any[] }>, r: any) => {
    if (!acc[r.order_id]) {
      acc[r.order_id] = { order: r.orders, items: [] };
    }
    acc[r.order_id].items.push(r);
    return acc;
  }, {});

  // Review helpers
  const parseReward = (reward: string): number => {
    const num = parseFloat(reward.replace(/[^0-9.,]/g, "").replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  const getAssignmentForOrder = (orderId: string) =>
    (assignments ?? []).find((a: any) => a.order_id === orderId);

  const handleReviewApprove = async (orderId: string) => {
    const assignment = getAssignmentForOrder(orderId);
    if (!assignment) return;
    const key = orderId;
    setReviewProcessing(key);

    const reward = parseReward(assignment.orders?.reward ?? "0");

    const { error: statusErr } = await supabase
      .from("order_assignments")
      .update({ status: "erfolgreich" })
      .eq("order_id", orderId)
      .eq("contract_id", contract!.id);

    if (statusErr) {
      toast.error("Fehler beim Genehmigen.");
      setReviewProcessing(null);
      return;
    }

    if (reward > 0) {
      const currentBalance = Number(contract!.balance ?? 0);
      await supabase
        .from("employment_contracts")
        .update({ balance: currentBalance + reward })
        .eq("id", contract!.id);

      let smsSender: string | undefined;
      const brandingId = (contract as any)?.applications?.brandings?.id;
      if (brandingId) {
        const { data: branding } = await supabase.from("brandings").select("sms_sender_name" as any).eq("id", brandingId).single();
        smsSender = (branding as any)?.sms_sender_name || undefined;
      }

      const orderTitle = assignment.orders?.title ?? "Auftrag";

      if (contract!.email) {
        await sendEmail({
          to: contract!.email,
          recipient_name: fullName,
          subject: "Ihre Bewertung wurde genehmigt",
          body_title: "Bewertung genehmigt",
          body_lines: [
            `Sehr geehrte/r ${fullName},`,
            `Ihre Bewertung für den Auftrag "${orderTitle}" wurde genehmigt.`,
            `Die Prämie von ${assignment.orders?.reward ?? "0€"} wurde Ihrem Konto gutgeschrieben.`,
          ],
          branding_id: (contract as any)?.applications?.brandings?.id || null,
          event_type: "bewertung_genehmigt",
          metadata: { order_id: orderId, contract_id: contract!.id },
        });
      }

      if (contract!.phone) {
        const { data: tpl } = await supabase.from("sms_templates" as any).select("message").eq("event_type", "bewertung_genehmigt").single();
        const smsText = (tpl as any)?.message
          ? (tpl as any).message.replace("{name}", fullName).replace("{auftrag}", orderTitle).replace("{praemie}", assignment.orders?.reward ?? "0€")
          : `Hallo ${fullName}, Ihre Bewertung für "${orderTitle}" wurde genehmigt. Prämie: ${assignment.orders?.reward ?? "0€"}.`;
        await sendSms({ to: contract!.phone, text: smsText, event_type: "bewertung_genehmigt", recipient_name: fullName, from: smsSender });
      }
    }

    toast.success("Bewertung genehmigt und Prämie gutgeschrieben!");
    queryClient.invalidateQueries({ queryKey: ["admin-contract-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-contract-assignments", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-contract-reviews", id] });
    setReviewProcessing(null);
  };

  const handleReviewReject = async (orderId: string) => {
    const assignment = getAssignmentForOrder(orderId);
    if (!assignment) return;
    setReviewProcessing(orderId);

    const { error: statusErr } = await supabase
      .from("order_assignments")
      .update({ status: "fehlgeschlagen" })
      .eq("order_id", orderId)
      .eq("contract_id", contract!.id);

    if (statusErr) {
      toast.error("Fehler beim Ablehnen.");
      setReviewProcessing(null);
      return;
    }

    await supabase
      .from("order_reviews")
      .delete()
      .eq("order_id", orderId)
      .eq("contract_id", contract!.id);

    const orderTitle = assignment.orders?.title ?? "Auftrag";

    let smsSender: string | undefined;
    const brandingId = (contract as any)?.applications?.brandings?.id;
    if (brandingId) {
      const { data: branding } = await supabase.from("brandings").select("sms_sender_name" as any).eq("id", brandingId).single();
      smsSender = (branding as any)?.sms_sender_name || undefined;
    }

    if (contract!.email) {
      await sendEmail({
        to: contract!.email,
        recipient_name: fullName,
        subject: "Ihre Bewertung wurde abgelehnt",
        body_title: "Bewertung abgelehnt",
        body_lines: [
          `Sehr geehrte/r ${fullName},`,
          `Ihre Bewertung für den Auftrag "${orderTitle}" konnte leider nicht akzeptiert werden.`,
          "Bitte führen Sie die Bewertung erneut durch und achten Sie auf die Vorgaben.",
        ],
        branding_id: brandingId || null,
        event_type: "bewertung_abgelehnt",
        metadata: { order_id: orderId, contract_id: contract!.id },
      });
    }

    if (contract!.phone) {
      const { data: tpl } = await supabase.from("sms_templates" as any).select("message").eq("event_type", "bewertung_abgelehnt").single();
      const smsText = (tpl as any)?.message
        ? (tpl as any).message.replace("{name}", fullName).replace("{auftrag}", orderTitle)
        : `Hallo ${fullName}, Ihre Bewertung für "${orderTitle}" wurde leider abgelehnt.`;
      await sendSms({ to: contract!.phone, text: smsText, event_type: "bewertung_abgelehnt", recipient_name: fullName, from: smsSender });
    }

    toast.success("Bewertung abgelehnt. Mitarbeiter kann erneut bewerten.");
    queryClient.invalidateQueries({ queryKey: ["admin-contract-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-contract-assignments", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-contract-reviews", id] });
    setReviewProcessing(null);
  };

  const handleToggleSuspend = async () => {
    if (!contract || !suspendTarget) return;
    const newValue = !suspendTarget.isSuspended;
    const { error } = await supabase
      .from("employment_contracts")
      .update({ is_suspended: newValue })
      .eq("id", contract.id);
    if (error) {
      toast.error("Fehler beim Aktualisieren.");
    } else {
      toast.success(newValue ? "Benutzerkonto gesperrt." : "Benutzerkonto entsperrt.");
      queryClient.invalidateQueries({ queryKey: ["admin-contract-detail", id] });
    }
    setSuspendTarget(null);
  };

  const handleApprove = async () => {
    if (!contract) return;
    try {
      if (confirmedStartDate) {
        const formatted = format(confirmedStartDate, "yyyy-MM-dd");
        const { error: updateError } = await supabase
          .from("employment_contracts")
          .update({ desired_start_date: formatted })
          .eq("id", contract.id);
        if (updateError) {
          toast.error("Fehler beim Aktualisieren des Startdatums.");
          return;
        }
      }
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://luorlnagxpsibarcygjm.supabase.co/functions/v1/create-employee-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1b3JsbmFneHBzaWJhcmN5Z2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDI3MTAsImV4cCI6MjA4NjM3ODcxMH0.B0MYZqUChRbyW3ekOR8YI4j7q153ME77qI_LjUUJTqs",
          },
          body: JSON.stringify({ contract_id: contract.id }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Fehler beim Genehmigen.");
        return;
      }
      toast.success(`Genehmigt! Temporäres Passwort: ${result.temp_password}`, { duration: 15000 });
      setStartDateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-contract-detail", id] });
    } catch {
      toast.error("Fehler beim Genehmigen.");
    }
  };

  const openApproveDialog = () => {
    const dateStr = contract?.desired_start_date;
    const parsed = dateStr ? new Date(dateStr + "T00:00:00") : undefined;
    setConfirmedStartDate(parsed);
    setStartDateDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Laden...</div>;
  }

  if (!contract) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Mitarbeiter nicht gefunden.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/mitarbeiter")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
        </Button>
      </div>
    );
  }

  const fullName = `${contract.first_name ?? ""} ${contract.last_name ?? ""}`.trim() || "Unbekannt";
  const branding = (contract as any).applications?.brandings?.company_name ?? "–";

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <Button variant="ghost" size="sm" className="self-start -ml-2" onClick={() => navigate("/admin/mitarbeiter")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück zur Übersicht
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">{fullName}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                {statusBadge(contract.status, contract.is_suspended)}
                <span className="text-sm text-muted-foreground">{branding}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/livechat?contract=${contract.id}`)}>
                <MessageCircle className="h-4 w-4 mr-1.5" /> Zum Livechat
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAssignDialogOpen(true)}>
                <ClipboardList className="h-4 w-4 mr-1.5" /> Auftrag zuweisen
              </Button>
              {contract.status === "eingereicht" && (
                <Button size="sm" onClick={openApproveDialog}>
                  <CheckCircle className="h-4 w-4 mr-1.5" /> Genehmigen
                </Button>
              )}
              <Button
                variant={contract.is_suspended ? "outline" : "destructive"}
                size="sm"
                onClick={() => setSuspendTarget({ isSuspended: contract.is_suspended })}
              >
                {contract.is_suspended ? (
                  <><Unlock className="h-4 w-4 mr-1.5" /> Entsperren</>
                ) : (
                  <><Lock className="h-4 w-4 mr-1.5" /> Sperren</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Personal Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle className="text-lg">Persönliche Daten</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Vorname" value={contract.first_name} />
              <InfoRow label="Nachname" value={contract.last_name} />
              <InfoRow label="Geburtsdatum" value={formatDate(contract.birth_date)} />
              <InfoRow label="Geburtsort" value={contract.birth_place} />
              <InfoRow label="Nationalität" value={contract.nationality} />
              <InfoRow label="Familienstand" value={contract.marital_status} />
              <InfoRow label="Beschäftigungsart" value={contract.employment_type} />
              <InfoRow label="Gewünschtes Startdatum" value={formatDate(contract.desired_start_date)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Kontakt & Finanzen</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="E-Mail" value={contract.email} />
              <InfoRow label="Telefon" value={contract.phone} />
              <InfoRow label="Straße" value={contract.street} />
              <InfoRow label="PLZ / Ort" value={contract.zip_code && contract.city ? `${contract.zip_code} ${contract.city}` : contract.city || contract.zip_code} />
              <InfoRow label="SV-Nr" value={contract.social_security_number} />
              <InfoRow label="Steuer-ID" value={contract.tax_id} />
              <InfoRow label="Krankenkasse" value={contract.health_insurance} />
              <InfoRow label="IBAN" value={contract.iban} />
              <InfoRow label="BIC" value={contract.bic} />
              <InfoRow label="Bank" value={contract.bank_name} />
              <InfoRow label="Guthaben" value={contract.balance != null ? `${Number(contract.balance).toFixed(2)} €` : "–"} />
              <InfoRow label="Temp. Passwort" value={contract.temp_password} />
            </CardContent>
          </Card>
        </div>

        {/* ID Images */}
        {(contract.id_front_url || contract.id_back_url) && (
          <Card className="mb-8">
            <CardHeader><CardTitle className="text-lg">Personalausweis</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                {contract.id_front_url && (
                  <div className="cursor-pointer" onClick={() => setImagePreview(contract.id_front_url)}>
                    <p className="text-xs text-muted-foreground mb-1">Vorderseite</p>
                    <img src={contract.id_front_url} alt="Ausweis Vorderseite" className="h-32 rounded-lg border border-border object-cover hover:opacity-80 transition-opacity" />
                  </div>
                )}
                {contract.id_back_url && (
                  <div className="cursor-pointer" onClick={() => setImagePreview(contract.id_back_url)}>
                    <p className="text-xs text-muted-foreground mb-1">Rückseite</p>
                    <img src={contract.id_back_url} alt="Ausweis Rückseite" className="h-32 rounded-lg border border-border object-cover hover:opacity-80 transition-opacity" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Aufträge ({(assignments ?? []).length})</CardTitle>
          </CardHeader>
          <CardContent>
            {!(assignments ?? []).length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Keine Aufträge zugewiesen.</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Auftragsnr.</TableHead>
                      <TableHead>Titel</TableHead>
                      <TableHead>Anbieter</TableHead>
                      <TableHead>Prämie</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Termin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(assignments ?? []).map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs">{a.orders?.order_number ?? "–"}</TableCell>
                        <TableCell className="font-medium">{a.orders?.title ?? "–"}</TableCell>
                        <TableCell className="text-muted-foreground">{a.orders?.provider ?? "–"}</TableCell>
                        <TableCell className="text-muted-foreground">{a.orders?.reward ?? "–"}</TableCell>
                        <TableCell>{assignmentStatusBadge(a.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.appointment
                            ? `${format(parseISO(a.appointment.appointment_date), "dd.MM.yyyy")} ${a.appointment.appointment_time?.slice(0, 5)}`
                            : "–"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Bewertungen ({(reviews ?? []).length})</CardTitle>
          </CardHeader>
          <CardContent>
            {!Object.keys(reviewsByOrder).length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Keine Bewertungen vorhanden.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(reviewsByOrder).map(([orderId, group]: [string, any]) => {
                  const avg = group.items.reduce((s: number, r: any) => s + r.rating, 0) / group.items.length;
                  const assignment = getAssignmentForOrder(orderId);
                  const status = assignment?.status ?? "offen";
                  const canAct = !["erfolgreich", "fehlgeschlagen"].includes(status);
                  const isProcessing = reviewProcessing === orderId;
                  return (
                    <Collapsible key={orderId}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{group.order?.title ?? "Auftrag"}</span>
                          <span className="text-xs text-muted-foreground">{group.order?.order_number}</span>
                          {assignmentStatusBadge(status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">{avg.toFixed(1)}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">({group.items.length} Fragen)</span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2 pl-3">
                        {group.items.map((r: any) => (
                          <div key={r.id} className="border border-border/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{r.question}</span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                                ))}
                              </div>
                            </div>
                            {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                          </div>
                        ))}
                        {canAct && (
                          <div className="flex gap-2 justify-end pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              disabled={isProcessing}
                              onClick={() => handleReviewApprove(orderId)}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Genehmigen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/5"
                              disabled={isProcessing}
                              onClick={() => handleReviewReject(orderId)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Ablehnen
                            </Button>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Assignment Dialog */}
      {assignDialogOpen && (
        <AssignmentDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          mode="contract"
          sourceId={contract.id}
          sourceLabel={fullName}
        />
      )}

      {/* Suspend Dialog */}
      <AlertDialog open={!!suspendTarget} onOpenChange={(v) => { if (!v) setSuspendTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspendTarget?.isSuspended ? `${fullName} entsperren?` : `${fullName} sperren?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suspendTarget?.isSuspended
                ? "Der Mitarbeiter erhält wieder Zugang zum Dashboard."
                : "Der Mitarbeiter wird sofort ausgesperrt."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleSuspend}>
              {suspendTarget?.isSuspended ? "Entsperren" : "Sperren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Start Date / Approve Dialog */}
      <Dialog open={startDateDialogOpen} onOpenChange={setStartDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Startdatum bestätigen & genehmigen</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Calendar
              mode="single"
              selected={confirmedStartDate}
              onSelect={setConfirmedStartDate}
              locale={de}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartDateDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleApprove}>Genehmigen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview */}
      <Dialog open={!!imagePreview} onOpenChange={(v) => { if (!v) setImagePreview(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personalausweis</DialogTitle>
          </DialogHeader>
          {imagePreview && <img src={imagePreview} alt="Ausweis" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
