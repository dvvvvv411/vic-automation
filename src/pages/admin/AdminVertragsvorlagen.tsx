import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Eye, Pencil, Copy, Trash2, FileText, Download, Upload, RefreshCw, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

const SIGNATURE_FONTS = [
  { id: "elegant", label: "Elegant", description: "Stilvolle, klassische Handschrift", family: "'Dancing Script', cursive" },
  { id: "professional", label: "Professional", description: "Klare, professionelle Unterschrift", family: "'Great Vibes', cursive" },
  { id: "cursive", label: "Cursive", description: "Schwungvolle, fließende Schrift", family: "'Pacifico', cursive" },
  { id: "bold", label: "Bold", description: "Kräftige, ausdrucksstarke Unterschrift", family: "'Satisfy', cursive" },
];

export default function AdminVertragsvorlagen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeBrandingId, ready } = useBrandingFilter();
  const [sigDialogOpen, setSigDialogOpen] = useState(false);
  const [sigName, setSigName] = useState("");
  const [sigTitle, setSigTitle] = useState("");
  const [selectedFont, setSelectedFont] = useState("elegant");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  // Load templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["contract-templates", activeBrandingId],
    enabled: ready && !!activeBrandingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_templates" as any)
        .select("*")
        .eq("branding_id", activeBrandingId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Load branding for signature
  const { data: branding } = useQuery({
    queryKey: ["branding-signature", activeBrandingId],
    enabled: ready && !!activeBrandingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brandings")
        .select("signature_image_url, signer_name, signer_title, signature_font")
        .eq("id", activeBrandingId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  // Delete template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contract_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
      toast.success("Vorlage gelöscht");
    },
  });

  // Duplicate template
  const duplicateMutation = useMutation({
    mutationFn: async (template: any) => {
      const { error } = await supabase.from("contract_templates" as any).insert({
        branding_id: template.branding_id,
        title: `${template.title} (Kopie)`,
        employment_type: template.employment_type,
        salary: template.salary,
        content: template.content,
        is_active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
      toast.success("Vorlage dupliziert");
    },
  });

  // Save signature settings
  const saveSignature = useMutation({
    mutationFn: async (imageUrl: string) => {
      const { error } = await supabase
        .from("brandings")
        .update({
          signature_image_url: imageUrl,
          signer_name: sigName,
          signer_title: sigTitle,
          signature_font: selectedFont,
        } as any)
        .eq("id", activeBrandingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branding-signature"] });
      setSigDialogOpen(false);
      toast.success("Unterschrift generiert");
    },
  });

  // Update signer info without generating
  const updateSignerInfo = useMutation({
    mutationFn: async ({ name, title }: { name: string; title: string }) => {
      const { error } = await supabase
        .from("brandings")
        .update({ signer_name: name, signer_title: title } as any)
        .eq("id", activeBrandingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branding-signature"] });
    },
  });

  // Delete signature
  const deleteSignature = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("brandings")
        .update({ signature_image_url: null, signature_font: null } as any)
        .eq("id", activeBrandingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branding-signature"] });
      toast.success("Unterschrift gelöscht");
    },
  });

  // Upload custom signature image
  const handleUploadSignature = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `signatures/${activeBrandingId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("branding-logos").upload(path, file);
    if (error) { toast.error("Upload fehlgeschlagen"); return; }
    const { data: urlData } = supabase.storage.from("branding-logos").getPublicUrl(path);
    await supabase.from("brandings").update({ signature_image_url: urlData.publicUrl } as any).eq("id", activeBrandingId!);
    queryClient.invalidateQueries({ queryKey: ["branding-signature"] });
    toast.success("Unterschrift hochgeladen");
  };

  // Generate signature from canvas
  const generateSignature = async () => {
    const font = SIGNATURE_FONTS.find(f => f.id === selectedFont);
    if (!font || !sigName) return;

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 600, 200);
    ctx.font = `48px ${font.family}`;
    ctx.fillStyle = "#1a1a2e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sigName, 300, 100);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const path = `signatures/${activeBrandingId}-${Date.now()}.png`;
      const { error } = await supabase.storage.from("branding-logos").upload(path, blob, { contentType: "image/png" });
      if (error) { toast.error("Fehler beim Speichern"); return; }
      const { data: urlData } = supabase.storage.from("branding-logos").getPublicUrl(path);
      saveSignature.mutate(urlData.publicUrl);
    }, "image/png");
  };

  const openSigDialog = () => {
    setSigName(branding?.signer_name || "");
    setSigTitle(branding?.signer_title || "");
    setSelectedFont(branding?.signature_font || "elegant");
    setSigDialogOpen(true);
  };

  const employmentLabels: Record<string, string> = { minijob: "Minijob", teilzeit: "Teilzeit", vollzeit: "Vollzeit" };

  return (
    <>
      {/* Google Fonts for signatures */}
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Satisfy&display=swap" rel="stylesheet" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Vertragsvorlagen</h2>
            <p className="text-muted-foreground mt-1">Verwalten Sie Ihre Arbeitsvertragsvorlagen.</p>
          </div>
          <Button onClick={() => navigate("/admin/vertragsvorlagen/neu")}>
            <Plus className="h-4 w-4 mr-2" /> Neue Vorlage
          </Button>
        </div>
      </motion.div>

      {/* Templates Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-10">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !templates?.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Noch keine Vertragsvorlagen erstellt.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/vertragsvorlagen/neu")}>
              <Plus className="h-4 w-4 mr-2" /> Erste Vorlage erstellen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t: any, i: number) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">{t.title}</h3>
                      </div>
                      <Badge variant={t.is_active ? "default" : "outline"} className={t.is_active ? "bg-green-100 text-green-800 border-green-200" : ""}>
                        {t.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Kategorie</p>
                        <p className="text-sm font-medium">{employmentLabels[t.employment_type] || t.employment_type}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Gehalt</p>
                        <p className="text-sm font-medium">{t.salary ? `${t.salary} €` : "–"}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-4">
                      Zuletzt bearbeitet: {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true, locale: de })}
                    </p>

                    <div className="flex items-center gap-1 border-t border-border pt-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPreviewContent(t.content); setPreviewOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Vorschau</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/vertragsvorlagen/${t.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bearbeiten</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateMutation.mutate(t)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplizieren</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Löschen</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Firmenunterschrift Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Tag className="h-5 w-5" /> Firmenunterschrift
          </h3>
          <div className="flex gap-2">
            {branding?.signature_image_url && (
              <>
                <Button variant="outline" size="sm" onClick={() => window.open(branding.signature_image_url, "_blank")}>
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => deleteSignature.mutate()}>
                  <Trash2 className="h-4 w-4 mr-1" /> Löschen
                </Button>
              </>
            )}
            <label>
              <Button variant="outline" size="sm" asChild>
                <span><Upload className="h-4 w-4 mr-1" /> Hochladen</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUploadSignature(e.target.files[0])} />
            </label>
          </div>
        </div>

        <Card key={activeBrandingId}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Signature Preview */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Aktuelle Unterschrift</p>
                <div className="border border-border rounded-lg p-6 bg-background flex items-center justify-center min-h-[120px]">
                  {branding?.signature_image_url ? (
                    <img src={branding.signature_image_url} alt="Unterschrift" className="max-h-24 object-contain" />
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Unterschrift vorhanden</p>
                  )}
                </div>
                {branding?.signature_image_url && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Generiert {branding.signature_font ? `mit ${SIGNATURE_FONTS.find(f => f.id === branding.signature_font)?.label || branding.signature_font}` : ""}
                  </p>
                )}
              </div>

              {/* Signer Info */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Unterzeichner-Informationen</p>
                {branding?.signer_name ? (
                  <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{branding.signer_name}</span>
                    </div>
                    {branding.signer_title && (
                      <p className="text-sm text-muted-foreground ml-6">{branding.signer_title}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Noch nicht konfiguriert</p>
                )}
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <Button onClick={openSigDialog}>
                <RefreshCw className="h-4 w-4 mr-2" /> Neue Unterschrift generieren
              </Button>
            </div>

            {/* Name & Title Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name des Unterzeichners</Label>
                <Input
                  placeholder="z.B. Max Mustermann"
                  defaultValue={branding?.signer_name || ""}
                  onBlur={(e) => {
                    if (e.target.value !== branding?.signer_name) {
                      updateSignerInfo.mutate({ name: e.target.value, title: branding?.signer_title || "" });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Name der Person, die für das Unternehmen unterschreibt</p>
              </div>
              <div className="space-y-2">
                <Label>Titel des Unterzeichners</Label>
                <Input
                  placeholder="z.B. Geschäftsführer"
                  defaultValue={branding?.signer_title || ""}
                  onBlur={(e) => {
                    if (e.target.value !== branding?.signer_title) {
                      updateSignerInfo.mutate({ name: branding?.signer_name || "", title: e.target.value });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Position oder Titel des Unterzeichners</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Signature Generator Dialog */}
      <Dialog open={sigDialogOpen} onOpenChange={setSigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" /> Firmenunterschrift Generator
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name des Unterzeichners</Label>
                <Input value={sigName} onChange={e => setSigName(e.target.value)} placeholder="z.B. Max Mustermann" />
                <p className="text-xs text-muted-foreground">Name für die Unterschrift</p>
              </div>
              <div className="space-y-2">
                <Label>Titel des Unterzeichners</Label>
                <Input value={sigTitle} onChange={e => setSigTitle(e.target.value)} placeholder="z.B. Geschäftsführer" />
                <p className="text-xs text-muted-foreground">Position des Unterzeichners</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Unterschrift-Stil wählen</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SIGNATURE_FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => setSelectedFont(font.id)}
                    className={`rounded-lg border-2 p-4 text-center transition-all ${
                      selectedFont === font.id
                        ? "border-destructive bg-destructive/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">{font.label}</p>
                    <p className="text-[10px] text-muted-foreground mb-3">{font.description}</p>
                    <div className="bg-background rounded p-3 min-h-[40px] flex items-center justify-center">
                      <span style={{ fontFamily: font.family, fontSize: "20px", color: "#1a1a2e" }}>
                        {sigName || "Vorname Nachname"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button onClick={generateSignature} disabled={!sigName || saveSignature.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" /> Unterschrift generieren
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSigDialogOpen(false)}>Abbrechen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vertragsvorschau</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewContent }} />
        </DialogContent>
      </Dialog>
    </>
  );
}
