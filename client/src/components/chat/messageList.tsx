import { Message } from "@/store/chatStore";
import { useRef, useLayoutEffect } from "react";
import { Check } from "lucide-react";

type MessageListProps = {
  messages: Message[];
};

export function MessageList({ messages }: MessageListProps) {
  // Keep existing scroll handling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottomImmediately = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useLayoutEffect(() => {
    scrollToBottomImmediately();
  }, [messages]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 w-full"
    >
      {messages.map((message) => (
        <div 
          key={message.id} 
          className="flex w-full"
          style={{
            justifyContent: message.sender === 'me' ? 'flex-end' : 'flex-start'
          }}
        >
          <div 
            className={`max-w-[70%] rounded-xl p-3 break-words ${
              message.sender === 'me' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-accent'
            }`}
          >
            <p className="whitespace-normal break-words">{message.text}</p>
            
            <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
              message.sender === 'me' 
                ? 'text-primary-foreground/70' 
                : 'text-muted-foreground'
            }`}>
              <span>{message.time}</span>
              
              {/* Show read receipt (blue tick) only for messages sent by me */}
              {message.sender === 'me' && (
                <div className="flex ml-1">
                  {message.read ? (
                    // Blue double check for read messages
                    <div className="flex">
                      <Check className="h-3 w-3 text-blue-400 stroke-[3]" />
                      <Check className="h-3 w-3 text-blue-400 stroke-[3] -ml-1" />
                    </div>
                  ) : (
                    // Gray single check for sent but unread
                    <Check className="h-3 w-3 text-primary-foreground/50 stroke-[3]" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}