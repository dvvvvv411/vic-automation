import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  review_questions: string[];
  created_at: string;
}

const emptyForm = {
  order_number: "",
  title: "",
  provider: "",
  reward: "",
  is_placeholder: false,
  appstore_url: "",
  playstore_url: "",
  project_goal: "",
  review_questions: [] as string[],
};

export default function AdminAuftraege() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        order_number: form.order_number,
        title: form.title,
        provider: form.provider,
        reward: form.reward,
        is_placeholder: form.is_placeholder,
        appstore_url: form.is_placeholder ? form.appstore_url || null : null,
        playstore_url: form.is_placeholder ? form.playstore_url || null : null,
        project_goal: form.project_goal || null,
        review_questions: form.review_questions,
      };
      if (editingId) {
        const { error } = await supabase.from("orders").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("orders").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: editingId ? "Auftrag aktualisiert" : "Auftrag erstellt" });
      closeDialog();
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Auftrag gelöscht" });
    },
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(order: Order) {
    setEditingId(order.id);
    setForm({
      order_number: order.order_number,
      title: order.title,
      provider: order.provider,
      reward: order.reward,
      is_placeholder: order.is_placeholder,
      appstore_url: order.appstore_url ?? "",
      playstore_url: order.playstore_url ?? "",
      project_goal: order.project_goal ?? "",
      review_questions: Array.isArray(order.review_questions) ? order.review_questions : [],
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function addQuestion() {
    setForm((f) => ({ ...f, review_questions: [...f.review_questions, ""] }));
  }

  function updateQuestion(index: number, value: string) {
    setForm((f) => {
      const q = [...f.review_questions];
      q[index] = value;
      return { ...f, review_questions: q };
    });
  }

  function removeQuestion(index: number) {
    setForm((f) => ({
      ...f,
      review_questions: f.review_questions.filter((_, i) => i !== index),
    }));
  }

  const canSave = form.order_number && form.title && form.provider && form.reward;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Aufträge</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Auftrag hinzufügen
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Auftragsnr.</TableHead>
              <TableHead>Titel</TableHead>
              <TableHead>Anbieter</TableHead>
              <TableHead>Prämie</TableHead>
              <TableHead>Platzhalter</TableHead>
              <TableHead>Erstellt am</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Laden...
                </TableCell>
              </TableRow>
            ) : !orders?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Keine Aufträge vorhanden
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono">{o.order_number}</TableCell>
                  <TableCell>{o.title}</TableCell>
                  <TableCell>{o.provider}</TableCell>
                  <TableCell>{o.reward}</TableCell>
                  <TableCell>
                    <Badge variant={o.is_placeholder ? "default" : "secondary"}>
                      {o.is_placeholder ? "Ja" : "Nein"}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(o.created_at), "dd.MM.yyyy")}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(o)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(o.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Auftrag bearbeiten" : "Neuer Auftrag"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Bearbeite die Auftragsdetails." : "Erstelle einen neuen Auftrag."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auftragsnummer *</Label>
                <Input value={form.order_number} onChange={(e) => setForm((f) => ({ ...f, order_number: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Titel *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Anbieter *</Label>
                <Input value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Prämie *</Label>
                <Input value={form.reward} onChange={(e) => setForm((f) => ({ ...f, reward: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_placeholder}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_placeholder: v }))}
              />
              <Label>Platzhalter</Label>
            </div>

            {form.is_placeholder && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AppStore Link</Label>
                  <Input
                    placeholder="https://apps.apple.com/..."
                    value={form.appstore_url}
                    onChange={(e) => setForm((f) => ({ ...f, appstore_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>PlayStore Link</Label>
                  <Input
                    placeholder="https://play.google.com/..."
                    value={form.playstore_url}
                    onChange={(e) => setForm((f) => ({ ...f, playstore_url: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Projektziel</Label>
              <Textarea
                rows={4}
                placeholder="Detaillierte Anweisungen für diesen Auftrag..."
                value={form.project_goal}
                onChange={(e) => setForm((f) => ({ ...f, project_goal: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Bewertungsfragen</Label>
              {form.review_questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={q}
                    placeholder={`Frage ${i + 1}`}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeQuestion(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-1" />
                Frage hinzufügen
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Abbrechen</Button>
            <Button disabled={!canSave || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
