import { Message } from "@/types/chat";

type MessageListProps = {
  messages: Message[];
};

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
    </div>
  );
}