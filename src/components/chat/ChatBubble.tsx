import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "./AvatarUpload";

interface ChatBubbleProps {
  content: string;
  senderRole: "admin" | "user";
  createdAt: string;
  isOwnMessage: boolean;
  avatarUrl?: string | null;
  senderName?: string | null;
}

export function ChatBubble({ content, createdAt, isOwnMessage, avatarUrl, senderName }: ChatBubbleProps) {
  return (
    <div className={cn("flex w-full mb-3 gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
      {!isOwnMessage && (
        <AvatarUpload avatarUrl={avatarUrl} name={senderName} size={24} className="mt-1" />
      )}
      <div className="flex flex-col max-w-[75%]">
        {!isOwnMessage && senderName && (
          <span className="text-[11px] text-muted-foreground mb-0.5 ml-1">{senderName}</span>
        )}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
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
