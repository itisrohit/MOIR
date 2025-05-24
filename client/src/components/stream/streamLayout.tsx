"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Monitor, 
  MonitorOff, 
  Music, 
  Mic, 
  MicOff, 
  Square,
  Video,
  VideoOff,
  PhoneOff,
  Search,
  X,
  Play,
  Volume2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface StreamLayoutProps {
  chatId: string;
  mode?: "screen" | "music";
  onBack?: () => void;
  isDialog?: boolean;
}

// Mock music search results
const musicSearchResults = [
  { id: '1', title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20', cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
  { id: '2', title: 'Shape of You', artist: 'Ed Sheeran', duration: '3:53', cover: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
  { id: '3', title: 'Dance Monkey', artist: 'Tones and I', duration: '3:29', cover: 'https://i.scdn.co/image/ab67616d0000b273c6f7af36cfa803ec1419bcc3' },
  { id: '4', title: 'Someone You Loved', artist: 'Lewis Capaldi', duration: '3:02', cover: 'https://i.scdn.co/image/ab67616d0000b273fc2101e6889d6ce9025f85f2' },
  { id: '5', title: 'Bad Guy', artist: 'Billie Eilish', duration: '3:14', cover: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce' }
];

export default function StreamLayout({ 
  chatId, 
  mode,
  onBack,
  isDialog = false
}: StreamLayoutProps) {
  const router = useRouter();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMusicSharing, setIsMusicSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [isFullscreenMode, setIsFullscreenMode] = useState(mode === "screen");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { chatList } = useChatStore();
  const chat = chatList.find(c => c.id === chatId);

  const handleBack = () => {
    // Stop all streams before going back
    stopScreenShare();
    stopMusicShare();
    
    // Use dialog onBack if in dialog mode, otherwise router.back()
    if (isDialog && onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }
      
      setIsScreenSharing(true);
      setIsFullscreenMode(true);
      
      // Handle stream ending
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    
    setIsScreenSharing(false);
    if (mode === "screen") {
      setIsFullscreenMode(false);
    }
  };

  const startMusicShare = () => {
    setShowMusicSearch(true);
    // This would integrate with music streaming APIs
    // For now, we just toggle the state
  };

  const stopMusicShare = () => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.src = "";
    }
    setIsMusicSharing(false);
    setShowMusicSearch(false);
    setSelectedMusic(null);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
  };

  const toggleVideo = async () => {
    try {
      if (isVideoOff) {
        // Turn on camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        // Turn off camera
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
          localVideoRef.current.srcObject = null;
        }
      }
      
      setIsVideoOff(!isVideoOff);
    } catch (error) {
      console.error("Error toggling video:", error);
    }
  };

  const handleSearchMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const selectMusic = (music: any) => {
    setSelectedMusic(music);
    setIsMusicSharing(true);
    setShowMusicSearch(false);
  };

  // Auto-start the feature based on mode
  useEffect(() => {
    if (mode === "screen" && !isScreenSharing) {
      startScreenShare();
    } else if (mode === "music" && !isMusicSharing) {
      startMusicShare();
    }
    
    return () => {
      // Cleanup streams on unmount
      stopScreenShare();
      stopMusicShare();
    };
  }, [mode]);

  return (
    <div className={`flex flex-col ${isDialog ? 'h-full' : 'h-screen'} bg-black text-white`}>
      {/* Google Meet style header - small and minimal */}
      <div className="flex items-center justify-between p-2 bg-black/80 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            aria-label="Back"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-sm font-medium">
            {mode === "screen" ? "Screen Share" : "Music Together"} with {chat?.name || "User"}
          </h1>
        </div>
      </div>

      {/* Main Video Area */}
      {isFullscreenMode && (
        <div className="relative flex-1 overflow-hidden bg-black">
          {/* Main video feed */}
          <video
            ref={screenVideoRef}
            autoPlay
            className="w-full h-full object-contain"
          />

          {/* Participant videos (small thumbnail) */}
          <div className="absolute bottom-20 right-4 w-[180px] h-[101px]">
            {isVideoOff ? (
              <div className="w-full h-full bg-zinc-800 rounded-lg flex items-center justify-center">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{chat?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                className="w-full h-full object-cover rounded-lg border border-white/20"
              />
            )}
          </div>
        </div>
      )}

      {/* Music Search and Player */}
      {mode === "music" && (
        <div className="flex-1 p-4 bg-zinc-900">
          {showMusicSearch ? (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center mb-4">
                <Input 
                  type="search" 
                  placeholder="Search for music..." 
                  className="flex-1 bg-zinc-800 border-zinc-700 text-white"
                  value={searchTerm}
                  onChange={handleSearchMusic}
                />
                <Button 
                  variant="ghost"
                  className="ml-2 text-white"
                  onClick={() => setShowMusicSearch(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-2 mt-4">
                {musicSearchResults
                  .filter(track => 
                    searchTerm === "" || 
                    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    track.artist.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(track => (
                    <div 
                      key={track.id} 
                      className="flex items-center p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
                      onClick={() => selectMusic(track)}
                    >
                      <img 
                        src={track.cover} 
                        alt={track.title} 
                        className="w-12 h-12 rounded mr-3" 
                      />
                      <div className="flex-1">
                        <div className="font-medium">{track.title}</div>
                        <div className="text-sm text-gray-400">{track.artist}</div>
                      </div>
                      <div className="text-gray-400 text-sm">{track.duration}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              {selectedMusic ? (
                <div className="max-w-md w-full p-6 bg-zinc-800 rounded-xl shadow-lg">
                  <div className="flex flex-col items-center">
                    <img 
                      src={selectedMusic.cover} 
                      alt={selectedMusic.title} 
                      className="w-48 h-48 rounded-lg shadow-lg mb-4" 
                    />
                    <h3 className="text-xl font-bold mt-2">{selectedMusic.title}</h3>
                    <p className="text-gray-400">{selectedMusic.artist}</p>
                    
                    <div className="w-full mt-6">
                      <div className="h-1 w-full bg-gray-600 rounded-full overflow-hidden">
                        <div className="h-1 bg-red-500 w-1/3" />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>1:10</span>
                        <span>{selectedMusic.duration}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center mt-4 space-x-4">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="rounded-full h-10 w-10 text-white border-gray-600"
                      >
                        <Play className="h-5 w-5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="rounded-full h-10 w-10 text-white border-gray-600"
                      >
                        <Volume2 className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <p className="mt-6 text-sm text-center text-gray-400">
                      Playing in sync with {chat?.name}
                    </p>
                  </div>
                  
                  <audio ref={musicRef} className="hidden" autoPlay loop>
                    <source src={`/api/music/${selectedMusic.id}`} type="audio/mpeg" />
                  </audio>
                </div>
              ) : (
                <div className="text-center">
                  <Music className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-medium mb-2">Start Listening Together</h3>
                  <p className="text-gray-400 mb-6">Search for music to play with {chat?.name}</p>
                  <Button onClick={startMusicShare}>
                    <Search className="h-4 w-4 mr-2" />
                    Search Music
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Controls toolbar at the bottom */}
      <div className="flex items-center justify-center gap-4 py-4 px-4 bg-black border-t border-white/10">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full h-12 w-12 ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full h-12 w-12 ${isVideoOff ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>
        
        {mode === "screen" ? (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full h-12 w-12 ${isScreenSharing ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full h-12 w-12 ${isMusicSharing ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            onClick={isMusicSharing ? stopMusicShare : startMusicShare}
          >
            {isMusicSharing ? <Square className="h-5 w-5" /> : <Music className="h-5 w-5" />}
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-12 w-12 bg-red-600 hover:bg-red-700"
          onClick={handleBack}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}