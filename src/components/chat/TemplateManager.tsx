import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function TemplateManager() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [shortcode, setShortcode] = useState("");
  const [content, setContent] = useState("");

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
      toast.success("Template erstellt");
    },
    onError: () => toast.error("Fehler beim Erstellen"),
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50">
          <Settings className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chat-Templates verwalten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new */}
          <div className="flex gap-2">
            <Input
              placeholder="Shortcode (z.B. hallo)"
              value={shortcode}
              onChange={(e) => setShortcode(e.target.value)}
              className="w-32"
            />
            <Textarea
              placeholder="Template-Text (Variablen: %vorname%, %nachname%)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 min-h-[60px]"
            />
            <Button
              size="icon"
              onClick={() => addMutation.mutate()}
              disabled={!shortcode.trim() || !content.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {templates?.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                <span className="font-mono text-primary text-sm font-medium shrink-0">!{t.shortcode}</span>
                <p className="text-sm text-muted-foreground flex-1">{t.content}</p>
                <button
                  onClick={() => deleteMutation.mutate(t.id)}
                  className="text-destructive/60 hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(!templates || templates.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">Noch keine Templates erstellt</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
