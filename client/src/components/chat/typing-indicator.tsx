import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isTyping?: boolean;
  className?: string;
  userName?: string; // Add this prop
}

export function TypingIndicator({ isTyping = false, className, userName }: TypingIndicatorProps) {
  if (!isTyping) return null;
  
  return (
    <div className={cn("flex items-end gap-2 max-w-[70%] mr-auto", className)}>
      <div className="flex items-center gap-1 px-4 py-3 rounded-xl bg-muted rounded-tl-none">
        {userName && (
          <span className="text-xs text-muted-foreground mr-1">{userName} is typing</span>
        )}
        <div className="bg-accent-foreground/70 h-2 w-2 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
        <div className="bg-accent-foreground/70 h-2 w-2 rounded-full animate-pulse" style={{ animationDelay: "200ms" }}></div>
        <div className="bg-accent-foreground/70 h-2 w-2 rounded-full animate-pulse" style={{ animationDelay: "400ms" }}></div>
      </div>
    </div>
  );
}