import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, FileText, Trash2 } from "lucide-react";
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

type ApplicationForm = z.infer<typeof applicationSchema>;

const initialForm: ApplicationForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  street: "",
  zip_code: "",
  city: "",
  employment_type: "vollzeit",
  branding_id: "",
};

const employmentLabels: Record<string, string> = {
  minijob: "Minijob",
  teilzeit: "Teilzeit",
  vollzeit: "Vollzeit",
};

export default function AdminBewerbungen() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, brandings(company_name)")
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

  const createMutation = useMutation({
    mutationFn: async (data: ApplicationForm) => {
      const payload: Record<string, string | null> = {};
      Object.entries(data).forEach(([key, value]) => {
        payload[key] = value === "" ? null : (value as string);
      });
      const { error } = await supabase.from("applications").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setOpen(false);
      setForm(initialForm);
      setErrors({});
      toast.success("Bewerbung hinzugefügt");
    },
    onError: () => toast.error("Fehler beim Erstellen"),
  });

  const handleSubmit = () => {
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
    createMutation.mutate(result.data);
  };

  const updateField = (key: keyof ApplicationForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
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
        <Dialog open={open} onOpenChange={setOpen}>
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
              {/* Name */}
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

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-Mail *</Label>
                  <Input value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="max@example.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+49 123 456789" />
                </div>
              </div>

              {/* Address */}
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

              {/* Employment Type */}
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

              {/* Branding */}
              <div className="space-y-2">
                <Label>Branding</Label>
                <Select value={form.branding_id} onValueChange={(v) => updateField("branding_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Branding wählen (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandings?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full mt-2">
                {createMutation.isPending ? "Wird hinzugefügt..." : "Bewerbung hinzufügen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Table */}
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
                  <TableHead>Eingegangen</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.first_name} {a.last_name}</TableCell>
                    <TableCell className="text-muted-foreground">{a.email}</TableCell>
                    <TableCell className="text-muted-foreground">{a.phone || "–"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.zip_code || a.city ? `${a.zip_code || ""} ${a.city || ""}`.trim() : "–"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{employmentLabels[a.employment_type] || a.employment_type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.brandings?.company_name || "–"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(a.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
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
