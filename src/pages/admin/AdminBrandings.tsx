import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Palette, Trash2, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

const brandingSchema = z.object({
  company_name: z.string().min(1, "Unternehmensname erforderlich").max(200),
  street: z.string().max(200).optional(),
  zip_code: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  trade_register: z.string().max(100).optional(),
  register_court: z.string().max(200).optional(),
  managing_director: z.string().max(200).optional(),
  vat_id: z.string().max(50).optional(),
  domain: z.string().max(200).optional(),
  email: z.string().email("Ungültige E-Mail").max(255).or(z.literal("")).optional(),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Ungültiger Hex-Farbcode"),
  resend_from_email: z.string().email("Ungültige E-Mail").max(255).or(z.literal("")).optional(),
  resend_from_name: z.string().max(200).optional(),
  resend_api_key: z.string().max(200).optional(),
  sms_sender_name: z.string().max(11, "Max. 11 Zeichen").optional(),
});

type BrandingForm = z.infer<typeof brandingSchema>;

const initialForm: BrandingForm = {
  company_name: "",
  street: "",
  zip_code: "",
  city: "",
  trade_register: "",
  register_court: "",
  managing_director: "",
  vat_id: "",
  domain: "",
  email: "",
  brand_color: "#3B82F6",
  resend_from_email: "",
  resend_from_name: "",
  resend_api_key: "",
  sms_sender_name: "",
};

export default function AdminBrandings() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BrandingForm>(initialForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editBranding, setEditBranding] = useState<Tables<"brandings"> | null>(null);
  const queryClient = useQueryClient();

  const { data: brandings, isLoading } = useQuery({
    queryKey: ["brandings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brandings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brandings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandings"] });
      toast.success("Branding gelöscht");
    },
    onError: () => toast.error("Fehler beim Löschen"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: BrandingForm & { logo_url?: string }) => {
      const cleaned: Record<string, string | null> = {};
      Object.entries(data).forEach(([key, value]) => {
        cleaned[key] = value === "" ? null : (value as string);
      });
      const { error } = await supabase.from("brandings").insert(cleaned as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandings"] });
      closeDialog();
      toast.success("Branding erstellt");
    },
    onError: () => toast.error("Fehler beim Erstellen"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BrandingForm & { logo_url?: string } }) => {
      const cleaned: Record<string, string | null> = {};
      Object.entries(data).forEach(([key, value]) => {
        cleaned[key] = value === "" ? null : (value as string);
      });
      const { error } = await supabase.from("brandings").update(cleaned as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandings"] });
      closeDialog();
      toast.success("Branding aktualisiert");
    },
    onError: () => toast.error("Fehler beim Aktualisieren"),
  });

  const closeDialog = () => {
    setOpen(false);
    setForm(initialForm);
    setLogoFile(null);
    setErrors({});
    setEditBranding(null);
  };

  const openEdit = (branding: Tables<"brandings">) => {
    setEditBranding(branding);
    setForm({
      company_name: branding.company_name || "",
      street: branding.street || "",
      zip_code: branding.zip_code || "",
      city: branding.city || "",
      trade_register: branding.trade_register || "",
      register_court: branding.register_court || "",
      managing_director: branding.managing_director || "",
      vat_id: branding.vat_id || "",
      domain: branding.domain || "",
      email: branding.email || "",
      brand_color: branding.brand_color || "#3B82F6",
      resend_from_email: (branding as any).resend_from_email || "",
      resend_from_name: (branding as any).resend_from_name || "",
      resend_api_key: (branding as any).resend_api_key || "",
      sms_sender_name: (branding as any).sms_sender_name || "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const result = brandingSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    let logo_url: string | undefined;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("branding-logos")
        .upload(path, logoFile);
      if (uploadError) {
        toast.error("Logo-Upload fehlgeschlagen");
        return;
      }
      const { data: publicUrl } = supabase.storage
        .from("branding-logos")
        .getPublicUrl(path);
      logo_url = publicUrl.publicUrl;
    }

    if (editBranding) {
      updateMutation.mutate({
        id: editBranding.id,
        data: { ...result.data, ...(logo_url ? { logo_url } : {}) },
      });
    } else {
      createMutation.mutate({ ...result.data, logo_url });
    }
  };

  const updateField = (key: keyof BrandingForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const isEditing = !!editBranding;
  const isPending = isEditing ? updateMutation.isPending : createMutation.isPending;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Brandings</h2>
          <p className="text-muted-foreground mt-1">Verwalten Sie alle Ihre Landingpage-Brandings.</p>
        </div>
        <Button onClick={() => { setEditBranding(null); setForm(initialForm); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Branding hinzufügen
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Branding bearbeiten" : "Neues Branding erstellen"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Branding ID (read-only, only in edit mode) */}
            {isEditing && (
              <div className="space-y-2">
                <Label>Branding-ID</Label>
                <Input value={editBranding.id} disabled className="font-mono text-xs" />
              </div>
            )}

            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
              {isEditing && editBranding.logo_url && !logoFile && (
                <div className="flex items-center gap-2 mt-1">
                  <img src={editBranding.logo_url} alt="Aktuelles Logo" className="h-8 w-8 rounded object-contain" />
                  <span className="text-xs text-muted-foreground">Aktuelles Logo</span>
                </div>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label>Unternehmensname *</Label>
              <Input
                value={form.company_name}
                onChange={(e) => updateField("company_name", e.target.value)}
                placeholder="Muster GmbH"
              />
              {errors.company_name && <p className="text-xs text-destructive">{errors.company_name}</p>}
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Straße & Hausnummer</Label>
                <Input value={form.street} onChange={(e) => updateField("street", e.target.value)} placeholder="Musterstr. 1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>PLZ</Label>
                  <Input value={form.zip_code} onChange={(e) => updateField("zip_code", e.target.value)} placeholder="93047" />
                </div>
                <div className="space-y-2">
                  <Label>Stadt</Label>
                  <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Regensburg" />
                </div>
              </div>
            </div>

            {/* Register */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Handelsregister</Label>
                <Input value={form.trade_register} onChange={(e) => updateField("trade_register", e.target.value)} placeholder="HRB 16675" />
              </div>
              <div className="space-y-2">
                <Label>Registergericht</Label>
                <Input value={form.register_court} onChange={(e) => updateField("register_court", e.target.value)} placeholder="Amtsgericht Regensburg" />
              </div>
            </div>

            {/* Director & VAT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Geschäftsführer</Label>
                <Input value={form.managing_director} onChange={(e) => updateField("managing_director", e.target.value)} placeholder="Max Mustermann" />
              </div>
              <div className="space-y-2">
                <Label>Umsatzsteuer-ID</Label>
                <Input value={form.vat_id} onChange={(e) => updateField("vat_id", e.target.value)} placeholder="DE123456789" />
              </div>
            </div>

            {/* Domain & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Domain</Label>
                <Input value={form.domain} onChange={(e) => updateField("domain", e.target.value)} placeholder="example.com" />
              </div>
              <div className="space-y-2">
                <Label>E-Mail</Label>
                <Input value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="info@example.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>

            {/* Resend E-Mail-Konfiguration */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm font-medium text-muted-foreground">Resend E-Mail-Konfiguration</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Absender-E-Mail</Label>
                <Input value={form.resend_from_email} onChange={(e) => updateField("resend_from_email", e.target.value)} placeholder="noreply@example.com" />
                {errors.resend_from_email && <p className="text-xs text-destructive">{errors.resend_from_email}</p>}
              </div>
              <div className="space-y-2">
                <Label>Absendername</Label>
                <Input value={form.resend_from_name} onChange={(e) => updateField("resend_from_name", e.target.value)} placeholder="Muster GmbH" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Resend API Key</Label>
              <Input type="password" value={form.resend_api_key} onChange={(e) => updateField("resend_api_key", e.target.value)} placeholder="re_..." />
            </div>

            {/* SMS-Konfiguration */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm font-medium text-muted-foreground">SMS-Konfiguration</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>SMS-Absendername</Label>
              <Input
                value={form.sms_sender_name}
                onChange={(e) => updateField("sms_sender_name", e.target.value)}
                placeholder="MusterGmbH"
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">Max. 11 Zeichen (alphanumerisch). Wird als Absender bei SMS angezeigt.</p>
              {errors.sms_sender_name && <p className="text-xs text-destructive">{errors.sms_sender_name}</p>}
            </div>

            {/* Brand Color */}
            <div className="space-y-2">
              <Label>Brandingfarbe</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brand_color}
                  onChange={(e) => updateField("brand_color", e.target.value)}
                  className="w-10 h-10 rounded-md border border-input cursor-pointer p-0"
                />
                <Input
                  value={form.brand_color}
                  onChange={(e) => updateField("brand_color", e.target.value)}
                  placeholder="#3B82F6"
                  className="w-32"
                />
                {errors.brand_color && <p className="text-xs text-destructive">{errors.brand_color}</p>}
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={isPending} className="w-full mt-2">
              {isPending
                ? (isEditing ? "Wird gespeichert..." : "Wird erstellt...")
                : (isEditing ? "Branding speichern" : "Branding erstellen")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !brandings?.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Palette className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Noch keine Brandings vorhanden.</p>
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Erstes Branding hinzufügen
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Unternehmen</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Farbe</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brandings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs text-muted-foreground">{b.id.slice(0, 8)}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(b.id);
                            toast.success("ID kopiert");
                          }}
                        >
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.logo_url ? (
                        <img src={b.logo_url} alt="Logo" className="h-8 w-8 rounded object-contain" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Palette className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{b.company_name}</TableCell>
                    <TableCell className="text-muted-foreground">{b.domain || "–"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: b.brand_color || "#3B82F6" }}
                        />
                        <span className="text-xs text-muted-foreground">{b.brand_color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(b.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(b)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(b.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </>
  );
}
