import { format, isToday, isYesterday } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "./AvatarUpload";
import { CalendarCheck, FileText, Download, PencilLine, Check, X } from "lucide-react";

interface ChatBubbleProps {
  content: string;
  senderRole: "admin" | "user";
  createdAt: string;
  isOwnMessage: boolean;
  avatarUrl?: string | null;
  senderName?: string | null;
  attachmentUrl?: string | null;
  messageId?: string;
  onEdit?: (messageId: string) => void;
  isEditing?: boolean;
  editText?: string;
  onEditChange?: (text: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
}

function getFileName(url: string) {
  try {
    const parts = url.split("/");
    const last = decodeURIComponent(parts[parts.length - 1]);
    // Remove uuid prefix: uuid_filename -> filename
    const match = last.match(/^[a-f0-9-]{36}_(.+)$/i);
    return match ? match[1] : last;
  } catch {
    return "Datei";
  }
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i.test(url);
}

function AttachmentDisplay({ url, isOwn }: { url: string; isOwn: boolean }) {
  const fileName = getFileName(url);

  if (isImageUrl(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
        <img
          src={url}
          alt={fileName}
          className="max-w-[220px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 mb-1.5 px-3 py-2 rounded-lg text-xs hover:opacity-80 transition-opacity",
        isOwn ? "bg-primary-foreground/10" : "bg-background/60"
      )}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate flex-1">{fileName}</span>
      <Download className="h-3.5 w-3.5 shrink-0 opacity-60" />
    </a>
  );
}

export function ChatBubble({ content, createdAt, isOwnMessage, avatarUrl, senderName, attachmentUrl, messageId, onEdit, isEditing, editText, onEditChange, onEditSave, onEditCancel }: ChatBubbleProps) {
  return (
    <div className={cn("flex w-full mb-3 gap-2 group", isOwnMessage ? "justify-end" : "justify-start")}>
      {!isOwnMessage && (
        <AvatarUpload avatarUrl={avatarUrl} name={senderName} size={24} className="mt-1" />
      )}
      <div className="flex flex-col max-w-[75%]">
        {!isOwnMessage && senderName && (
          <span className="text-[11px] text-muted-foreground mb-0.5 ml-1">{senderName}</span>
        )}
        <div className="relative">
          {onEdit && messageId && !isEditing && (
            <button
              onClick={() => onEdit(messageId)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
              title="Bearbeiten"
            >
              <PencilLine className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <div
            className={cn(
              "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden",
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            )}
          >
            {attachmentUrl && <AttachmentDisplay url={attachmentUrl} isOwn={isOwnMessage} />}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => onEditChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEditSave?.(); }
                    if (e.key === "Escape") onEditCancel?.();
                  }}
                  className="w-full bg-transparent border border-primary-foreground/30 rounded-lg px-2 py-1 text-sm resize-none focus:outline-none min-h-[40px]"
                  autoFocus
                />
                <div className="flex gap-1 justify-end">
                  <button onClick={onEditCancel} className="p-1 rounded hover:bg-primary-foreground/20 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={onEditSave} className="p-1 rounded hover:bg-primary-foreground/20 transition-colors">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              content && <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{content}</p>
            )}
            <p
              className={cn(
                "text-[10px] mt-1.5 opacity-60",
                isOwnMessage ? "text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {format(new Date(createdAt), "HH:mm")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const label = isToday(d)
    ? "Heute"
    : isYesterday(d)
      ? "Gestern"
      : format(d, "d. MMMM yyyy", { locale: de });

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-border" />
      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

export function SystemMessage({ content, metadata, onAcceptOrder }: { content: string; metadata?: Record<string, any> | null; onAcceptOrder?: (metadata: Record<string, any>) => void }) {
  const isOrderOffer = metadata?.type === "order_offer";
  const isAccepted = metadata?.accepted === true;

  if (isOrderOffer) {
    return (
      <div className="flex items-center justify-center my-4">
        <div className="bg-muted/60 rounded-xl px-5 py-4 max-w-[85%] space-y-2">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">Neuer Auftrag</span>
          </div>
          <p className="text-sm text-foreground">{metadata.order_title} ({metadata.order_number})</p>
          <p className="text-xs text-muted-foreground">Prämie: {metadata.reward}{String(metadata.reward || "").includes("€") ? "" : " €"}</p>
          {isAccepted ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium pt-1">
              <CalendarCheck className="h-3.5 w-3.5" />
              Angenommen
            </div>
          ) : onAcceptOrder ? (
            <button
              onClick={() => onAcceptOrder(metadata)}
              className="mt-1 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Annehmen
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 my-4">
      <div className="inline-flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2 max-w-[85%]">
        <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground leading-snug">{content}</span>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex w-full mb-3 gap-2 justify-start">
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
