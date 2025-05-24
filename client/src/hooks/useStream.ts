import { useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useStreamStore, MusicTrack } from '@/store/streamStore';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from './useSocket';

export function useStream(
  chatId: string, 
  mode: 'screen' | 'music' = 'screen', 
  isDialog: boolean = false,
  onBack?: () => void  // Add onBack parameter here
) {
  // Refs for DOM elements
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  
  const router = useRouter();
  
  // Get chat info
  const { chatList } = useChatStore();
  const chat = chatList.find(c => c.id === chatId);
  
  // Get stream state from store
  const {
    isScreenSharing, setIsScreenSharing,
    screenStream, setScreenStream,
    isVideoOff, setIsVideoOff,
    cameraStream, setCameraStream,
    isMuted, setIsMuted,
    isMusicSharing, setIsMusicSharing,
    showMusicSearch, setShowMusicSearch,
    searchTerm, setSearchTerm,
    selectedMusic, setSelectedMusic,
    isFullscreenMode, setIsFullscreenMode,
    musicSearchResults,
    callStatus, setCallStatus,
    remoteUserInfo, setRemoteUserInfo,
  } = useStreamStore();

  const { socket, isConnected } = useSocket();
  const { user: currentUser } = useAuthStore();
  
  // Clean up all streams
  const cleanupAllStreams = useCallback(() => {
    // Clean up screen sharing
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    
    // Clean up camera
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    // Clean up audio
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.src = "";
    }
  }, [screenStream, cameraStream, setScreenStream, setCameraStream]);

  // To avoid circular dependencies between startScreenShare and stopScreenShare,
  // initialize with non-null values
  const functionRefs = useRef({
    stopScreenShare: (() => {}) as (() => void),
    startScreenShare: (async () => {}) as (() => Promise<void>),
    cleanupAllStreams: (() => {}) as (() => void)
  });

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      // Check if already sharing first
      if (isScreenSharing && screenStream?.active) {
        console.log("Already sharing screen, skipping start");
        return;
      }
      
      console.log("Starting screen share...");
      
      // First set UI state to indicate we're trying to share
      setIsFullscreenMode(true);
      
      // Clean up previous stream if exists
      if (screenStream) {
        console.log("Cleaning up previous screen stream");
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
        
        // Small delay to ensure previous stream is fully cleaned up
        await new Promise(r => setTimeout(r, 100));
      }
      
      console.log("Requesting display media...");
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      console.log("Screen stream obtained:", stream);
      
      // Store the stream reference
      setScreenStream(stream);
      setIsScreenSharing(true);
      
      // Handle stream ending using the stable reference
      stream.getVideoTracks()[0].onended = () => {
        console.log("Screen sharing ended by browser");
        functionRefs.current.stopScreenShare();
      };
    } catch (error) {
      console.error("Error in startScreenShare:", error);
      if ((error as Error).name === 'NotAllowedError') {
        toast.error("Screen sharing permission denied");
      } else {
        toast.error("Failed to start screen sharing");
      }
      setIsScreenSharing(false);
    }
  }, [screenStream, setScreenStream, setIsScreenSharing, setIsFullscreenMode, isScreenSharing]); // Added isScreenSharing

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    // Only stop screen share tracks, not camera
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    
    setIsScreenSharing(false);
    
    // Always keep fullscreen mode active when in screen mode to avoid UI jumps
    if (mode !== "screen") {
      setIsFullscreenMode(false);
    }
  }, [screenStream, mode, setScreenStream, setIsScreenSharing, setIsFullscreenMode]);

  // Start music sharing
  const startMusicShare = useCallback(() => {
    setShowMusicSearch(true);
  }, [setShowMusicSearch]);

  // Stop music sharing
  const stopMusicShare = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.src = "";
    }
    setIsMusicSharing(false);
    setShowMusicSearch(false);
    setSelectedMusic(null);
  }, [setIsMusicSharing, setShowMusicSearch, setSelectedMusic]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    
    // Mute/unmute both screen and camera audio
    if (screenStream) {
      screenStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Note: we use current state before update
      });
    }
    
    if (cameraStream) {
      cameraStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
  }, [isMuted, screenStream, cameraStream, setIsMuted]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      if (isVideoOff) {
        console.log("Turning camera on (without affecting screen share)");
        
        // Clean up existing camera stream if any
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
        
        // Get camera stream with lower resolution for thumbnail
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 180 },
            frameRate: { max: 15 }
          },
          audio: false // Don't capture audio with camera to avoid conflicts
        });
        
        console.log("Camera stream obtained:", stream);
        
        // Store new stream reference
        setCameraStream(stream);
        
        // Update state
        setIsVideoOff(false);
      } else {
        console.log("Turning camera off");
        
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        
        setIsVideoOff(true);
      }
    } catch (error) {
      console.error("Error in toggleVideo:", error);
      toast.error("Camera access failed. Please check your permissions.");
    }
  }, [isVideoOff, cameraStream, setCameraStream, setIsVideoOff]);

  // Handle search input
  const handleSearchMusic = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  // Select music
  const selectMusic = useCallback((music: MusicTrack) => {
    setSelectedMusic(music);
    setIsMusicSharing(true);
    setShowMusicSearch(false);
  }, [setSelectedMusic, setIsMusicSharing, setShowMusicSearch]);

  // Handle navigation back
  const handleBack = useCallback(() => {
    // Always clean up all media streams before navigating away
    cleanupAllStreams();
    
    if (isDialog && onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [cleanupAllStreams, isDialog, router, onBack]); // Add onBack to dependencies

  // Define types for call event data
  interface CallEventData {
    callerId: string;
    callerName: string;
    callerAvatar: string;
    conversationId: string;
    receiverId?: string;
  }

  // Initiate a call
  const initiateCall = useCallback(async () => {
    if (!chat || !currentUser || !isConnected) return;
    
    // Set call status to connecting
    setCallStatus('connecting');
    
    // Set remote user info from chat
    setRemoteUserInfo({
      id: chat.otherUserId,
      name: chat.name,
      avatar: chat.avatar
    });
    
    // Emit socket event to start call
    socket?.emit('call:initiate', {
      conversationId: chatId,
      callerId: currentUser._id,
      callerName: currentUser.name,
      callerAvatar: currentUser.image,
      receiverId: chat.otherUserId
    });
    
    // Switch to ringing after emitting
    setCallStatus('ringing');
    
    // Start screen share
    await startScreenShare();
  }, [chatId, chat, currentUser, isConnected, socket, setCallStatus, setRemoteUserInfo, startScreenShare]);

  // Accept an incoming call
  const acceptCall = useCallback(() => {
    if (!socket || !remoteUserInfo) return;
    
    socket.emit('call:accept', { 
      callerId: remoteUserInfo.id,
      conversationId: chatId
    });
    
    setCallStatus('accepted');
  }, [socket, remoteUserInfo, chatId, setCallStatus]);

  // Reject an incoming call
  const rejectCall = useCallback(() => {
    if (!socket || !remoteUserInfo) return;
    
    socket.emit('call:reject', {
      callerId: remoteUserInfo.id,
      conversationId: chatId
    });
    
    setCallStatus('idle');
    setRemoteUserInfo(null);
    
    // Return to previous screen
    if (onBack) onBack();
  }, [socket, remoteUserInfo, chatId, setCallStatus, setRemoteUserInfo, onBack]);

  // End an active call
  const endCall = useCallback(() => {
    if (!socket || !remoteUserInfo) return;
    
    socket.emit('call:end', {
      receiverId: remoteUserInfo.id,
      conversationId: chatId
    });
    
    setCallStatus('ended');
    
    // Clean up streams
    cleanupAllStreams();
    
    // Reset state after a delay
    setTimeout(() => {
      setCallStatus('idle');
      setRemoteUserInfo(null);
      
      // Return to previous screen
      if (onBack) onBack();
    }, 1000);
  }, [socket, remoteUserInfo, chatId, setCallStatus, setRemoteUserInfo, cleanupAllStreams, onBack]);

  // At the top of your hook, add these refs
  const isInitialMount = useRef(true);
  const latestState = useRef({
    isScreenSharing,
    mode
  });

  // Update refs when values change
  useEffect(() => {
    latestState.current = {
      isScreenSharing,
      mode
    };
  }, [isScreenSharing, mode]);

  // Then modify your initialization effect
  useEffect(() => {
    // Only run the initialization logic on first mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      const shouldInit = !latestState.current.isScreenSharing && 
                        latestState.current.mode === "screen";
      
      console.log(`Stream component initializing with mode: ${latestState.current.mode}`);
      
      let isMounted = true;
      
      if (shouldInit) {
        // Capture the current startScreenShare function in a local variable
        // so we can safely use it in the timeout callback
        const initializeScreenShare = functionRefs.current.startScreenShare;
        
        const initTimeout = setTimeout(() => {
          if (isMounted) {
            console.log("Delayed screen share initialization starting");
            initializeScreenShare();
          }
        }, 500);
        
        return () => {
          clearTimeout(initTimeout);
          isMounted = false;
        };
      }
    }
  }, []); // Keep empty to ensure it only runs once

  // Separate cleanup effect that only runs on component unmount
  useEffect(() => {
    // Set fullscreen mode immediately
    if (mode === "screen") setIsFullscreenMode(true);
    
    // Store original values in a ref to prevent unnecessary re-renders
    const cleanup = functionRefs.current.cleanupAllStreams;
    
    // Capture current ref values at the time this effect runs
    const currentMusicRef = musicRef.current;
    
    return () => {
      console.log("FINAL CLEANUP - Component fully unmounting");
      // Add null check before invoking cleanup
      if (cleanup) {
        cleanup();
      } else {
        // Fallback cleanup if ref isn't set
        console.log("Using fallback cleanup since ref wasn't initialized");
        
        // Inline cleanup logic as fallback
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
        }
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
        }
        
        // Use the captured ref value instead of accessing ref.current directly
        if (currentMusicRef) {
          currentMusicRef.pause();
          currentMusicRef.src = "";
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep empty to ensure it only runs on mount/unmount

  // Improved effect for attaching screen stream with retry logic
  useEffect(() => {
    if (!isScreenSharing || !screenStream || !screenVideoRef.current) return;
    
    console.log("Attaching screen stream to video element");
    
    // Create variables for retry logic
    let playAttempts = 0;
    const maxAttempts = 3;
    
    const attachAndPlay = () => {
      if (!screenVideoRef.current || !screenStream) return;
      
      try {
        // Set srcObject only if it's different to prevent unnecessary reloads
        if (screenVideoRef.current.srcObject !== screenStream) {
          screenVideoRef.current.srcObject = screenStream;
        }
        
        // Add a small delay before playing to ensure DOM stability
        setTimeout(() => {
          if (!screenVideoRef.current) return;
          
          playAttempts++;
          console.log(`Attempting to play screen video (attempt ${playAttempts})`);
          
          screenVideoRef.current.play()
            .then(() => console.log("Screen video playing successfully"))
            .catch(err => {
              console.error("Error playing screen video:", err);
              
              if (playAttempts < maxAttempts) {
                console.log(`Retrying video play in 500ms (attempt ${playAttempts + 1})`);
                setTimeout(attachAndPlay, 500);
              } else {
                toast.error("Could not play screen video after multiple attempts. Try refreshing.");
              }
            });
        }, 200);
      } catch (err) {
        console.error("Error in attachAndPlay:", err);
      }
    };
    
    attachAndPlay();
    
    // Add event listeners for better stream monitoring
    const handleVisibilityChange = () => {
      if (!document.hidden && screenVideoRef.current && screenVideoRef.current.paused) {
        console.log("Tab became visible, checking if video needs to be played");
        screenVideoRef.current.play().catch(err => console.error("Error playing after visibility change:", err));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScreenSharing, screenStream]);

  // Effect for attaching camera stream to video element
  useEffect(() => {
    if (!isVideoOff && cameraStream && localVideoRef.current) {
      console.log("Attaching camera stream to video element after state update");
      localVideoRef.current.srcObject = cameraStream;
      
      localVideoRef.current.play()
        .then(() => console.log("Camera video playing"))
        .catch(err => {
          console.error("Error playing camera video:", err);
        });
    }
  }, [isVideoOff, cameraStream]);

  // Socket event handlers for calls
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Incoming call handler
    const handleIncomingCall = (data: CallEventData) => {
      setRemoteUserInfo({
        id: data.callerId,
        name: data.callerName,
        avatar: data.callerAvatar
      });
      setCallStatus('ringing');
      
      // Auto-accept if already in the chat with this user
      if (chatId === data.conversationId && mode === 'screen') {
        acceptCall();
      }
    };
    
    // Call accepted handler
    const handleCallAccepted = () => {
      setCallStatus('accepted');
    };
    
    // Call rejected handler
    const handleCallRejected = () => {
      setCallStatus('rejected');
      toast.error('Call was rejected');
      
      // Reset state after a delay
      setTimeout(() => {
        setCallStatus('idle');
        setRemoteUserInfo(null);
        
        // Navigate back if in dialog
        if (isDialog && onBack) onBack();
      }, 2000);
    };
    
    // Call ended handler
    const handleCallEnded = () => {
      setCallStatus('ended');
      toast.info('Call ended');
      
      // Clean up streams
      cleanupAllStreams();
      
      // Reset state after a delay
      setTimeout(() => {
        setCallStatus('idle');
        setRemoteUserInfo(null);
        
        // Navigate back if in dialog
        if (isDialog && onBack) onBack();
      }, 1000);
    };
    
    // Register socket event listeners
    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    
    return () => {
      // Clean up socket event listeners
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
    };
  }, [
    socket, 
    isConnected, 
    chatId, 
    mode, 
    acceptCall, 
    cleanupAllStreams, 
    isDialog, 
    onBack,
    setCallStatus, 
    setRemoteUserInfo
  ]);
  
  // Start call on screen share launch
  useEffect(() => {
    if (mode === 'screen' && !isScreenSharing && callStatus === 'idle') {
      initiateCall();
    }
  }, [mode, isScreenSharing, callStatus, initiateCall]);

  // Store the latest versions in our ref after declarations
  useEffect(() => {
    functionRefs.current.stopScreenShare = stopScreenShare;
    functionRefs.current.startScreenShare = startScreenShare;
    functionRefs.current.cleanupAllStreams = cleanupAllStreams;
  }, [stopScreenShare, startScreenShare, cleanupAllStreams]);

  return {
    // State
    chat,
    mode,
    isDialog,
    isScreenSharing,
    isVideoOff,
    isMuted,
    isMusicSharing,
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
    stopScreenShare,
    startMusicShare,
    stopMusicShare,
    toggleMute,
    toggleVideo,
    handleSearchMusic,
    selectMusic,
    handleBack,
    setShowMusicSearch,
    initiateCall, 
    acceptCall,
    rejectCall,
    endCall,
  };
}

export default useStream;
