import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send } from "lucide-react";

type MessageInputProps = {
  onSendMessage: (message: string) => void;
};

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [messageInput, setMessageInput] = useState("");
  
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    onSendMessage(messageInput);
    setMessageInput("");
  };
  
  return (
    <div className="p-4 border-t">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Attach file">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input 
          placeholder="Type a message..." 
          className="flex-1"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button 
          size="icon" 
          className="rounded-full"
          onClick={handleSendMessage}
          disabled={!messageInput.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}