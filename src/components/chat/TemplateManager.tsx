import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface TemplateManagerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TemplateManager({ open, onOpenChange }: TemplateManagerProps) {
  const qc = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [shortcode, setShortcode] = useState("");
  const [content, setContent] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editShortcode, setEditShortcode] = useState("");
  const [editContent, setEditContent] = useState("");

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const { data: templates } = useQuery({
    queryKey: ["chat-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("chat_templates").select("*").order("shortcode");
      return data ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("chat_templates").insert({ shortcode: shortcode.trim(), content: content.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-templates"] });
      setShortcode("");
      setContent("");
      setShowCreateForm(false);
      toast.success("Template erstellt");
    },
    onError: () => toast.error("Fehler beim Erstellen"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, shortcode, content }: { id: string; shortcode: string; content: string }) => {
      const { error } = await supabase.from("chat_templates").update({ shortcode, content }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-templates"] });
      setEditingId(null);
      toast.success("Template aktualisiert");
    },
    onError: () => toast.error("Fehler beim Aktualisieren"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("chat_templates").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-templates"] });
      toast.success("Template gelöscht");
    },
  });

  const startEdit = (t: { id: string; shortcode: string; content: string }) => {
    setEditingId(t.id);
    setEditShortcode(t.shortcode);
    setEditContent(t.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editingId || !editShortcode.trim() || !editContent.trim()) return;
    updateMutation.mutate({ id: editingId, shortcode: editShortcode.trim(), content: editContent.trim() });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chat-Templates verwalten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* List */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {templates?.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                {editingId === t.id ? (
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editShortcode}
                      onChange={(e) => setEditShortcode(e.target.value)}
                      className="font-mono text-sm"
                      placeholder="Shortcode"
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] text-sm"
                      placeholder="Template-Text"
                    />
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={saveEdit} disabled={updateMutation.isPending}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="font-mono text-primary text-sm font-medium shrink-0">!{t.shortcode}</span>
                    <p className="text-sm text-muted-foreground flex-1 whitespace-pre-wrap">{t.content}</p>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(t)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(t.id)}
                        className="text-destructive/60 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {(!templates || templates.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">Noch keine Templates erstellt</p>
            )}
          </div>

          {/* Create form or button */}
          {showCreateForm ? (
            <div className="space-y-3 border rounded-xl p-3">
              <Input
                placeholder="Shortcode (z.B. hallo)"
                value={shortcode}
                onChange={(e) => setShortcode(e.target.value)}
              />
              <Textarea
                placeholder="Template-Text (Variablen: %vorname%, %nachname%)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => addMutation.mutate()}
                  disabled={!shortcode.trim() || !content.trim() || addMutation.isPending}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Erstellen
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowCreateForm(false); setShortcode(""); setContent(""); }}>
                  Abbrechen
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Template erstellen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
