"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Computer, Music } from "lucide-react";
import StreamLayout from "./streamLayout";

interface StreamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName?: string;
}

export function StreamDialog({ isOpen, onClose, chatId, chatName }: StreamDialogProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<"music" | null>(null);
  
  const handleScreenShareClick = () => {
    // Close dialog and navigate to full screen experience
    onClose();
    router.push(`/v/stream/${chatId}?mode=screen`);
  };
  
  const handleMusicSelect = () => {
    setSelectedOption("music");
  };
  
  const handleBack = () => {
    setSelectedOption(null);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setSelectedOption(null);
        onClose();
      }
    }}>
      {!selectedOption ? (
        <DialogContent 
          className="max-w-md"
          aria-describedby="stream-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Connect with {chatName || "User"}</DialogTitle>
            <DialogDescription id="stream-dialog-description">
              Choose between screen sharing and music sharing options
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button 
              variant="outline" 
              className="h-32 flex flex-col gap-2"
              onClick={handleScreenShareClick}
            >
              <Computer className="h-10 w-10" />
              <span>Stream</span>
              <span className="text-xs text-muted-foreground">Share your screen</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-32 flex flex-col gap-2"
              onClick={handleMusicSelect}
            >
              <Music className="h-10 w-10" />
              <span>Listen Together</span>
              <span className="text-xs text-muted-foreground">Share music</span>
            </Button>
          </div>
        </DialogContent>
      ) : (
        <DialogContent 
          className="max-w-[95vw] h-[90vh] p-0 bg-black border-zinc-800"
          aria-describedby="music-stream-dialog-description"
        >
          {/* Hidden description for music mode */}
          <span id="music-stream-dialog-description" className="sr-only">
            Music streaming interface with {chatName || "User"}
          </span>
          <div className="h-full">
            <StreamLayout 
              chatId={chatId} 
              mode="music" 
              onBack={handleBack}
              isDialog={true}
            />
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}