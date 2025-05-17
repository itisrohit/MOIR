import { ChatHeader } from "./chatHeader";
import { MessageList } from "./messageList";
import { MessageInput } from "./messageInput";
import { EmptyChat } from "./emptyChat";
import { EmptyMessage } from "./emptyMessage";
import { ChatData } from "@/types/chat";  // Import shared types

type MessageLayoutProps = {
  selectedChatId: number | null;
  chatData?: ChatData;
  onSendMessage: (message: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
};

export function MessageLayout({
  selectedChatId,
  chatData,
  onSendMessage,
  onBack,
  showBackButton = false
}: MessageLayoutProps) {
  return (
    <div className="flex-1 flex flex-col h-full">
      {selectedChatId !== null && chatData ? (
        <>
          <ChatHeader 
            name={chatData.name} 
            avatar={chatData.avatar || ""} 
            online={chatData.online}
            onBack={onBack}
            showBackButton={showBackButton}
          />
          
          {/* Show message list only if there are messages */}
          {chatData.messages && chatData.messages.length > 0 ? (
            <MessageList messages={chatData.messages} />
          ) : (
            <EmptyMessage 
              name={chatData.name} 
              onSendMessage={onSendMessage} 
            />
          )}
          
          <MessageInput onSendMessage={onSendMessage} />
        </>
      ) : (
        <EmptyChat />
      )}
    </div>
  );
}