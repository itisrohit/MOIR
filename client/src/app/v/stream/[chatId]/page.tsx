"use client";

import { useSearchParams, useParams } from "next/navigation";
import StreamLayout from "@/components/stream/streamLayout";
import { toast } from "sonner";
import { useEffect } from "react";

export default function StreamPage() {
  const { chatId } = useParams();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "screen" | "music" || "screen";
  
  let actualChatId = chatId as string;
  
  if (actualChatId?.startsWith('chat-')) {
    actualChatId = actualChatId.replace('chat-', '');
  }
  
  useEffect(() => {
    // Request permissions early
    if (mode === "screen") {
      // We can't request screen share permission without user interaction,
      // but we can check camera permissions
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then(result => {
          if (result.state === 'denied') {
            toast.error("Camera access is blocked. Please check your browser settings.");
          }
        })
        .catch(err => console.error("Error checking permissions:", err));
    }
  }, [mode]);
  
  return <StreamLayout chatId={actualChatId} mode={mode} />;
}