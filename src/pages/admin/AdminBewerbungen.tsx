import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { sendSms } from "@/lib/sendSms";
import { buildBrandingUrl } from "@/lib/buildBrandingUrl";
import { createShortLink } from "@/lib/createShortLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText, Trash2, Check, X, Copy, CalendarCheck, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { z } from "zod";

const applicationSchema = z.object({
  first_name: z.string().trim().min(1, "Vorname erforderlich").max(100),
  last_name: z.string().trim().min(1, "Nachname erforderlich").max(100),
  email: z.string().trim().email("Ungültige E-Mail").max(255),
  phone: z.string().max(50).optional(),
  street: z.string().max(200).optional(),
  zip_code: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  employment_type: z.enum(["minijob", "teilzeit", "vollzeit"], {
    required_error: "Anstellungsart erforderlich",
  }),
  branding_id: z.string().uuid().optional().or(z.literal("")),
});

const indeedSchema = z.object({
  first_name: z.string().trim().min(1, "Vorname erforderlich").max(100),
  last_name: z.string().trim().min(1, "Nachname erforderlich").max(100),
  email: z.string().trim().email("Ungültige E-Mail").max(255),
  phone: z.string().trim().min(1, "Telefon erforderlich").max(50),
  branding_id: z.string().uuid("Branding erforderlich"),
});

type ApplicationForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  zip_code: string;
  city: string;
  employment_type: string;
  branding_id: string;
};

const DEFAULT_BRANDING_ID = "47ef07da-e9ef-4433-9633-549d25e743ce";

const initialForm: ApplicationForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  street: "",
  zip_code: "",
  city: "",
  employment_type: "vollzeit",
  branding_id: DEFAULT_BRANDING_ID,
};

const employmentLabels: Record<string, string> = {
  minijob: "Minijob",
  teilzeit: "Teilzeit",
  vollzeit: "Vollzeit",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  neu: { label: "Neu", variant: "secondary" },
  bewerbungsgespraech: { label: "Bewerbungsgespräch", variant: "outline", className: "border-yellow-500 text-yellow-700 bg-yellow-50" },
  termin_gebucht: { label: "Termin gebucht", variant: "outline", className: "border-green-500 text-green-700 bg-green-50" },
  abgelehnt: { label: "Abgelehnt", variant: "destructive" },
};

type ParsedApplicant = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

function parseMassImportLine(line: string): ParsedApplicant | string {
  const trimmed = line.trim();
  if (!trimmed) return "Leere Zeile";

  // Find email (word containing @)
  const emailMatch = trimmed.match(/\S+@\S+\.\S+/);
  if (!emailMatch) return "Keine E-Mail erkannt";

  const email = emailMatch[0];
  const emailIndex = trimmed.indexOf(email);

  const namePart = trimmed.substring(0, emailIndex).trim();
  const phonePart = trimmed.substring(emailIndex + email.length).trim();

  if (!namePart) return "Kein Name erkannt";
  if (!phonePart) return "Keine Telefonnummer erkannt";

  const nameWords = namePart.split(/\s+/);
  if (nameWords.length < 2) return "Vor- und Nachname erforderlich";

  const lastName = nameWords[nameWords.length - 1];
  const firstName = nameWords.slice(0, -1).join(" ");

  return { first_name: firstName, last_name: lastName, email, phone: phonePart };
}

export default function AdminBewerbungen() {
  const [open, setOpen] = useState(false);
  const [detailApp, setDetailApp] = useState<any>(null);
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isIndeed, setIsIndeed] = useState(false);
  const [isMassImport, setIsMassImport] = useState(false);
  const [massImportText, setMassImportText] = useState("");
  const [massImportErrors, setMassImportErrors] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, brandings(company_name, sms_sender_name), interview_appointments(appointment_date, appointment_time)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: brandings } = useQuery({
    queryKey: ["brandings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brandings")
        .select("id, company_name")
        .order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Bewerbung gelöscht");
    },
    onError: () => toast.error("Fehler beim Löschen"),
  });

  const acceptMutation = useMutation({
    mutationFn: async (app: any) => {
      const { error } = await supabase
        .from("applications")
        .update({ status: "bewerbungsgespraech" })
        .eq("id", app.id);
      if (error) throw error;

      const interviewLink = await buildBrandingUrl(app.branding_id, `/bewerbungsgespraech/${app.id}`);
      const shortLink = await createShortLink(interviewLink, app.branding_id);
      const fullName = `${app.first_name} ${app.last_name}`;

      if (app.is_indeed) {
        // Indeed: Email + SMS
        if (app.email) {
          await sendEmail({
            to: app.email,
            recipient_name: fullName,
            subject: "Ihre Bewerbung wurde angenommen",
            body_title: "Ihre Bewerbung wurde angenommen",
            body_lines: [
              `Sehr geehrte/r ${fullName},`,
              "wir freuen uns, Ihnen mitzuteilen, dass Ihre Bewerbung angenommen wurde.",
              "Bitte buchen Sie nun einen Termin für Ihr Bewerbungsgespräch.",
            ],
            button_text: "Termin buchen",
            button_url: interviewLink,
            branding_id: app.branding_id || null,
            event_type: "bewerbung_angenommen",
            metadata: { application_id: app.id },
          });
        }
        const { data: tpl } = await supabase
          .from("sms_templates" as any)
          .select("message")
          .eq("event_type", "indeed_bewerbung_angenommen")
          .single();
        const { data: brandingData } = await supabase
          .from("brandings")
          .select("company_name, sms_sender_name")
          .eq("id", app.branding_id)
          .single();
        const companyName = brandingData?.company_name || "";
        const smsText = (tpl as any)?.message
          ? (tpl as any).message
              .replace("{name}", fullName)
              .replace("{unternehmen}", companyName)
              .replace("{link}", shortLink)
          : `Hallo ${fullName}, vielen Dank für Ihre Bewerbung bei ${companyName}, bitte buchen Sie ein Bewerbungsgespräch unter ${shortLink}.`;
        await sendSms({
          to: app.phone,
          text: smsText,
          event_type: "indeed_bewerbung_angenommen",
          recipient_name: fullName,
          from: (brandingData as any)?.sms_sender_name || undefined,
        });
      } else {
        // Normal: Email + SMS with short link
        await sendEmail({
          to: app.email,
          recipient_name: fullName,
          subject: "Ihre Bewerbung wurde angenommen",
          body_title: "Ihre Bewerbung wurde angenommen",
          body_lines: [
            `Sehr geehrte/r ${fullName},`,
            "wir freuen uns, Ihnen mitzuteilen, dass Ihre Bewerbung angenommen wurde.",
            "Bitte buchen Sie nun einen Termin für Ihr Bewerbungsgespräch über den folgenden Link.",
          ],
          button_text: "Termin buchen",
          button_url: interviewLink,
          branding_id: app.branding_id || null,
          event_type: "bewerbung_angenommen",
          metadata: { application_id: app.id },
        });
        if (app.phone) {
          const { data: tpl } = await supabase
            .from("sms_templates" as any)
            .select("message")
            .eq("event_type", "bewerbung_angenommen")
            .single();
          const smsText = (tpl as any)?.message
            ? (tpl as any).message.replace("{name}", fullName).replace("{link}", shortLink)
            : `Hallo ${app.first_name}, Ihre Bewerbung wurde angenommen! Termin buchen: ${shortLink}`;
          let smsSender: string | undefined;
          if (app.branding_id) {
            const { data: branding } = await supabase.from("brandings").select("sms_sender_name" as any).eq("id", app.branding_id).single();
            smsSender = (branding as any)?.sms_sender_name || undefined;
          }
          await sendSms({ to: app.phone, text: smsText, event_type: "bewerbung_angenommen", recipient_name: fullName, from: smsSender });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Bewerbung akzeptiert");
    },
    onError: () => toast.error("Fehler beim Akzeptieren"),
  });

  const rejectMutation = useMutation({
    mutationFn: async (app: any) => {
      const { error } = await supabase
        .from("applications")
        .update({ status: "abgelehnt" })
        .eq("id", app.id);
      if (error) throw error;
      if (!app.is_indeed && app.email) {
        await sendEmail({
          to: app.email,
          recipient_name: `${app.first_name} ${app.last_name}`,
          subject: "Ihre Bewerbung",
           body_title: "Rückmeldung zu Ihrer Bewerbung",
           body_lines: [
             `Sehr geehrte/r ${app.first_name} ${app.last_name},`,
             "vielen Dank für Ihr Interesse und Ihre Bewerbung.",
             "Leider müssen wir Ihnen mitteilen, dass wir uns für andere Kandidaten entschieden haben.",
             "Wir wünschen Ihnen für Ihren weiteren Weg alles Gute.",
          ],
          branding_id: app.branding_id || null,
          event_type: "bewerbung_abgelehnt",
          metadata: { application_id: app.id },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Bewerbung abgelehnt");
    },
    onError: () => toast.error("Fehler beim Ablehnen"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const payload: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        payload[key] = value === "" ? null : value;
      });
      const { error } = await supabase.from("applications").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setOpen(false);
      setForm(initialForm);
      setErrors({});
      setIsIndeed(false);
      toast.success("Bewerbung hinzugefügt");
    },
    onError: () => toast.error("Fehler beim Erstellen"),
  });

  const massImportMutation = useMutation({
    mutationFn: async (applicants: ParsedApplicant[]) => {
      const rows = applicants.map((a) => ({
        first_name: a.first_name,
        last_name: a.last_name,
        email: a.email,
        phone: a.phone,
        branding_id: form.branding_id,
        is_indeed: true,
      }));
      const { error } = await supabase.from("applications").insert(rows as any);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setOpen(false);
      setForm(initialForm);
      setErrors({});
      setIsIndeed(false);
      setIsMassImport(false);
      setMassImportText("");
      setMassImportErrors([]);
      toast.success(`${count} Bewerbungen importiert`);
    },
    onError: () => toast.error("Fehler beim Importieren"),
  });

  const handleSubmit = () => {
    if (isIndeed && isMassImport) {
      // Mass import
      const lines = massImportText.split("\n").filter((l) => l.trim());
      if (!lines.length) {
        setMassImportErrors(["Keine Einträge eingegeben"]);
        return;
      }
      if (!form.branding_id) {
        setErrors({ branding_id: "Branding erforderlich" });
        return;
      }
      const parsed: ParsedApplicant[] = [];
      const errs: string[] = [];
      lines.forEach((line, i) => {
        const result = parseMassImportLine(line);
        if (typeof result === "string") {
          errs.push(`Zeile ${i + 1}: ${result}`);
        } else {
          parsed.push(result);
        }
      });
      if (errs.length) {
        setMassImportErrors(errs);
        return;
      }
      setMassImportErrors([]);
      massImportMutation.mutate(parsed);
      return;
    }

    if (isIndeed) {
      const result = indeedSchema.safeParse({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        branding_id: form.branding_id,
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
        });
        setErrors(fieldErrors);
        return;
      }
      setErrors({});
      createMutation.mutate({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        branding_id: form.branding_id,
        is_indeed: true,
      });
    } else {
      const result = applicationSchema.safeParse(form);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
        });
        setErrors(fieldErrors);
        return;
      }
      setErrors({});
      createMutation.mutate({ ...result.data, is_indeed: false });
    }
  };

  const updateField = (key: keyof ApplicationForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const copyLink = async (app: any) => {
    const link = await buildBrandingUrl(app.branding_id, `/bewerbungsgespraech/${app.id}`);
    navigator.clipboard.writeText(link);
    toast.success("Link kopiert!");
  };

  const renderActions = (app: any) => {
    const status = app.status || "neu";

    return (
      <div className="flex items-center gap-1">
        {status === "neu" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); acceptMutation.mutate(app); }}
              disabled={acceptMutation.isPending}
              className="text-xs"
            >
              <Check className="h-4 w-4 mr-1" />
              Akzeptieren
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(app); }}
              disabled={rejectMutation.isPending}
              className="text-xs text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Ablehnen
            </Button>
          </>
        )}
        {status === "bewerbungsgespraech" && (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); copyLink(app); }} className="text-xs">
            <Copy className="h-4 w-4 mr-1" />
            Link kopieren
          </Button>
        )}
        {status === "termin_gebucht" && app.interview_appointments?.[0] && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarCheck className="h-3.5 w-3.5" />
            {new Date(app.interview_appointments[0].appointment_date).toLocaleDateString("de-DE")}
            {" "}
            {app.interview_appointments[0].appointment_time?.slice(0, 5)} Uhr
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(app.id); }}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Bewerbungen</h2>
          <p className="text-muted-foreground mt-1">Alle eingegangenen Bewerbungen im Überblick.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(initialForm); setErrors({}); setIsIndeed(false); setIsMassImport(false); setMassImportText(""); setMassImportErrors([]); } }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Bewerbung hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Bewerbung hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Indeed Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Switch checked={isIndeed} onCheckedChange={(v) => { setIsIndeed(v); if (!v) { setIsMassImport(false); setMassImportText(""); setMassImportErrors([]); } setErrors({}); }} />
                <Label className="cursor-pointer font-medium">Indeed Bewerbung</Label>
              </div>

              {/* Mass Import Toggle - only when Indeed is active */}
              {isIndeed && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <Switch checked={isMassImport} onCheckedChange={(v) => { setIsMassImport(v); setMassImportErrors([]); setErrors({}); }} />
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <Label className="cursor-pointer font-medium">Mass Import</Label>
                  </div>
                </div>
              )}

              {/* Mass Import Textarea */}
              {isIndeed && isMassImport ? (
                <>
                  <div className="space-y-2">
                    <Label>Bewerber (eine Zeile pro Person)</Label>
                    <Textarea
                      value={massImportText}
                      onChange={(e) => { setMassImportText(e.target.value); setMassImportErrors([]); }}
                      placeholder={"Michael Rajski rajski.michael@yahoo.com +4917641871779\nSvenja Böttner TFAVct@t-online.de +4917670561418\nAnna Maria Schmidt anna@test.de +491234567"}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Format: Vorname [weitere Vornamen] Nachname email@beispiel.de +49...</p>
                  </div>
                  {massImportErrors.length > 0 && (
                    <div className="p-3 rounded-lg border border-destructive bg-destructive/10 space-y-1">
                      {massImportErrors.map((err, i) => (
                        <p key={i} className="text-xs text-destructive">{err}</p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vorname *</Label>
                      <Input value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} placeholder="Max" />
                      {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Nachname *</Label>
                      <Input value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} placeholder="Mustermann" />
                      {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>E-Mail *</Label>
                      <Input value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="max@example.com" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon {isIndeed ? "*" : ""}</Label>
                      <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+49 123 456789" />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                  </div>
                  {!isIndeed && (
                    <>
                      <div className="space-y-2">
                        <Label>Straße & Hausnummer</Label>
                        <Input value={form.street} onChange={(e) => updateField("street", e.target.value)} placeholder="Musterstr. 1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>PLZ</Label>
                          <Input value={form.zip_code} onChange={(e) => updateField("zip_code", e.target.value)} placeholder="93047" />
                        </div>
                        <div className="space-y-2">
                          <Label>Stadt</Label>
                          <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Regensburg" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Anstellungsart *</Label>
                        <Select value={form.employment_type} onValueChange={(v) => updateField("employment_type", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Anstellungsart wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minijob">Minijob</SelectItem>
                            <SelectItem value="teilzeit">Teilzeit</SelectItem>
                            <SelectItem value="vollzeit">Vollzeit</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.employment_type && <p className="text-xs text-destructive">{errors.employment_type}</p>}
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="space-y-2">
                <Label>Branding {isIndeed ? "*" : ""}</Label>
                <Select value={form.branding_id} onValueChange={(v) => updateField("branding_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Branding wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandings?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branding_id && <p className="text-xs text-destructive">{errors.branding_id}</p>}
              </div>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || massImportMutation.isPending} className="w-full mt-2">
                {isIndeed && isMassImport
                  ? massImportMutation.isPending
                    ? "Wird importiert..."
                    : `${massImportText.split("\n").filter((l) => l.trim()).length} Bewerbungen importieren`
                  : createMutation.isPending
                    ? "Wird hinzugefügt..."
                    : "Bewerbung hinzufügen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Dialog open={!!detailApp} onOpenChange={(v) => { if (!v) setDetailApp(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bewerbungsdetails</DialogTitle>
          </DialogHeader>
          {detailApp && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Vorname</span>
                  <p className="font-medium">{detailApp.first_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Nachname</span>
                  <p className="font-medium">{detailApp.last_name}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">E-Mail</span>
                <p className="font-medium">{detailApp.email || "–"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Telefon</span>
                <p className="font-medium">{detailApp.phone || "–"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Adresse</span>
                <p className="font-medium">
                  {detailApp.street || "–"}
                  {(detailApp.zip_code || detailApp.city) && <br />}
                  {`${detailApp.zip_code || ""} ${detailApp.city || ""}`.trim() || ""}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Anstellungsart</span>
                <p className="font-medium">{detailApp.employment_type ? (employmentLabels[detailApp.employment_type] || detailApp.employment_type) : "–"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Branding</span>
                <p className="font-medium">{detailApp.brandings?.company_name || "–"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="font-medium">{(statusConfig[detailApp.status] || statusConfig.neu).label}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Eingegangen</span>
                <p className="font-medium">{new Date(detailApp.created_at).toLocaleDateString("de-DE")}</p>
              </div>
              {detailApp.resume_url && (
                <div>
                  <span className="text-muted-foreground">Lebenslauf</span>
                  <div className="mt-1">
                    <Button asChild variant="outline" size="sm">
                      <a href={detailApp.resume_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Lebenslauf ansehen
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !applications?.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Noch keine Bewerbungen vorhanden.</p>
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Erste Bewerbung hinzufügen
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Ort</TableHead>
                  <TableHead>Anstellungsart</TableHead>
                  <TableHead>Branding</TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Eingegangen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a: any) => {
                  const status = a.status || "neu";
                  const cfg = statusConfig[status] || statusConfig.neu;
                  return (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailApp(a)}>
                      <TableCell className="font-medium">{a.first_name} {a.last_name}</TableCell>
                      <TableCell className="text-muted-foreground">{a.email || "–"}</TableCell>
                      <TableCell className="text-muted-foreground">{a.phone || "–"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.zip_code || a.city ? `${a.zip_code || ""} ${a.city || ""}`.trim() : "–"}
                      </TableCell>
                      <TableCell>
                        {a.employment_type ? (
                          <Badge variant="secondary">{employmentLabels[a.employment_type] || a.employment_type}</Badge>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.brandings?.company_name || "–"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {a.is_indeed && <Badge variant="outline" className="text-[10px]">Indeed</Badge>}
                          {a.resume_url && (
                            <a
                              href={a.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:text-primary/80"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          )}
                          {!a.is_indeed && !a.resume_url && <span className="text-muted-foreground">–</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(a.created_at).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderActions(a)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </>
  );
}
