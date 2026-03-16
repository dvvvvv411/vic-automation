import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Apple, Play, Target, HelpCircle, Download, Star, Upload, FileText, CheckCircle, XCircle, ListChecks, Video, AlertTriangle, Clock, MessageSquare, Smartphone, Loader2, Info, MessageCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface ContextType {
  contract: { id: string; first_name: string | null; application_id: string } | null;
  branding: { logo_url: string | null; company_name: string; brand_color: string | null; payment_model?: string | null } | null;
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
  is_videochat?: boolean;
  work_steps?: Array<{ title: string; description: string }>;
  required_attachments?: Array<{ title: string; description: string }>;
}

interface OrderAttachment {
  id: string;
  attachment_index: number;
  file_url: string;
  file_name: string | null;
  status: string;
}

interface IdentSession {
  id: string;
  status: string;
  phone_api_url: string | null;
  test_data: Array<{ label: string; value: string }>;
  updated_at: string;
}

interface AnosimSms {
  messageSender: string;
  messageDate: string;
  messageText: string;
}

type FlowStep = "overview" | "preparation" | "disclaimer" | "videident" | "review" | "attachments";

const AuftragDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contract, branding: brandingCtx, loading: layoutLoading } = useOutletContext<ContextType>();
  const isFixedSalary = brandingCtx?.payment_model === "fixed_salary";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<string>("offen");
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [submittingAttachments, setSubmittingAttachments] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>("overview");
  const [identSession, setIdentSession] = useState<IdentSession | null>(null);
  const [smsMessages, setSmsMessages] = useState<AnosimSms[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [completingIdent, setCompletingIdent] = useState(false);

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

      setAssignmentId(assignment.id);
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
      }

      // Check for existing ident session
      const { data: existingSession } = await supabase
        .from("ident_sessions" as any)
        .select("*")
        .eq("order_id", id)
        .eq("contract_id", contract.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        const session = existingSession as any;
        setIdentSession({
          id: session.id,
          status: session.status,
          phone_api_url: session.phone_api_url,
          test_data: Array.isArray(session.test_data) ? session.test_data : [],
          updated_at: session.updated_at,
        });
        if (session.status === "waiting" || session.status === "data_sent") {
          setFlowStep("videident");
        }
      }

      // Determine initial step based on assignment status
      if (assignment.status === "in_pruefung" || assignment.status === "erfolgreich") {
        setFlowStep("overview");
      }

      await loadAttachments();
      setLoading(false);
    };

    fetchOrder();
  }, [contract, id, loadAttachments]);

  // Realtime subscription for ident_sessions
  useEffect(() => {
    if (!identSession?.id) return;

    const channel = supabase
      .channel(`ident-session-${identSession.id}`)
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "ident_sessions", filter: `id=eq.${identSession.id}` },
        (payload: any) => {
          const updated = payload.new;
          setIdentSession({
            id: updated.id,
            status: updated.status,
            phone_api_url: updated.phone_api_url,
            test_data: Array.isArray(updated.test_data) ? updated.test_data : [],
            updated_at: updated.updated_at,
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [identSession?.id]);

  // Fetch SMS when phone_api_url is set
  useEffect(() => {
    if (!identSession?.phone_api_url) {
      setSmsMessages([]);
      return;
    }

    const fetchSms = async () => {
      setSmsLoading(true);
      try {
        const { data } = await supabase.functions.invoke("anosim-proxy", {
          body: { url: identSession.phone_api_url },
        });
        if (data?.sms) {
          const sorted = [...data.sms].sort(
            (a: AnosimSms, b: AnosimSms) => new Date(b.messageDate).getTime() - new Date(a.messageDate).getTime()
          );
          setSmsMessages(sorted);
        }
      } catch {}
      setSmsLoading(false);
    };

    fetchSms();
    const interval = setInterval(fetchSms, 5000);
    return () => clearInterval(interval);
  }, [identSession?.phone_api_url]);

  const handleStartVideoIdent = async () => {
    if (!contract || !id || !assignmentId || !order) return;

    const { data: session, error: insertErr } = await supabase
      .from("ident_sessions" as any)
      .insert({
        order_id: id,
        contract_id: contract.id,
        assignment_id: assignmentId,
        branding_id: (order as any).branding_id || null,
        status: "waiting",
      } as any)
      .select()
      .single();

    if (insertErr) {
      toast.error("Fehler beim Starten der Verifizierung.");
      return;
    }

    const s = session as any;
    setIdentSession({
      id: s.id,
      status: s.status,
      phone_api_url: s.phone_api_url,
      test_data: [],
      updated_at: s.updated_at,
    });
    setFlowStep("videident");
  };

  const handleCompleteVideoChat = async () => {
    if (!identSession || !contract || !order) return;
    setCompletingIdent(true);

    await supabase
      .from("ident_sessions" as any)
      .update({ status: "completed", completed_at: new Date().toISOString() } as any)
      .eq("id", identSession.id);

    setConfirmDialogOpen(false);
    setCompletingIdent(false);
    navigate(`/mitarbeiter/bewertung/${order.id}`);
  };

  const questions: string[] = (() => {
    if (!order?.review_questions) return [];
    try {
      const parsed = Array.isArray(order.review_questions)
        ? order.review_questions
        : JSON.parse(String(order.review_questions));
      return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === "string") : [];
    } catch { return []; }
  })();

  const workSteps = order?.work_steps ?? [];
  const requiredAttachments = order?.required_attachments ?? [];

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
    if (uploadErr) { toast.error("Upload fehlgeschlagen."); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("order-attachments").getPublicUrl(path);
    await supabase.from("order_attachments" as any).delete().eq("order_id", order.id).eq("contract_id", contract.id).eq("attachment_index", attachmentIndex);
    const { error: insertErr } = await supabase.from("order_attachments" as any).insert({ order_id: order.id, contract_id: contract.id, attachment_index: attachmentIndex, file_url: urlData.publicUrl, file_name: file.name } as any);
    if (insertErr) { toast.error("Anhang konnte nicht gespeichert werden."); setUploading(null); return; }
    await loadAttachments();
    toast.success("Anhang hochgeladen!");
    setUploading(null);
  };

  const handleSubmitAttachments = async () => {
    if (!contract || !order) return;
    setSubmittingAttachments(true);
    const { error: updateErr } = await supabase
      .from("order_attachments" as any)
      .update({ status: "eingereicht" } as any)
      .eq("order_id", order.id)
      .eq("contract_id", contract.id)
      .eq("status", "entwurf");
    if (updateErr) { toast.error("Fehler beim Absenden der Anhänge."); setSubmittingAttachments(false); return; }
    await loadAttachments();
    toast.success("Anhänge erfolgreich eingereicht!");
    setSubmittingAttachments(false);
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

  const testDataWithValues = identSession?.test_data?.filter(d => d.value && d.value.trim() !== "") ?? [];
  const hasTestData = testDataWithValues.length > 0;
  const hasPhone = !!identSession?.phone_api_url;

  // ── Step: Overview ──
  if (flowStep === "overview") {
    return (
      <div className="max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück
          </Button>
          <div className="flex gap-2">
            {order.order_type && (
              <Badge variant="secondary" className="text-xs font-medium px-3 py-1">{order.order_type}</Badge>
            )}
            {order.is_videochat && (
              <Badge variant="outline" className="text-xs font-medium px-3 py-1 gap-1 border-primary/30 text-primary">
                <Video className="h-3 w-3" /> Video-Chat
              </Badge>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border border-border/60 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/40" />
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">{order.title}</CardTitle>
              {order.description && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{order.description}</p>
              )}
            </CardHeader>
            <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {order.provider && (
                <div>
                  <span className="text-muted-foreground">Anbieter</span>
                  <p className="font-medium text-foreground">{order.provider}</p>
                </div>
              )}
              {!isFixedSalary && (
                <div>
                  <span className="text-muted-foreground">Prämie</span>
                  <p className="font-semibold text-primary">{order.reward}{order.reward.includes("€") ? "" : " €"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status info for completed/in-progress orders */}
        {(assignmentStatus === "in_pruefung" || assignmentStatus === "erfolgreich" || assignmentStatus === "fehlgeschlagen") && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={cn("border shadow-sm", assignmentStatus === "erfolgreich" ? "border-green-300 bg-green-50/30" : assignmentStatus === "fehlgeschlagen" ? "border-destructive/40" : "border-blue-300 bg-blue-50/30")}>
              <CardContent className="py-6 text-center">
                {assignmentStatus === "in_pruefung" && <><Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" /><p className="font-medium text-foreground">In Überprüfung</p><p className="text-sm text-muted-foreground">Deine Bewertung wird geprüft.</p></>}
                {assignmentStatus === "erfolgreich" && <><CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" /><p className="font-medium text-foreground">Erfolgreich abgeschlossen</p></>}
                {assignmentStatus === "fehlgeschlagen" && <><XCircle className="h-8 w-8 text-destructive mx-auto mb-2" /><p className="font-medium text-foreground">Fehlgeschlagen</p><p className="text-sm text-muted-foreground mt-1">Du kannst den Auftrag erneut starten.</p><Button className="mt-3" onClick={() => setFlowStep("preparation")}>Erneut starten</Button></>}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Check if attachments are still pending */}
        {assignmentStatus === "in_pruefung" && requiredAttachments.length > 0 && (() => {
          const allSubmitted = requiredAttachments.every((_, i) => {
            const att = attachments.find(a => a.attachment_index === i);
            return att && (att.status === "eingereicht" || att.status === "genehmigt");
          });
          if (!allSubmitted) {
            return (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border border-amber-300 bg-amber-50/30 shadow-sm">
                  <CardContent className="py-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Anhänge erforderlich</p>
                      <p className="text-xs text-muted-foreground">Es fehlen noch erforderliche Anhänge für diesen Auftrag.</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setFlowStep("attachments")}>Anhänge hochladen</Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }
          return null;
        })()}

        {assignmentStatus === "offen" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Button size="lg" className="w-full gap-2" onClick={() => setFlowStep("preparation")}>
              Auftrag starten
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // ── Step: Preparation ──
  if (flowStep === "preparation") {
    return (
      <div className="max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => setFlowStep("overview")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück zur Übersicht
          </Button>
        </motion.div>

        {(order.appstore_url || order.playstore_url) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <Download className="h-4 w-4 text-primary" /> Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {order.appstore_url && <a href={order.appstore_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-2"><Apple className="h-4 w-4" /> App Store</Button></a>}
                {order.playstore_url && <a href={order.playstore_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-2"><Play className="h-4 w-4" /> Play Store</Button></a>}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {workSteps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                    {ws.description && <p className="text-sm text-muted-foreground ml-8 whitespace-pre-line">{ws.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => {
              if (order.is_videochat) {
                setFlowStep("disclaimer");
              } else {
                navigate(`/mitarbeiter/bewertung/${order.id}`);
              }
            }}
          >
            {order.is_videochat ? "Weiter zum Video-Chat" : "Bewertung starten"}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Step: Disclaimer ──
  if (flowStep === "disclaimer") {
    return (
      <div className="max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => setFlowStep("preparation")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Möchtest du den Video-Chat durchführen?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Der Video-Chat ist ein wichtiger Teil des Bewertungsprozesses. Bitte lies dir die folgenden Hinweise sorgfältig durch.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="py-6 space-y-4">
              <h3 className="font-semibold text-foreground">Hinweise für den Video-Chat</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Damit du den Anmeldeprozess realistisch bewerten kannst, bitten wir dich, dich wie ein echter Neukunde zu verhalten. Deine Angaben dienen ausschließlich der internen Bewertung – sie sind nicht rechtsverbindlich.
              </p>
              <h4 className="font-semibold text-foreground">Gesetzlich vorgeschriebene Fragen im Chat</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                In manchen Video-Chats wirst du gesetzlich vorgeschriebene Fragen gestellt bekommen – z.B. ob du politisch exponiert bist oder ob du die Geschäftsbeziehung im eigenen Interesse eingehst. Diese Fragen musst du wahrheitsgemäß beantworten, um den Prozess abzuschließen.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Button size="lg" className="w-full gap-2" onClick={handleStartVideoIdent}>
            <Video className="h-4 w-4" />
            Einverstanden, ich möchte am Video-Chat teilnehmen
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Step: Video-Ident Waiting ──
  if (flowStep === "videident") {
    return (
      <div className="max-w-5xl space-y-6">
        {/* Header bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Zuletzt aktualisiert: {identSession?.updated_at ? format(new Date(identSession.updated_at), "HH:mm") : "--:--"}</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5" /> Aktualisieren
          </Button>
        </motion.div>

        {/* Split layout */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: SMS */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <MessageSquare className="h-4 w-4 text-primary" /> SMS Nachrichten
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasPhone ? (
                <div className="py-12 text-center space-y-2">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">Keine SMS-Nachrichten vorhanden.</p>
                </div>
              ) : smsLoading && smsMessages.length === 0 ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : smsMessages.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">Warte auf eingehende SMS...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {smsMessages.map((sms, i) => (
                    <div key={i} className={cn("rounded-lg border p-3 text-sm", i === 0 ? "border-primary/40 bg-primary/5" : "bg-background")}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground text-xs">{sms.messageSender}</span>
                        <span className="text-muted-foreground text-[10px]">{format(new Date(sms.messageDate), "dd.MM. HH:mm")}</span>
                      </div>
                      <p className="text-foreground leading-snug text-xs">{sms.messageText}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Test Data */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Smartphone className="h-4 w-4 text-primary" /> Test-Daten
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasTestData ? (
                <div className="py-12 text-center space-y-4">
                  <div className="mx-auto h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Deine Test-Daten werden vorbereitet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Wir beantragen gerade deine Demo-Daten für den Video-Chat. Das kann bis zu 3 Stunden dauern, meistens geht es aber deutlich schneller.
                    </p>
                  </div>

                  <div className="space-y-3 mt-6 text-left">
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-700">Was passiert als nächstes?</p>
                          <p className="text-xs text-blue-600 mt-1">
                            Sobald deine Daten bereitstehen, erscheinen sie automatisch hier. Du kannst diese Seite geöffnet lassen oder später zurückkehren.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-700">Keine Daten nach einigen Stunden?</p>
                          <p className="text-xs text-amber-600 mt-1">
                            Falls du nach mehreren Stunden noch keine Testdaten erhalten hast, melde dich bitte im Live-Chat – wir helfen dir gerne weiter!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {testDataWithValues.map((item, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                        <p className="text-sm font-mono text-foreground mt-0.5 select-all">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <Button size="lg" className="w-full gap-2" onClick={() => setConfirmDialogOpen(true)}>
                    <CheckCircle className="h-4 w-4" />
                    Videochat erfolgreich beendet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Confirm dialog */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Videochat abgeschlossen?</AlertDialogTitle>
              <AlertDialogDescription>
                Bitte bestätige, dass du den Videochat erfolgreich beendet hast. Du wirst anschließend zu den Bewertungsfragen weitergeleitet.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleCompleteVideoChat} disabled={completingIdent}>
                {completingIdent ? "Wird verarbeitet..." : "Ja, Videochat abgeschlossen"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ── Step: Attachments (standalone access) ──
  if (flowStep === "attachments") {
    return (
      <div className="max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => setFlowStep("overview")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück zur Übersicht
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-primary" /> Erforderliche Anhänge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {requiredAttachments.map((ra, i) => {
                  const uploaded = attachments.find((a) => a.attachment_index === i);
                  const statusColor = uploaded?.status === "genehmigt" ? "border-green-300 bg-green-50/50" : uploaded?.status === "abgelehnt" ? "border-red-300 bg-red-50/50" : uploaded?.status === "eingereicht" ? "border-blue-300 bg-blue-50/50" : uploaded ? "border-primary/30 bg-primary/5" : "border-border";
                  return (
                    <div key={i} className={cn("rounded-lg border p-4 flex flex-col aspect-square", statusColor)}>
                      <div className="flex-1 min-h-0">
                        <p className="font-medium text-foreground text-sm">{ra.title}</p>
                        {ra.description && <p className="text-xs text-muted-foreground mt-1">{ra.description}</p>}
                        {uploaded && (
                          <Badge className="mt-2" variant={uploaded.status === "genehmigt" ? "default" : uploaded.status === "abgelehnt" ? "destructive" : uploaded.status === "eingereicht" ? "secondary" : "outline"}>
                            {uploaded.status === "genehmigt" ? "Genehmigt" : uploaded.status === "abgelehnt" ? "Abgelehnt" : uploaded.status === "eingereicht" ? "Eingereicht" : "Entwurf"}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-4">
                        {uploaded ? (
                          <div className="space-y-2">
                            <a href={uploaded.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{uploaded.file_name || "Datei ansehen"}</span>
                            </a>
                            {(uploaded.status === "abgelehnt" || uploaded.status === "entwurf") && (
                              <label className="cursor-pointer block">
                                <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs" asChild>
                                  <span><Upload className="h-3 w-3" />{uploaded.status === "abgelehnt" ? "Erneut hochladen" : "Ersetzen"}</span>
                                </Button>
                                <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(i, f); }} />
                              </label>
                            )}
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs" disabled={uploading === i} asChild>
                              <span><Upload className="h-3 w-3" />{uploading === i ? "Hochladen..." : "Datei hochladen"}</span>
                            </Button>
                            <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(i, f); }} />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const allUploaded = requiredAttachments.every((_, i) => attachments.find((a) => a.attachment_index === i));
                const hasDrafts = attachments.some((a) => a.status === "entwurf");
                const allSubmittedOrApproved = allUploaded && attachments.every((a) => a.status === "eingereicht" || a.status === "genehmigt");
                if (allSubmittedOrApproved) return null;
                return (
                  <>
                    <Separator />
                    <Button onClick={handleSubmitAttachments} disabled={!allUploaded || !hasDrafts || submittingAttachments} className="w-full gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {submittingAttachments ? "Wird eingereicht..." : "Anhänge absenden"}
                    </Button>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default AuftragDetails;
