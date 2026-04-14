import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";

/* ── Custom FontSize extension ── */
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
          renderHTML: (attrs) =>
            attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

/* ── Toolbar ── */
function MenuBar({ editor }: { editor: any }) {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-2 rounded hover:bg-muted transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground"}`;

  const currentFontSize = editor.getAttributes("textStyle")?.fontSize || "";

  return (
    <div className="flex items-center gap-0.5 border-b border-border px-3 py-2 flex-wrap">
      <button type="button" className={btnClass(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" className={btnClass(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" className={btnClass(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button type="button" className={btnClass(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      <button type="button" className={btnClass(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </button>
      <button type="button" className={btnClass(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Alignment */}
      <button type="button" className={btnClass(editor.isActive({ textAlign: "left" }))} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft className="h-4 w-4" />
      </button>
      <button type="button" className={btnClass(editor.isActive({ textAlign: "center" }))} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter className="h-4 w-4" />
      </button>
      <button type="button" className={btnClass(editor.isActive({ textAlign: "right" }))} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Heading select */}
      <Select
        value={
          editor.isActive("heading", { level: 1 }) ? "h1"
          : editor.isActive("heading", { level: 2 }) ? "h2"
          : editor.isActive("heading", { level: 3 }) ? "h3"
          : "normal"
        }
        onValueChange={(val) => {
          if (val === "normal") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: parseInt(val.replace("h", "")) as 1 | 2 | 3 }).run();
        }}
      >
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="h1">Überschrift 1</SelectItem>
          <SelectItem value="h2">Überschrift 2</SelectItem>
          <SelectItem value="h3">Überschrift 3</SelectItem>
        </SelectContent>
      </Select>

      {/* Font size select */}
      <Select
        value={currentFontSize || "default"}
        onValueChange={(val) => {
          if (val === "default") editor.chain().focus().unsetFontSize().run();
          else editor.chain().focus().setFontSize(val).run();
        }}
      >
        <SelectTrigger className="h-8 w-20 text-xs">
          <SelectValue placeholder="Größe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Standard</SelectItem>
          <SelectItem value="10px">10</SelectItem>
          <SelectItem value="12px">12</SelectItem>
          <SelectItem value="14px">14</SelectItem>
          <SelectItem value="16px">16</SelectItem>
          <SelectItem value="18px">18</SelectItem>
          <SelectItem value="20px">20</SelectItem>
          <SelectItem value="24px">24</SelectItem>
          <SelectItem value="28px">28</SelectItem>
          <SelectItem value="32px">32</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function AdminVertragsvorlageForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeBrandingId } = useBrandingFilter();

  const [title, setTitle] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [salary, setSalary] = useState("");
  const [isActive, setIsActive] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontSize,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none",
      },
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["contract-template", id],
    enabled: isEdit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_templates" as any)
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (existing) {
      setTitle(existing.title || "");
      setEmploymentType(existing.employment_type || "");
      setSalary(existing.salary?.toString() || "");
      setIsActive(existing.is_active ?? true);
      if (editor && existing.content) {
        editor.commands.setContent(existing.content);
      }
    }
  }, [existing, editor]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content = editor?.getHTML() || "";
      const payload = {
        title,
        employment_type: employmentType,
        salary: salary ? parseFloat(salary) : null,
        content,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        const { error } = await supabase
          .from("contract_templates" as any)
          .update(payload)
          .eq("id", id!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("contract_templates" as any)
          .insert({ ...payload, branding_id: activeBrandingId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
      toast.success(isEdit ? "Vorlage aktualisiert" : "Vorlage erstellt");
      navigate("/admin/vertragsvorlagen");
    },
    onError: () => toast.error("Fehler beim Speichern"),
  });

  const isValid = title.trim() && employmentType;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {isEdit ? "Vertragsvorlage bearbeiten" : "Neue Vertragsvorlage erstellen"}
          </h2>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/vertragsvorlagen")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Vertragsvorlage Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input placeholder="Vertragsvorlage Titel" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger><SelectValue placeholder="Anstellungsart wählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minijob">Minijob</SelectItem>
                  <SelectItem value="teilzeit">Teilzeit</SelectItem>
                  <SelectItem value="vollzeit">Vollzeit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monatliches Gehalt (€)</Label>
              <Input type="number" placeholder="z.B. 2500" value={salary} onChange={e => setSalary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={isActive ? "active" : "inactive"} onValueChange={v => setIsActive(v === "active")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Vertragstext</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-6 pb-4">
            Verwenden Sie Platzhalter im Format {"{{ variableName }}"}. Diese werden automatisch erkannt und unten angezeigt.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/admin/vertragsvorlagen")}>Abbrechen</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={!isValid || saveMutation.isPending}>
          {saveMutation.isPending ? "Speichern..." : isEdit ? "Aktualisieren" : "Erstellen"}
        </Button>
      </div>
    </div>
  );
}
