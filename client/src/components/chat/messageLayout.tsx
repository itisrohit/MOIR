import { ChatHeader } from "./chatHeader";
import { MessageList } from "./messageList";
import { MessageInput } from "./messageInput";
import { EmptyChat } from "./emptyChat";
import { EmptyMessage } from "./emptyMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatData } from "@/store/chatStore";

type MessageLayoutProps = {
  selectedChatId: string | null; 
  chatData?: ChatData;
  onSendMessage: (message: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  chatLoading?: boolean; // Add this prop
};

export function MessageLayout({
  selectedChatId,
  chatData,
  onSendMessage,
  onBack,
  showBackButton = false,
  chatLoading = false // Default to false
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
          
          {/* Show skeleton when loading, otherwise normal content */}
          {chatLoading ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {[1, 2, 3].map((item) => (
                <div 
                  key={item} 
                  className={`flex ${item % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                >
                  <Skeleton 
                    className={`rounded-xl p-4 ${
                      item % 2 === 0 ? 'ml-auto' : 'mr-auto'
                    }`}
                    style={{ width: `${Math.max(120, Math.random() * 200)}px`, height: '40px' }}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Show message list only if there are messages, otherwise show empty state */
            chatData.messages && chatData.messages.length > 0 ? (
              <MessageList messages={chatData.messages} />
            ) : (
              <EmptyMessage 
                name={chatData.name} 
                onSendMessage={onSendMessage} 
              />
            )
          )}
          
          <MessageInput onSendMessage={onSendMessage} />
        </>
      ) : (
        <EmptyChat />
      )}
    </div>
  );
}