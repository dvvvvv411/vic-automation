import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  content: string;
  senderRole: "admin" | "user";
  createdAt: string;
  isOwnMessage: boolean;
}

export function ChatBubble({ content, createdAt, isOwnMessage }: ChatBubbleProps) {
  return (
    <div className={cn("flex w-full mb-3", isOwnMessage ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
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
  );
}
