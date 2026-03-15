import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Apple, Play, Target, HelpCircle, Download, Star, Upload, FileText, CheckCircle, XCircle, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const AuftragDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contract, branding: brandingCtx, loading: layoutLoading } = useOutletContext<ContextType>();
  const isFixedSalary = brandingCtx?.payment_model === "fixed_salary";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<string>("offen");
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

  const handleSubmitAttachments = async () => {
    if (!contract || !order) return;
    setSubmittingAttachments(true);
    const { error: updateErr } = await supabase
      .from("order_attachments" as any)
      .update({ status: "eingereicht" } as any)
      .eq("order_id", order.id)
      .eq("contract_id", contract.id)
      .eq("status", "entwurf");
    if (updateErr) {
      toast.error("Fehler beim Absenden der Anhänge.");
      setSubmittingAttachments(false);
      return;
    }
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
                    <p className="text-sm text-muted-foreground ml-8 whitespace-pre-line">{ws.description}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Review Questions */}
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
           <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {requiredAttachments.map((ra, i) => {
                  const uploaded = attachments.find((a) => a.attachment_index === i);
                  const isSubmitted = uploaded?.status === "eingereicht" || uploaded?.status === "genehmigt";
                  const statusColor = uploaded?.status === "genehmigt"
                    ? "border-green-300 bg-green-50/50"
                    : uploaded?.status === "abgelehnt"
                    ? "border-red-300 bg-red-50/50"
                    : uploaded?.status === "eingereicht"
                    ? "border-blue-300 bg-blue-50/50"
                    : uploaded
                    ? "border-primary/30 bg-primary/5"
                    : "border-border";

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
                                  <span>
                                    <Upload className="h-3 w-3" />
                                    {uploaded.status === "abgelehnt" ? "Erneut hochladen" : "Ersetzen"}
                                  </span>
                                </Button>
                                <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(i, f); }} />
                              </label>
                            )}
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs" disabled={uploading === i} asChild>
                              <span>
                                <Upload className="h-3 w-3" />
                                {uploading === i ? "Hochladen..." : "Datei hochladen"}
                              </span>
                            </Button>
                            <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(i, f); }} />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit button */}
              {(() => {
                const allUploaded = requiredAttachments.every((_, i) => attachments.find((a) => a.attachment_index === i));
                const hasDrafts = attachments.some((a) => a.status === "entwurf");
                const allSubmittedOrApproved = allUploaded && attachments.every((a) => a.status === "eingereicht" || a.status === "genehmigt");

                if (allSubmittedOrApproved) return null;

                return (
                  <>
                    <Separator />
                    <Button
                      onClick={handleSubmitAttachments}
                      disabled={!allUploaded || !hasDrafts || submittingAttachments}
                      className="w-full gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {submittingAttachments ? "Wird eingereicht..." : "Anhänge absenden"}
                    </Button>
                    {!allUploaded && (
                      <p className="text-xs text-muted-foreground text-center">
                        Bitte laden Sie alle erforderlichen Dokumente hoch, bevor Sie absenden.
                      </p>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AuftragDetails;
