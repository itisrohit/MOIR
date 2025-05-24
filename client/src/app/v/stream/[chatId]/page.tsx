"use client";

import { useParams } from "next/navigation";
import StreamLayout from "@/components/stream/streamLayout";

export default function StreamPage() {
  const { chatId } = useParams();
  
  // Handle both /v/stream/chat-682c7efd19ef1fbe7cea735d and /v/stream/682c7efd19ef1fbe7cea735d
  let actualChatId = chatId as string;
  
  if (actualChatId?.startsWith('chat-')) {
    actualChatId = actualChatId.replace('chat-', '');
  }
  
  return <StreamLayout chatId={actualChatId} />;
}