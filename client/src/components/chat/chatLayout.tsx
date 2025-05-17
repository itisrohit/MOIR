"use client";

import { useState, useEffect } from "react";
import ChatList from "./chatList";
import { ChatHeader } from "./chatHeader";
import { MessageList } from "./messageList";
import { MessageInput } from "./messageInput";
import { EmptyChat } from "./emptyChat";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  text: string;
  sender: 'me' | 'them';
  time: string;
};

type ChatData = {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
  messages: Message[];
};

export default function ChatLayout() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  
  // Check if mobile view on mount and window resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768); // 768px is Tailwind's md breakpoint
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);
  
  // Sample chat data
  const chatData: ChatData = {
    id: 1,
    name: "Alex Johnson",
    avatar: "https://github.com/shadcn.png",
    online: true,
    messages: [
      { id: 1, text: "Hey there! How's it going?", sender: "them", time: "2:30 PM" },
      { id: 2, text: "I'm doing well, thanks! Just working on the project.", sender: "me", time: "2:31 PM" },
      { id: 3, text: "Cool! I wanted to ask about the deadline for the next milestone.", sender: "them", time: "2:32 PM" },
      { id: 4, text: "I think we have until next Friday, but let me check my notes and get back to you.", sender: "me", time: "2:33 PM" },
      { id: 5, text: "I'll send you the files tonight", sender: "them", time: "2:34 PM" },
    ]
  };
  
  const handleSendMessage = (message: string) => {
    // Add message sending logic here
    console.log("Sending message:", message);
  };

  const handleBackButton = () => {
    setSelectedChatId(null);
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Mobile view container with improved transition */}
      {isMobileView ? (
        <div className="relative w-full h-full">
          {/* Chat list - absolute positioned with transform for smooth animation */}
          <div 
            className={cn(
              "absolute inset-0 w-full h-full z-20 bg-background transition-transform duration-300 ease-out",
              selectedChatId !== null ? "-translate-x-full" : "translate-x-0"
            )}
          >
            <ChatList 
              onSelectChat={setSelectedChatId} 
              mobileView={isMobileView}
              selectedChatId={selectedChatId}
            />
          </div>
          
          {/* Chat window - absolute positioned with transform for smooth animation */}
          <div 
            className={cn(
              "absolute inset-0 w-full h-full z-10 bg-background transition-transform duration-300 ease-out",
              selectedChatId !== null ? "translate-x-0" : "translate-x-full"
            )}
          >
            {selectedChatId !== null ? (
              <>
                <ChatHeader 
                  name={chatData.name} 
                  avatar={chatData.avatar} 
                  online={chatData.online}
                  onBack={handleBackButton}
                  showBackButton={true}
                />
                <MessageList messages={chatData.messages} />
                <MessageInput onSendMessage={handleSendMessage} />
              </>
            ) : (
              <EmptyChat />
            )}
          </div>
        </div>
      ) : (
        // Desktop view - regular side-by-side layout
        <>
          <ChatList 
            onSelectChat={setSelectedChatId} 
            mobileView={false}
            selectedChatId={selectedChatId}
          />
          
          <div className="flex-1 flex flex-col h-full">
            {selectedChatId !== null ? (
              <>
                <ChatHeader 
                  name={chatData.name} 
                  avatar={chatData.avatar} 
                  online={chatData.online}
                  showBackButton={false}
                />
                <MessageList messages={chatData.messages} />
                <MessageInput onSendMessage={handleSendMessage} />
              </>
            ) : (
              <EmptyChat />
            )}
          </div>
        </>
      )}
    </div>
  );
}