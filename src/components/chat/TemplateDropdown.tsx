import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TemplateDropdownProps {
  search: string;
  onSelect: (content: string) => void;
  visible: boolean;
}

export function TemplateDropdown({ search, onSelect, visible }: TemplateDropdownProps) {
  const { data: templates } = useQuery({
    queryKey: ["chat-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("chat_templates").select("*").order("shortcode");
      return data ?? [];
    },
  });

  if (!visible || !templates?.length) return null;

  const filtered = templates.filter((t) =>
    t.shortcode.toLowerCase().startsWith(search.toLowerCase())
  );

  if (!filtered.length) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
      {filtered.map((t) => (
        <button
          key={t.id}
          className="w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 text-sm"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(t.content);
          }}
        >
          <span className="font-mono text-primary font-medium shrink-0">!{t.shortcode}</span>
          <span className="text-muted-foreground truncate">{t.content}</span>
        </button>
      ))}
    </div>
  );
}
