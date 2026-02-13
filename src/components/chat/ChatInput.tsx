import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { TemplateDropdown } from "./TemplateDropdown";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  showTemplates?: boolean;
  contractData?: { first_name?: string | null; last_name?: string | null };
}

export function ChatInput({ onSend, showTemplates = false, contractData }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChange = (val: string) => {
    setInput(val);
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
        .replace(/%vorname%/g, contractData.first_name ?? "")
        .replace(/%nachname%/g, contractData.last_name ?? "");
    }
    setInput(resolved);
    setShowDropdown(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative border-t border-border p-3">
      {showTemplates && (
        <TemplateDropdown
          search={templateSearch}
          onSelect={handleTemplateSelect}
          visible={showDropdown}
        />
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={showTemplates ? "Nachricht oder !template..." : "Nachricht schreiben..."}
          className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[40px] max-h-[100px]"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className={cn(
            "shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all",
            input.trim()
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
