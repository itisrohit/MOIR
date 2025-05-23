import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";

type MessageInputProps = {
  onSendMessage: (message: string) => void;
  conversationId: string;
};

export function MessageInput({ onSendMessage, conversationId }: MessageInputProps) {
  const [messageInput, setMessageInput] = useState("");
  const { sendTypingStatus } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect typing and send typing indicator
  useEffect(() => {
    if (messageInput && conversationId) {
      // Set typing to true
      sendTypingStatus(conversationId, true);
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(conversationId, false);
      }, 2000);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageInput, conversationId, sendTypingStatus]);
  
  // Stop typing indicator when component unmounts
  useEffect(() => {
    return () => {
      if (conversationId) {
        sendTypingStatus(conversationId, false);
      }
    };
  }, [conversationId, sendTypingStatus]);
  
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    onSendMessage(messageInput);
    setMessageInput("");
    // Stop typing indicator immediately when sending
    sendTypingStatus(conversationId, false);
  };
  
  return (
    <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 p-2 pr-2 rounded-xl bg-accent/30 border">
        <Input 
          placeholder="Type a message..." 
          className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button 
          size="icon" 
          className={cn(
            "rounded-lg h-9 w-9 transition-all duration-200",
            messageInput.trim() 
              ? "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary" 
              : "bg-accent/50 text-muted-foreground hover:bg-accent/70"
          )}
          onClick={handleSendMessage}
          disabled={!messageInput.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}