"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [selectedOption, setSelectedOption] = useState<"screen" | "music" | null>(null);
  
  const handleOptionSelect = (option: "screen" | "music") => {
    setSelectedOption(option);
  };
  
  const handleBack = () => {
    setSelectedOption(null);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Reset selected option when dialog is closed
        setSelectedOption(null);
        onClose();
      }
    }}>
      <DialogContent 
        className={selectedOption 
          ? "max-w-[95vw] h-[90vh] p-0 bg-black border-zinc-800" 
          : "max-w-md"}
      >
        {!selectedOption ? (
          <>
            <DialogHeader>
              <DialogTitle>Stream with {chatName || "User"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button 
                variant="outline" 
                className="h-32 flex flex-col gap-2"
                onClick={() => handleOptionSelect("screen")}
              >
                <Computer className="h-10 w-10" />
                <span>Screen Share</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 flex flex-col gap-2"
                onClick={() => handleOptionSelect("music")}
              >
                <Music className="h-10 w-10" />
                <span>Music Together</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="h-full">
            <StreamLayout 
              chatId={chatId} 
              mode={selectedOption} 
              onBack={handleBack}
              isDialog={true}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}