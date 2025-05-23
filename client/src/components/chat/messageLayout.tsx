import { ChatHeader } from "./chatHeader";
import { MessageList } from "./messageList";
import { MessageInput } from "./messageInput";
import { EmptyChat } from "./emptyChat";
import { EmptyMessage } from "./emptyMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatData, useChatStore } from "@/store/chatStore";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useRef } from "react"; // Add useRef

type MessageLayoutProps = {
  selectedChatId: string | null; 
  chatData?: ChatData;
  onSendMessage: (message: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  chatLoading?: boolean;
};

export function MessageLayout({
  selectedChatId,
  chatData,
  onSendMessage,
  onBack,
  showBackButton = false,
  chatLoading = false
}: MessageLayoutProps) {
  const { typingUsers, unreadCounts } = useChatStore(); // Add unreadCounts
  const { markMessagesAsRead } = useSocket();
  
  // Add ref to track if we've already marked messages as read
  const hasMarkedAsReadRef = useRef<Record<string, boolean>>({});

  const isTyping = selectedChatId && typingUsers[selectedChatId] ? 
    Object.values(typingUsers[selectedChatId]).some(status => status) : false;

  // Fix the infinite loop by adding a condition to prevent repeated calls
  useEffect(() => {
    if (
      selectedChatId && 
      chatData && 
      !chatLoading && 
      unreadCounts[selectedChatId] > 0 && 
      !hasMarkedAsReadRef.current[selectedChatId]
    ) {
      // Mark as already processed to prevent repeated calls
      hasMarkedAsReadRef.current[selectedChatId] = true;
      markMessagesAsRead(selectedChatId);
    }
  }, [selectedChatId, chatLoading, markMessagesAsRead, chatData, unreadCounts]);

  // Reset the ref when selectedChatId changes
  useEffect(() => {
    if (selectedChatId) {
      hasMarkedAsReadRef.current = {};
    }
  }, [selectedChatId]);

  // Add a new effect to handle message changes
  useEffect(() => {
    // When messages array changes AND we have unread messages, mark them as read
    if (
      selectedChatId && 
      chatData?.messages && // Check that messages exists first
      chatData.messages.length > 0 && 
      unreadCounts[selectedChatId] > 0
    ) {
      // Use a small delay to prevent excessive socket events
      const timer = setTimeout(() => {
        console.log('Messages changed, marking as read:', selectedChatId);
        markMessagesAsRead(selectedChatId);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [chatData?.messages, selectedChatId, unreadCounts, markMessagesAsRead]);

  // Keep the existing read status effect with a modification
  useEffect(() => {
    if (
      selectedChatId && 
      chatData && 
      !chatLoading && 
      unreadCounts[selectedChatId] > 0
    ) {
      // Remove the hasMarkedAsReadRef check to ensure it runs whenever conditions are met
      console.log('Initial read marking for chat:', selectedChatId);
      markMessagesAsRead(selectedChatId);
    }
  }, [selectedChatId, chatLoading, markMessagesAsRead, chatData, unreadCounts]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Only render the empty chat component if we're NOT in mobile view or we DO have a selected chat */}
      {(selectedChatId !== null || !showBackButton) && (
        <>
          {selectedChatId !== null && chatData ? (
            <>
              <ChatHeader 
                name={chatData.name} 
                avatar={chatData.avatar || ""} 
                online={chatData.online}
                onBack={onBack}
                showBackButton={showBackButton}
              />
              
              {/* Enhanced loading logic to prevent EmptyMessage flash */}
              {chatLoading ? (
                // Show skeleton while loading
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
                /* Only show EmptyMessage if we're CERTAIN there are no messages */
                chatData.messages && chatData.messages.length > 0 ? (
                  <MessageList messages={chatData.messages} />
                ) : (
                  chatData.lastMessage ? (
                    // If lastMessage exists but messages array is empty, show skeleton instead of EmptyMessage
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
                    // Only show EmptyMessage if there's definitely no lastMessage
                    <EmptyMessage 
                      name={chatData.name} 
                      onSendMessage={onSendMessage} 
                    />
                  )
                )
              )}
              
              {isTyping && (
                <div className="px-4 py-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span>{chatData.name} is typing...</span>
                  </div>
                </div>
              )}

              <MessageInput 
                onSendMessage={onSendMessage} 
                conversationId={selectedChatId || ""}
              />
            </>
          ) : (
            <EmptyChat />
          )}
        </>
      )}
    </div>
  );
}