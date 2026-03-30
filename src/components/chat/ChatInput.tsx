import { useState, useRef, useEffect } from "react";
import { Send, Plus, X, FileText, Sparkles, Check, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TemplateDropdown } from "./TemplateDropdown";
import { TemplateManager } from "./TemplateManager";
import { EmojiPicker } from "./EmojiPicker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (text: string, file?: File) => void;
  showTemplates?: boolean;
  contractData?: { first_name?: string | null; last_name?: string | null };
  onTyping?: (draft: string) => void;
  externalValue?: string | null;
  onExternalValueConsumed?: () => void;
}

export function ChatInput({ onSend, showTemplates = false, contractData, onTyping, externalValue, onExternalValueConsumed }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [polishedText, setPolishedText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, [input]);

  // Accept external value (e.g. AI suggestion)
  useEffect(() => {
    if (externalValue != null && externalValue !== "") {
      setInput(externalValue);
      onExternalValueConsumed?.();
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [externalValue]);

  const handleChange = (val: string) => {
    setInput(val);
    onTyping?.(val);
    if (showTemplates && val.startsWith("!")) {
      setTemplateSearch(val.slice(1));
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleTemplateSelect = (content: string) => {
    let resolved = content;
    if (contractData) {
      resolved = resolved
        .replace(/%vorname%/gi, contractData.first_name ?? "")
        .replace(/%nachname%/gi, contractData.last_name ?? "");
    }
    setInput(resolved);
    setShowDropdown(false);
  };

  const handleSend = () => {
    if (!input.trim() && !selectedFile) return;
    onSend(input.trim(), selectedFile ?? undefined);
    setInput("");
    setSelectedFile(null);
    setShowDropdown(false);
    onTyping?.("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isImage = selectedFile && selectedFile.type.startsWith("image/");

  const handleEmojiSelect = (emoji: string) => {
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? input.length;
    const end = ta?.selectionEnd ?? input.length;
    const newVal = input.substring(0, start) + emoji + input.substring(end);
    handleChange(newVal);
    requestAnimationFrame(() => {
      ta?.focus();
      const pos = start + emoji.length;
      ta?.setSelectionRange(pos, pos);
    });
  };

  const handleCreateNew = () => {
    setShowDropdown(false);
    setTemplateManagerOpen(true);
  };

  const handleAiPolish = async () => {
    if (!input.trim() || polishing) return;
    setPolishing(true);
    setPolishedText(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat-polish", {
        body: { text: input.trim() },
      });
      if (error) throw new Error(error.message || "Fehler");
      if (data?.error) {
        toast.error(data.error);
      } else if (data?.polished) {
        setPolishedText(data.polished);
      }
    } catch (err: any) {
      console.error("AI polish error:", err);
      toast.error("KI-Optimierung fehlgeschlagen");
    } finally {
      setPolishing(false);
    }
  };

  return (
    <div className="relative border-t border-border p-3">
      {showTemplates && (
        <TemplateDropdown
          search={templateSearch}
          onSelect={handleTemplateSelect}
          visible={showDropdown}
          onCreateNew={handleCreateNew}
        />
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 text-sm max-w-[80%]">
            {isImage ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="preview"
                className="h-8 w-8 rounded object-cover"
              />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="truncate text-foreground">{selectedFile.name}</span>
            <button
              onClick={() => setSelectedFile(null)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Anhang hinzufügen"
        >
          <Plus className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileSelect}
        />

        <EmojiPicker onSelect={handleEmojiSelect} />

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={showTemplates ? "Nachricht oder !template..." : "Nachricht schreiben..."}
          className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[40px] max-h-[200px] overflow-y-auto"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() && !selectedFile}
          className={cn(
            "shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all",
            input.trim() || selectedFile
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Template Manager Dialog */}
      <TemplateManager open={templateManagerOpen} onOpenChange={setTemplateManagerOpen} />
    </div>
  );
}
