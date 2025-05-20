"use client";

import ChatLayout from "@/components/chat/chatLayout";
import { useEffect } from "react";
import { useChatStore } from '@/store/chatStore';

export default function ChatPage() {
  const { fetchChatList, chatList } = useChatStore();
  
  // Force fetch chat list when this page loads
  useEffect(() => {
    // If chatList is empty, fetch it
    if (chatList.length === 0) {
      console.log("Chat list empty, fetching...");
      fetchChatList();
    }
  }, [fetchChatList, chatList.length]);
  
  return <ChatLayout initialChatId={null} />;
}