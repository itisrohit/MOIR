import { Message } from "@/store/chatStore";
import { useEffect, useRef, useLayoutEffect } from "react";

type MessageListProps = {
  messages: Message[];
};

export function MessageList({ messages }: MessageListProps) {
  // Create a ref for the scrollable container
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom immediately (without smooth behavior)
  const scrollToBottomImmediately = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  // Function to scroll to bottom with smooth animation
  const scrollToBottomSmooth = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Use Layout Effect for immediate scrolling on initial render
  useLayoutEffect(() => {
    scrollToBottomImmediately();
  }, []);

  // Use Effect for smooth scrolling when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottomSmooth();
    }
  }, [messages]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[70%] rounded-xl p-3 ${
              message.sender === 'me' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-accent'
            }`}
          >
            <p>{message.text}</p>
            <p className={`text-xs mt-1 ${
              message.sender === 'me' 
                ? 'text-primary-foreground/70' 
                : 'text-muted-foreground'
            }`}>{message.time}</p>
          </div>
        </div>
      ))}
      {/* Empty div at the end to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
}