"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/components/layout/sidebar";
import ChatList from "./chatList";
import { initialChats, ChatItem } from "@/data/chatData"; 
import { MessageLayout } from "./messageLayout";
import { cn } from "@/lib/utils";
import { ChatData } from "@/types/chat";
import { Skeleton } from "@/components/ui/skeleton"; 
 
interface ChatLayoutProps {
  initialChatId?: number | null;
}

export default function ChatLayout({ initialChatId = null }: ChatLayoutProps) {
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const { setMessageViewActive } = useSidebar();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Check if mobile view on mount and window resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);
  
  // Find selected chat based on initialChatId
  useEffect(() => {
    if (initialChatId) {
      const chat = initialChats.find(chat => chat.id === initialChatId);
      if (chat) {
        setSelectedChat(chat);
      }
    }
    setIsInitialized(true);
  }, [initialChatId]);
  
  // Update message view active state when selected chat changes
  useEffect(() => {
    if (isMobileView) {
      setMessageViewActive(selectedChat !== null);
    }
  }, [selectedChat, isMobileView, setMessageViewActive]);

  const handleSendMessage = (message: string) => {
    // Add message sending logic here
    console.log("Sending message:", message);
  };
  
  const handleSelectChat = (chat: ChatItem) => {
    router.push(`/v/chat/${chat.id}`);
    setSelectedChat(chat);
  };

  const handleBackButton = () => {
    router.push("/v/chat");
    setSelectedChat(null);
  };

  // Create chat data object from selected chat
  const chatData: ChatData | undefined = selectedChat ? {
    id: selectedChat.id,
    name: selectedChat.name,
    avatar: selectedChat.avatar || "", // Ensure avatar is never undefined
    online: selectedChat.online,
    messages: selectedChat.messages
  } : undefined;

  // Don't render until initialization is complete
  if (!isInitialized) {
    return (
      <div className="flex w-full h-full overflow-hidden">
        {/* Skeleton for chat list */}
        <div className="w-80 border-r bg-background flex-shrink-0 hidden md:block">
          {/* Skeleton header */}
          <div className="h-[73px] p-4 border-b">
            <Skeleton className="w-full h-9" />
          </div>
          
          {/* Skeleton chat items */}
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center p-4 gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Skeleton for message area */}
        <div className="flex-1 flex flex-col">
          {/* Skeleton header */}
          <div className="h-[73px] p-4 border-b flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          
          {/* Skeleton message area */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div 
                  key={item} 
                  className={`flex ${item % 2 === 0 ? 'justify-end' : ''}`}
                >
                  <Skeleton 
                    className={`rounded-lg p-4 ${
                      item % 2 === 0 ? 'ml-auto' : ''
                    }`}
                    style={{ width: `${Math.max(120, Math.random() * 200)}px`, height: '40px' }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Skeleton input area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-11 rounded-md" />
              <Skeleton className="h-11 w-11 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-[100dvh] overflow-hidden">
      {/* Mobile view container with improved transition */}
      {isMobileView ? (
        <div className="relative w-full h-[100dvh]">
          {/* Chat list */}
          <div 
            className={cn(
              "absolute inset-0 w-full h-[100dvh] z-20 bg-background transition-transform duration-300 ease-out",
              selectedChat !== null ? "-translate-x-full" : "translate-x-0"
            )}
          >
            <ChatList 
              onSelectChat={handleSelectChat}
              mobileView={isMobileView}
              selectedChatId={selectedChat?.id || null}
            />
          </div>
          
          {/* Chat window */}
          <div 
            className={cn(
              "absolute inset-0 w-full h-[100dvh] z-10 bg-background transition-transform duration-300 ease-out",
              selectedChat !== null ? "translate-x-0" : "translate-x-full"
            )}
          >
            <MessageLayout
              selectedChatId={selectedChat?.id || null}
              chatData={chatData}
              onSendMessage={handleSendMessage}
              onBack={handleBackButton}
              showBackButton={true}
            />
          </div>
        </div>
      ) : (
        // Desktop view - regular side-by-side layout
        <>
          <ChatList 
            onSelectChat={handleSelectChat}
            mobileView={false}
            selectedChatId={selectedChat?.id || null}
          />
          
          <MessageLayout
            selectedChatId={selectedChat?.id || null}
            chatData={chatData}
            onSendMessage={handleSendMessage}
            showBackButton={false}
          />
        </>
      )}
    </div>
  );
}