import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, StickyNote, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";

interface BrandingNotesProps {
  brandingId: string;
  pageContext: "bewerbungsgespraeche" | "probetag";
}

export default function BrandingNotes({ brandingId, pageContext }: BrandingNotesProps) {
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const qk = ["branding-notes", brandingId, pageContext];

  const { data: notes = [], isLoading } = useQuery({
    queryKey: qk,
    enabled: !!brandingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branding_notes" as any)
        .select("*")
        .eq("branding_id", brandingId)
        .eq("page_context", pageContext)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: currentEmail } = useQuery({
    queryKey: ["current-user-email"],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.email ?? null;
    },
  });

  const handleSubmit = async () => {
    if (!newNote.trim() || !currentEmail) return;
    setSubmitting(true);
    const { error } = await supabase.from("branding_notes" as any).insert({
      branding_id: brandingId,
      page_context: pageContext,
      content: newNote.trim(),
      author_email: currentEmail,
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error("Notiz konnte nicht gespeichert werden.");
      return;
    }
    setNewNote("");
    queryClient.invalidateQueries({ queryKey: qk });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("branding_notes" as any).delete().eq("id", id);
    if (error) {
      toast.error("Notiz konnte nicht gelöscht werden.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: qk });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="mb-6 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Notizen</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <Textarea
          placeholder="Notiz hinzufügen..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[60px] text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!newNote.trim() || submitting}
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Laden...</p>
      ) : !notes.length ? (
        <p className="text-xs text-muted-foreground">Noch keine Notizen.</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {notes.map((note: any) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/50 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {note.author_email} · {format(new Date(note.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                </p>
              </div>
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(note.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
