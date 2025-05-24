"use client";

import { Button } from "@/components/ui/button";
import { 
  Music, 
  Video,
  VideoOff,
  PhoneOff,
  Search,
  X,
  Play,
  Volume2,
  Mic,
  MicOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStream } from "@/hooks/useStream";
import Image from "next/image";
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from "lucide-react";

interface StreamLayoutProps {
  chatId: string;
  mode?: "screen" | "music";
  onBack?: () => void;
  isDialog?: boolean;
}

export default function StreamLayout({ 
  chatId, 
  mode = "screen",
  onBack,
  isDialog = false
}: StreamLayoutProps) {
  // Get current user
  const { user: currentUser } = useAuthStore();
  
  const {
    // State
    chat,
    isScreenSharing,
    isVideoOff,
    isMuted,
    showMusicSearch,
    searchTerm,
    selectedMusic,
    isFullscreenMode,
    musicSearchResults,
    callStatus,
    remoteUserInfo,
    
    // Refs
    screenVideoRef,
    localVideoRef,
    musicRef,
    
    // Actions
    startScreenShare,
    toggleMute,
    toggleVideo,
    handleSearchMusic,
    selectMusic,
    handleBack,
    startMusicShare,
    setShowMusicSearch,
    acceptCall,
    rejectCall,
    endCall,
  } = useStream(chatId, mode, isDialog, onBack);  // Pass onBack here

  // Render different UI based on call status
  const renderCallStatusUI = () => {
    switch (callStatus) {
      case 'connecting':
      case 'ringing':
        return (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
            <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-xl bg-zinc-900">
              {/* Your user card */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative avatar-container">
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarFallback>{currentUser?.name?.charAt(0) || '?'}</AvatarFallback>
                    {currentUser?.image && (
                      <Image 
                        src={currentUser.image} 
                        alt={currentUser.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full status-indicator">
                    <Video className="h-4 w-4 text-white" />
                  </div>
                </div>
                <span className="text-sm text-white/80">You</span>
              </div>
              
              {/* Connection animation */}
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-primary rounded-full animate-ping"></div>
                <div className="h-2 w-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '300ms' }}></div>
                <div className="h-2 w-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '600ms' }}></div>
              </div>
              
              {/* Remote user card */}
              {remoteUserInfo && (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-zinc-700">
                      <AvatarFallback>{remoteUserInfo.name?.charAt(0) || '?'}</AvatarFallback>
                      {remoteUserInfo.avatar && (
                        <Image 
                          src={remoteUserInfo.avatar} 
                          alt={remoteUserInfo.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </Avatar>
                    {callStatus === 'ringing' && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-500 p-1 rounded-full animate-pulse">
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-white/80">{remoteUserInfo.name}</span>
                </div>
              )}
            </div>
            
            {/* Status text */}
            <div className="absolute bottom-1/4 left-0 right-0 text-center">
              <p className="text-white/70">
                {callStatus === 'connecting' ? 'Connecting...' : 'Ringing...'}
              </p>
              <Button
                onClick={endCall}
                variant="destructive"
                className="mt-4"
              >
                Hang Up
              </Button>
            </div>
          </div>
        );
      
      case 'rejected':
        return (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
            <X className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-xl text-white/70">Call Rejected</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col ${isDialog ? 'h-full' : 'h-screen w-full'} bg-black text-white relative`}>
      {/* Call status overlay */}
      {renderCallStatusUI()}
      
      {/* Main Video Area */}
      {isFullscreenMode && mode === "screen" && (
        <div className="relative flex-1 overflow-hidden bg-black">
          {isScreenSharing ? (
            <video
              key="screen-video"
              ref={screenVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain bg-zinc-900"
              style={{ display: isScreenSharing ? 'block' : 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg text-white/60 mb-3">Screen sharing stopped</p>
                <Button 
                  onClick={startScreenShare}
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  Start sharing again
                </Button>
              </div>
            </div>
          )}

          <div className="absolute bottom-20 right-4 w-[180px] h-[101px]">
            {isVideoOff ? (
              <div className="w-full h-full bg-zinc-800 rounded-lg flex items-center justify-center">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{chat?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <video 
                key="camera-video"
                ref={localVideoRef} 
                autoPlay
                playsInline
                muted 
                className="w-full h-full object-cover rounded-lg border border-white/20"
              />
            )}
          </div>
        </div>
      )}

      {/* Music Player */}
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
                      <div className="relative w-12 h-12 rounded mr-3 overflow-hidden">
                        <Image 
                          src={track.cover} 
                          alt={track.title} 
                          width={48}
                          height={48}
                          className="rounded object-cover"
                          onError={(e) => {
                            // Fallback to a placeholder if image fails to load
                            e.currentTarget.src = '/images/music-placeholder.jpg';
                          }}
                        />
                      </div>
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
                    <div className="relative w-48 h-48 mb-4">
                      <Image 
                        src={selectedMusic.cover} 
                        alt={selectedMusic.title} 
                        width={192}
                        height={192}
                        className="rounded-lg shadow-lg object-cover"
                      />
                    </div>
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
        {/* Mic button - keep for both modes */}
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full h-12 w-12 ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        {/* Screen mode controls */}
        {mode === "screen" && (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full h-12 w-12 ${isVideoOff ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        )}
        
        {/* Music mode controls */}
        {mode === "music" && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12 bg-zinc-800 hover:bg-zinc-700"
            onClick={startMusicShare}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
        
        {/* End call button */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-12 w-12 bg-red-600 hover:bg-red-700"
          onClick={handleBack}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* Incoming call dialog */}
      {callStatus === 'ringing' && !isScreenSharing && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30">
          <div className="p-6 bg-zinc-900 rounded-xl max-w-md w-full">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarFallback>{remoteUserInfo?.name?.charAt(0) || '?'}</AvatarFallback>
                {remoteUserInfo?.avatar && (
                  <Image 
                    src={remoteUserInfo.avatar} 
                    alt={remoteUserInfo.name}
                    fill
                    className="object-cover"
                  />
                )}
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{remoteUserInfo?.name}</h3>
                <p className="text-white/60">Incoming video call</p>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button 
                variant="destructive" 
                className="rounded-full h-12 w-12 p-0"
                onClick={rejectCall}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700 rounded-full h-12 w-12 p-0"
                onClick={acceptCall}
              >
                <Video className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls - only show when call is accepted */}
      {callStatus === 'accepted' && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
          <Button 
            variant="destructive" 
            size="icon" 
            className="rounded-full h-12 w-12"
            onClick={endCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
