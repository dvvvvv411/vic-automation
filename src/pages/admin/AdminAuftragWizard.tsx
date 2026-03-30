import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, X, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";
import { cn } from "@/lib/utils";

interface WorkStep {
  title: string;
  description: string;
}

interface RequiredAttachment {
  title: string;
  description: string;
}

const STEPS = [
  "1. Grundinformationen",
  "2. Arbeitsschritte definieren",
  "3. Bewertungsfragen",
  "4. Erforderliche Anhänge",
];

const emptyForm = {
  title: "",
  description: "",
  order_type: "andere",
  reward: "",
  estimated_hours: "",
  appstore_url: "",
  playstore_url: "",
  is_starter_job: false,
  is_videochat: false,
  work_steps: [] as WorkStep[],
  review_questions: [] as string[],
  required_attachments: [] as RequiredAttachment[],
};

export default function AdminAuftragWizard() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const copyId = searchParams.get("copy");
  const queryClient = useQueryClient();
  const { activeBrandingId } = useBrandingFilter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const isEditing = !!id;

  // Fetch branding payment model
  const { data: activeBranding } = useQuery({
    queryKey: ["branding-payment-model", activeBrandingId],
    enabled: !!activeBrandingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brandings")
        .select("payment_model")
        .eq("id", activeBrandingId!)
        .single();
      if (error) throw error;
      return data as { payment_model: string };
    },
  });

  const isFixedSalary = (activeBranding as any)?.payment_model === "fixed_salary";

  const loadId = id || copyId;

  // Load existing order for editing or copying
  const { data: existingOrder, isLoading } = useQuery({
    queryKey: ["order-edit", loadId],
    enabled: !!loadId,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", loadId!).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingOrder) {
      const parseJson = (val: unknown, fallback: any[] = []) => {
        if (Array.isArray(val)) return val;
        if (typeof val === "string") { try { return JSON.parse(val); } catch { return fallback; } }
        return fallback;
      };
      setForm({
        title: (existingOrder.title ?? "") + (copyId ? " (Kopie)" : ""),
        description: (existingOrder as any).description ?? "",
        order_type: (existingOrder as any).order_type ?? "andere",
        reward: existingOrder.reward ?? "",
        estimated_hours: (existingOrder as any).estimated_hours ?? "",
        appstore_url: existingOrder.appstore_url ?? "",
        playstore_url: existingOrder.playstore_url ?? "",
        is_starter_job: (existingOrder as any).is_starter_job ?? false,
        is_videochat: (existingOrder as any).is_videochat ?? false,
        work_steps: parseJson((existingOrder as any).work_steps),
        review_questions: parseJson(existingOrder.review_questions),
        required_attachments: parseJson((existingOrder as any).required_attachments),
      });
    }
  }, [existingOrder]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        order_type: form.order_type,
        reward: isFixedSalary ? "0" : form.reward,
        estimated_hours: form.estimated_hours || null,
        appstore_url: form.appstore_url || null,
        playstore_url: form.playstore_url || null,
        is_starter_job: form.is_starter_job,
        is_videochat: form.is_videochat,
        is_placeholder: form.order_type === "platzhalter",
        work_steps: form.work_steps,
        review_questions: form.review_questions,
        required_attachments: form.required_attachments,
        order_number: "",
        provider: "",
      };
      if (isEditing) {
        const { error } = await supabase.from("orders").update(payload as any).eq("id", id!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("orders").insert({ ...payload, branding_id: activeBrandingId } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: isEditing ? "Auftrag aktualisiert" : "Auftrag erstellt" });
      navigate("/admin/auftraege");
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const canSave = form.title && (isFixedSalary || form.reward);

  // Work steps helpers
  const addWorkStep = () => setForm((f) => ({ ...f, work_steps: [...f.work_steps, { title: "", description: "" }] }));
  const updateWorkStep = (i: number, patch: Partial<WorkStep>) =>
    setForm((f) => ({ ...f, work_steps: f.work_steps.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
  const removeWorkStep = (i: number) => setForm((f) => ({ ...f, work_steps: f.work_steps.filter((_, idx) => idx !== i) }));

  // Review questions helpers
  const addQuestion = () => setForm((f) => ({ ...f, review_questions: [...f.review_questions, ""] }));
  const updateQuestion = (i: number, val: string) =>
    setForm((f) => ({ ...f, review_questions: f.review_questions.map((q, idx) => idx === i ? val : q) }));
  const removeQuestion = (i: number) => setForm((f) => ({ ...f, review_questions: f.review_questions.filter((_, idx) => idx !== i) }));

  // Required attachments helpers
  const addAttachment = () => setForm((f) => ({ ...f, required_attachments: [...f.required_attachments, { title: "", description: "" }] }));
  const updateAttachment = (i: number, patch: Partial<RequiredAttachment>) =>
    setForm((f) => ({ ...f, required_attachments: f.required_attachments.map((a, idx) => idx === i ? { ...a, ...patch } : a) }));
  const removeAttachment = (i: number) => setForm((f) => ({ ...f, required_attachments: f.required_attachments.filter((_, idx) => idx !== i) }));

  if ((isEditing || copyId) && isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/auftraege")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück
        </Button>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {isEditing ? "Auftrag bearbeiten" : "Neuen Auftrag erstellen"}
        </h2>
      </div>

      {/* Step Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {STEPS.map((label, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors",
                step === i
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 0 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Titel *</Label>
              <Input
                placeholder="Titel der Aufgabenvorlage"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                placeholder="Detaillierte Beschreibung der Aufgabe"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className={cn("grid gap-4", isFixedSalary ? "grid-cols-1" : "grid-cols-2")}>
              <div className="space-y-2">
                <Label>Typ *</Label>
                <Select value={form.order_type} onValueChange={(v) => setForm((f) => ({ ...f, order_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bankdrop">Bankdrop</SelectItem>
                    <SelectItem value="exchanger">Exchanger</SelectItem>
                    <SelectItem value="platzhalter">Platzhalter</SelectItem>
                    <SelectItem value="andere">Andere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!isFixedSalary && (
                <div className="space-y-2">
                  <Label>Vergütungsbetrag (€) *</Label>
                  <Input
                    placeholder="0.00"
                    value={form.reward}
                    onChange={(e) => setForm((f) => ({ ...f, reward: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Geschätzte Stunden</Label>
              <Input
                placeholder="Geschätzte Arbeitsstunden"
                value={form.estimated_hours}
                onChange={(e) => setForm((f) => ({ ...f, estimated_hours: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">App Store URLs</h3>
              <p className="text-xs text-muted-foreground">Fügen Sie App Store URLs hinzu, die automatisch bei Task-Zuweisungen verfügbar sind</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Google Play Store URL</Label>
                  <Input
                    placeholder="https://play.google.com/store/apps/..."
                    value={form.playstore_url}
                    onChange={(e) => setForm((f) => ({ ...f, playstore_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apple App Store URL</Label>
                  <Input
                    placeholder="https://apps.apple.com/app/..."
                    value={form.appstore_url}
                    onChange={(e) => setForm((f) => ({ ...f, appstore_url: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Card className="border border-border/60">
              <CardContent className="py-4 flex items-start gap-4">
                <Switch
                  checked={form.is_starter_job}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_starter_job: v }))}
                />
                <div>
                  <Label className="font-medium">Als Starter-Job für neue Mitarbeiter festlegen</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Diese Aufgabe wird automatisch jedem neuen Mitarbeiter direkt nach der Registrierung zugewiesen.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60">
              <CardContent className="py-4 flex items-start gap-4">
                <Switch
                  checked={form.is_videochat}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_videochat: v }))}
                />
                <div>
                  <Label className="font-medium">Video-Chat Verifizierung aktivieren</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mitarbeiter müssen vor der Bewertung eine Video-Chat Verifizierung durchführen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Arbeitsschritte definieren</h3>
              <Button variant="outline" size="sm" onClick={addWorkStep}>
                <CheckCircle className="h-4 w-4 mr-1.5" /> Schritt hinzufügen
              </Button>
            </div>

            {form.work_steps.length === 0 ? (
              <Card className="border-dashed border-2 border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-3">Keine Arbeitsschritte definiert</p>
                  <Button variant="outline" size="sm" onClick={addWorkStep}>
                    <Plus className="h-4 w-4 mr-1.5" /> Schritt hinzufügen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              form.work_steps.map((ws, i) => (
                <Card key={i} className="border border-border/60">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Schritt {i + 1}</span>
                      <button
                        onClick={() => removeWorkStep(i)}
                        className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" /> Entfernen
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Label>Titel *</Label>
                      <Input
                        value={ws.title}
                        onChange={(e) => updateWorkStep(i, { title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Beschreibung *</Label>
                      <Textarea
                        rows={3}
                        value={ws.description}
                        onChange={(e) => updateWorkStep(i, { description: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Bewertungsfragen definieren</h3>
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <CheckCircle className="h-4 w-4 mr-1.5" /> Frage hinzufügen
              </Button>
            </div>

            {form.review_questions.length === 0 ? (
              <Card className="border-dashed border-2 border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-3">Keine Bewertungsfragen definiert</p>
                  <Button variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-1.5" /> Frage hinzufügen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              form.review_questions.map((q, i) => (
                <Card key={i} className="border border-border/60">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Frage {i + 1}</span>
                      <button
                        onClick={() => removeQuestion(i)}
                        className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" /> Entfernen
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Label>Frage *</Label>
                      <Input
                        value={q}
                        placeholder={`Bewertungsfrage ${i + 1}`}
                        onChange={(e) => updateQuestion(i, e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Erforderliche Anhänge</h3>
              <Button variant="outline" size="sm" onClick={addAttachment}>
                <CheckCircle className="h-4 w-4 mr-1.5" /> Anhang hinzufügen
              </Button>
            </div>

            {form.required_attachments.length === 0 ? (
              <Card className="border-dashed border-2 border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-3">Keine erforderlichen Anhänge definiert</p>
                  <Button variant="outline" size="sm" onClick={addAttachment}>
                    <CheckCircle className="h-4 w-4 mr-1.5" /> Anhang hinzufügen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              form.required_attachments.map((att, i) => (
                <Card key={i} className="border border-border/60">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Anhang {i + 1}</span>
                      <button
                        onClick={() => removeAttachment(i)}
                        className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" /> Entfernen
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Label>Titel *</Label>
                      <Input
                        value={att.title}
                        placeholder="z.B. iTan Liste"
                        onChange={(e) => updateAttachment(i, { title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Beschreibung</Label>
                      <Textarea
                        rows={2}
                        value={att.description}
                        placeholder="Beschreiben Sie welches Dokument benötigt wird..."
                        onChange={(e) => updateAttachment(i, { description: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() => step > 0 ? setStep(step - 1) : navigate("/admin/auftraege")}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant={step < STEPS.length - 1 ? "secondary" : "default"}
            disabled={!canSave || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {saveMutation.isPending ? "Speichern..." : isEditing ? "Auftrag aktualisieren" : "Auftrag speichern"}
          </Button>
          {step < STEPS.length - 1 && (
            <Button onClick={() => setStep(step + 1)}>
              Weiter →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
