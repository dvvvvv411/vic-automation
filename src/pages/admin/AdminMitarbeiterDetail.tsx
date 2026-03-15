import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  ArrowLeft, MessageCircle, ClipboardList, CheckCircle, XCircle, Lock, Unlock,
  Star, ChevronDown, Copy, Eye, EyeOff, Pencil, Save, X, User, CreditCard,
  KeyRound, StickyNote, IdCard, ShoppingBag, ImageIcon, Plus, Package,
  Clock, CheckCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { sendEmail } from "@/lib/sendEmail";
import { sendSms } from "@/lib/sendSms";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import AssignmentDialog from "@/components/admin/AssignmentDialog";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "–";
  try {
    return format(parseISO(dateStr), "dd. MMMM yyyy", { locale: de });
  } catch {
    return "–";
  }
}

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

// ─── Editable Dual Section (2-column card) ──────────────────────────
interface FieldDef {
  key: string;
  label: string;
  format?: (v: string | null) => string;
}

function EditableDualSection({
  leftTitle,
  leftIcon,
  leftFields,
  rightTitle,
  rightIcon,
  rightFields,
  data,
  onSave,
}: {
  leftTitle: string;
  leftIcon: React.ReactNode;
  leftFields: FieldDef[];
  rightTitle: string;
  rightIcon: React.ReactNode;
  rightFields: FieldDef[];
  data: Record<string, any>;
  onSave: (updates: Record<string, string>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const allFields = [...leftFields, ...rightFields];

  const startEdit = () => {
    const d: Record<string, string> = {};
    allFields.forEach((f) => (d[f.key] = data[f.key] ?? ""));
    setDraft(d);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  const renderFields = (fields: FieldDef[]) =>
    fields.map((f) => (
      <div key={f.key} className="flex justify-between items-center py-2.5 border-b border-border/40 last:border-0 gap-4">
        <span className="text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">{f.label}</span>
        {editing ? (
          <Input
            className="h-8 text-sm max-w-[200px] text-right"
            value={draft[f.key] ?? ""}
            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
          />
        ) : (
          <span className="text-sm font-medium text-foreground text-right break-all max-w-[60%]">
            {f.format ? f.format(data[f.key]) : (data[f.key] || "–")}
          </span>
        )}
      </div>
    ));

  return (
    <Card className="rounded-2xl shadow-md border-border/60 overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gradient-to-r from-muted/30 to-transparent">
        <div className="flex items-center gap-2">
          {leftIcon}
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{leftTitle}</span>
        </div>
        {!editing ? (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={save} disabled={saving}>
              <Save className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>{renderFields(leftFields)}</div>
          <div>{renderFields(rightFields)}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Credentials Card ────────────────────────────────────────────────
function CredentialsCard({ email, tempPassword }: { email?: string | null; tempPassword?: string | null }) {
  const [showPw, setShowPw] = useState(false);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert`);
  };

  return (
    <Card className="rounded-2xl shadow-md border-border/60 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Zugangsdaten</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">E-Mail</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-foreground break-all flex-1">{email || "–"}</span>
            {email && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copy(email, "E-Mail")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Temporäres Passwort</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-mono font-medium text-foreground flex-1">
              {tempPassword ? (showPw ? tempPassword : "••••••••") : "–"}
            </span>
            {tempPassword && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copy(tempPassword, "Passwort")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Admin Notes Card (append-only with + button) ────────────────────
interface NoteEntry {
  text: string;
  date: string;
}

function AdminNotesCard({ notes, onAdd }: { notes: NoteEntry[]; onAdd: (text: string) => Promise<void> }) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    await onAdd(draft.trim());
    setDraft("");
    setSaving(false);
  };

  return (
    <Card className="rounded-2xl shadow-md border-border/60 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-violet-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-violet-600" />
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Admin-Notizen</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex gap-2">
          <Textarea
            className="min-h-[70px] text-sm flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Neue Notiz hinzufügen..."
          />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 self-end border-violet-300 text-violet-600 hover:bg-violet-50"
            onClick={add}
            disabled={saving || !draft.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {notes.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notes.map((n, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border/40">
                <p className="text-sm text-foreground whitespace-pre-wrap">{n.text}</p>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {n.date}
                </span>
              </div>
            ))}
          </div>
        )}
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Keine Notizen vorhanden.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Stats Card ──────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600",
    green: "from-green-500/10 to-green-500/5 text-green-600",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600",
  };
  return (
    <Card className="rounded-2xl shadow-sm border-border/60 overflow-hidden">
      <CardContent className={`p-4 bg-gradient-to-br ${colorMap[color] || colorMap.blue}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <Icon className="h-8 w-8 opacity-40" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminMitarbeiterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeBrandingId } = useBrandingFilter();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<{ isSuspended: boolean } | null>(null);
  const [startDateDialogOpen, setStartDateDialogOpen] = useState(false);
  const [confirmedStartDate, setConfirmedStartDate] = useState<Date | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [reviewProcessing, setReviewProcessing] = useState<string | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-contract-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-contract-assignments", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-contract-reviews", id] });
  };

  // Fetch contract with branding
  const { data: contract, isLoading } = useQuery({
    queryKey: ["admin-contract-detail", id, activeBrandingId],
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

  // Fetch assignments
  const { data: assignments } = useQuery({
    queryKey: ["admin-contract-assignments", id, activeBrandingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_assignments")
        .select("*, orders(order_number, title, provider, reward)")
        .eq("contract_id", id!)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
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
    queryKey: ["admin-contract-reviews", id, brandingIds],
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

  const reviewsByOrder = (reviews ?? []).reduce((acc: Record<string, { order: any; items: any[] }>, r: any) => {
    if (!acc[r.order_id]) acc[r.order_id] = { order: r.orders, items: [] };
    acc[r.order_id].items.push(r);
    return acc;
  }, {});

  const parseReward = (reward: string): number => {
    const num = parseFloat(reward.replace(/[^0-9.,]/g, "").replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  const getAssignmentForOrder = (orderId: string) =>
    (assignments ?? []).find((a: any) => a.order_id === orderId);

  // ─── Parse admin_notes as JSON array ────────────────────────────────
  const parseNotes = (raw: string | null): NoteEntry[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      // legacy: plain text → single entry
      return [{ text: raw, date: "–" }];
    } catch {
      if (raw.trim()) return [{ text: raw, date: "–" }];
      return [];
    }
  };

  // ─── Save field updates ─────────────────────────────────────────────
  const saveFields = async (updates: Record<string, string>) => {
    const { error } = await supabase
      .from("employment_contracts")
      .update(updates as any)
      .eq("id", contract!.id);
    if (error) {
      toast.error("Fehler beim Speichern.");
      return;
    }
    toast.success("Gespeichert!");
    invalidateAll();
  };

  // ─── Review handlers (unchanged logic) ──────────────────────────────
  const handleReviewApprove = async (orderId: string) => {
    const assignment = getAssignmentForOrder(orderId);
    if (!assignment) return;
    setReviewProcessing(orderId);

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
          branding_id: brandingId || null,
          event_type: "bewertung_genehmigt",
          metadata: { order_id: orderId, contract_id: contract!.id },
        });
      }

      if (contract!.phone) {
        const { data: tpl } = await supabase.from("sms_templates" as any).select("message").eq("event_type", "bewertung_genehmigt").single();
        const smsText = (tpl as any)?.message
          ? (tpl as any).message.replace("{name}", fullName).replace("{auftrag}", orderTitle).replace("{praemie}", assignment.orders?.reward ?? "0€")
          : `Hallo ${fullName}, Ihre Bewertung für "${orderTitle}" wurde genehmigt. Prämie: ${assignment.orders?.reward ?? "0€"}.`;
        await sendSms({ to: contract!.phone, text: smsText, event_type: "bewertung_genehmigt", recipient_name: fullName, from: smsSender, branding_id: brandingId || null });
      }
    }

    toast.success("Bewertung genehmigt und Prämie gutgeschrieben!");
    invalidateAll();
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
      await sendSms({ to: contract!.phone, text: smsText, event_type: "bewertung_abgelehnt", recipient_name: fullName, from: smsSender, branding_id: brandingId || null });
    }

    toast.success("Bewertung abgelehnt. Mitarbeiter kann erneut bewerten.");
    invalidateAll();
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
      invalidateAll();
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
      invalidateAll();
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
  const initials = `${(contract.first_name ?? "?")[0]}${(contract.last_name ?? "?")[0]}`.toUpperCase();

  const adminNotes = parseNotes((contract as any).admin_notes ?? null);

  // Orders stats
  const totalOrders = (assignments ?? []).length;
  const pendingOrders = (assignments ?? []).filter((a: any) => a.status === "offen" || a.status === "in_pruefung").length;
  const completedOrders = (assignments ?? []).filter((a: any) => a.status === "erfolgreich").length;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Back */}
        <Button variant="ghost" size="sm" className="self-start -ml-2 mb-4" onClick={() => navigate("/admin/mitarbeiter")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück
        </Button>

        {/* ─── Profile Header ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-card via-card to-primary/5 shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl font-bold text-primary shrink-0 ring-2 ring-primary/20">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{fullName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {statusBadge(contract.status, contract.is_suspended)}
                <span className="text-sm text-muted-foreground">{branding}</span>
                {contract.email && (
                  <span className="text-sm text-muted-foreground">• {contract.email}</span>
                )}
              </div>
              {contract.balance != null && (
                <span className="text-sm font-medium text-foreground mt-1 inline-block">
                  Guthaben: {Number(contract.balance).toFixed(2)} €
                </span>
              )}
            </div>

            {/* Action Buttons with Text */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/livechat?contract=${contract.id}`)}>
                <MessageCircle className="h-4 w-4 mr-1.5" /> Livechat
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
                {contract.is_suspended ? <Unlock className="h-4 w-4 mr-1.5" /> : <Lock className="h-4 w-4 mr-1.5" />}
                {contract.is_suspended ? "Entsperren" : "Sperren"}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Tabs ────────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger
              value="overview"
              className="gap-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <User className="h-3.5 w-3.5" /> Übersicht
            </TabsTrigger>
            <TabsTrigger
              value="id"
              className="gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <IdCard className="h-3.5 w-3.5" /> Personalausweis
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="gap-1.5 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Aufträge
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{totalOrders}</Badge>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="gap-1.5 data-[state=active]:bg-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Star className="h-3.5 w-3.5" /> Bewertungen
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{(reviews ?? []).length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* ─── ÜBERSICHT ─────────────────────────────────────────────── */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2/3 */}
              <div className="lg:col-span-2 space-y-6">
                <EditableDualSection
                  leftTitle="Persönliche Daten"
                  leftIcon={<User className="h-4 w-4 text-blue-500" />}
                  leftFields={[
                    { key: "first_name", label: "Vorname" },
                    { key: "last_name", label: "Nachname" },
                    { key: "email", label: "E-Mail" },
                    { key: "phone", label: "Telefon" },
                    { key: "birth_date", label: "Geburtsdatum", format: formatDate },
                    { key: "birth_place", label: "Geburtsort" },
                    { key: "nationality", label: "Nationalität" },
                  ]}
                  rightTitle=""
                  rightIcon={null}
                  rightFields={[
                    { key: "marital_status", label: "Familienstand" },
                    { key: "employment_type", label: "Beschäftigungsart" },
                    { key: "desired_start_date", label: "Startdatum", format: formatDate },
                    { key: "street", label: "Straße" },
                    { key: "zip_code", label: "PLZ" },
                    { key: "city", label: "Stadt" },
                  ]}
                  data={contract}
                  onSave={saveFields}
                />
                <EditableDualSection
                  leftTitle="Bankverbindung"
                  leftIcon={<CreditCard className="h-4 w-4 text-green-500" />}
                  leftFields={[
                    { key: "iban", label: "IBAN" },
                    { key: "bic", label: "BIC" },
                    { key: "bank_name", label: "Bank" },
                  ]}
                  rightTitle="Steuer & Soziales"
                  rightIcon={<CreditCard className="h-4 w-4 text-green-500" />}
                  rightFields={[
                    { key: "tax_id", label: "Steuer-ID" },
                    { key: "social_security_number", label: "SV-Nr" },
                    { key: "health_insurance", label: "Krankenkasse" },
                  ]}
                  data={contract}
                  onSave={saveFields}
                />
              </div>

              {/* Right 1/3 */}
              <div className="space-y-6">
                <CredentialsCard email={contract.email} tempPassword={contract.temp_password} />
                <AdminNotesCard
                  notes={adminNotes}
                  onAdd={async (text) => {
                    const newEntry: NoteEntry = {
                      text,
                      date: format(new Date(), "dd.MM.yyyy HH:mm"),
                    };
                    const updated = [newEntry, ...adminNotes];
                    const { error } = await supabase
                      .from("employment_contracts")
                      .update({ admin_notes: JSON.stringify(updated) } as any)
                      .eq("id", contract.id);
                    if (error) {
                      toast.error("Fehler beim Speichern.");
                      return;
                    }
                    toast.success("Notiz hinzugefügt!");
                    invalidateAll();
                  }}
                />
              </div>
            </div>
          </TabsContent>

          {/* ─── PERSONALAUSWEIS ───────────────────────────────────────── */}
          <TabsContent value="id">
            <Card className="rounded-2xl shadow-md border-border/60 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-amber-600" /> Personalausweis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!contract.id_front_url && !contract.id_back_url ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-3 opacity-40" />
                    <p className="text-sm">Kein Personalausweis hochgeladen.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contract.id_front_url && (
                      <div className="cursor-pointer group" onClick={() => setImagePreview(contract.id_front_url)}>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Vorderseite</p>
                        <img src={contract.id_front_url} alt="Ausweis Vorderseite" className="w-full rounded-xl border border-border object-cover group-hover:opacity-80 transition-opacity" />
                      </div>
                    )}
                    {contract.id_back_url && (
                      <div className="cursor-pointer group" onClick={() => setImagePreview(contract.id_back_url)}>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Rückseite</p>
                        <img src={contract.id_back_url} alt="Ausweis Rückseite" className="w-full rounded-xl border border-border object-cover group-hover:opacity-80 transition-opacity" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── AUFTRÄGE ──────────────────────────────────────────────── */}
          <TabsContent value="orders">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard title="Gesamt Aufträge" value={totalOrders} icon={Package} color="blue" />
              <StatCard title="Ausstehend" value={pendingOrders} icon={Clock} color="amber" />
              <StatCard title="Abgeschlossen" value={completedOrders} icon={CheckCheck} color="green" />
            </div>

            <Card className="rounded-2xl shadow-md border-border/60 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-green-600" /> Aufträge ({totalOrders})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!totalOrders ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Keine Aufträge zugewiesen.</p>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
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
                          <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-mono text-xs">{a.orders?.order_number ?? "–"}</TableCell>
                            <TableCell className="font-medium">{a.orders?.title ?? "–"}</TableCell>
                            <TableCell className="text-muted-foreground">{a.orders?.provider ?? "–"}</TableCell>
                            <TableCell>
                              <span className="font-medium text-green-600">{a.orders?.reward ?? "–"}</span>
                            </TableCell>
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
          </TabsContent>

          {/* ─── BEWERTUNGEN ───────────────────────────────────────────── */}
          <TabsContent value="reviews">
            <Card className="rounded-2xl shadow-md border-border/60 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-yellow-500/5 to-transparent">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" /> Bewertungen ({(reviews ?? []).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!Object.keys(reviewsByOrder).length ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Keine Bewertungen vorhanden.</p>
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
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Genehmigen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/5"
                                  disabled={isProcessing}
                                  onClick={() => handleReviewReject(orderId)}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" /> Ablehnen
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
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ─── Dialogs ─────────────────────────────────────────────────── */}
      {assignDialogOpen && (
        <AssignmentDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          mode="contract"
          sourceId={contract.id}
          sourceLabel={fullName}
        />
      )}

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

      <Dialog open={startDateDialogOpen} onOpenChange={setStartDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Startdatum bestätigen & genehmigen</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Calendar mode="single" selected={confirmedStartDate} onSelect={setConfirmedStartDate} locale={de} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartDateDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleApprove}>Genehmigen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
