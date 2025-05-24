import { create } from 'zustand';

// Types
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
}

export interface StreamState {
  // Screen share states
  isScreenSharing: boolean;
  screenStream: MediaStream | null;
  
  // Camera states
  isVideoOff: boolean;
  cameraStream: MediaStream | null;
  
  // Audio states
  isMuted: boolean;
  
  // Music states
  isMusicSharing: boolean;
  showMusicSearch: boolean;
  searchTerm: string;
  selectedMusic: MusicTrack | null;
  
  // UI states
  isFullscreenMode: boolean;
  
  // Call states
  callStatus: 'idle' | 'connecting' | 'ringing' | 'accepted' | 'rejected' | 'ended';
  remoteUserInfo: {
    id: string;
    name: string;
    avatar: string;
  } | null;
  
  // Mock data for music (would be replaced with API calls)
  musicSearchResults: MusicTrack[];
}

export interface StreamActions {
  // Screen actions
  setIsScreenSharing: (isScreenSharing: boolean) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  
  // Camera actions
  setIsVideoOff: (isVideoOff: boolean) => void;
  setCameraStream: (stream: MediaStream | null) => void;
  
  // Audio actions
  setIsMuted: (isMuted: boolean) => void;
  
  // Music actions
  setIsMusicSharing: (isMusicSharing: boolean) => void;
  setShowMusicSearch: (showMusicSearch: boolean) => void;
  setSearchTerm: (searchTerm: string) => void;
  setSelectedMusic: (music: MusicTrack | null) => void;
  
  // UI actions
  setIsFullscreenMode: (isFullscreenMode: boolean) => void;
  
  // Call actions
  setCallStatus: (status: StreamState['callStatus']) => void;
  setRemoteUserInfo: (userInfo: StreamState['remoteUserInfo']) => void;
}

export type StreamStore = StreamState & StreamActions;

// Create the store
export const useStreamStore = create<StreamStore>((set) => ({
  // Initial state
  isScreenSharing: false,
  screenStream: null,
  isVideoOff: true,
  cameraStream: null,
  isMuted: false,
  isMusicSharing: false,
  showMusicSearch: false,
  searchTerm: '',
  selectedMusic: null,
  isFullscreenMode: false,
  callStatus: 'idle',
  remoteUserInfo: null,
  
  // Mock data
  musicSearchResults: [
    { id: '1', title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20', cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
    { id: '2', title: 'Shape of You', artist: 'Ed Sheeran', duration: '3:53', cover: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
    { id: '3', title: 'Dance Monkey', artist: 'Tones and I', duration: '3:29', cover: 'https://i.scdn.co/image/ab67616d0000b273c6f7af36cfa803ec1419bcc3' },
    { id: '4', title: 'Someone You Loved', artist: 'Lewis Capaldi', duration: '3:02', cover: 'https://i.scdn.co/image/ab67616d0000b273fc2101e6889d6ce9025f85f2' },
    { id: '5', title: 'Bad Guy', artist: 'Billie Eilish', duration: '3:14', cover: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce' }
  ],
  
  // Actions
  setIsScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setScreenStream: (screenStream) => set({ screenStream }),
  setIsVideoOff: (isVideoOff) => set({ isVideoOff }),
  setCameraStream: (cameraStream) => set({ cameraStream }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setIsMusicSharing: (isMusicSharing) => set({ isMusicSharing }),
  setShowMusicSearch: (showMusicSearch) => set({ showMusicSearch }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedMusic: (selectedMusic) => set({ selectedMusic }),
  setIsFullscreenMode: (isFullscreenMode) => set({ isFullscreenMode }),
  setCallStatus: (callStatus) => set({ callStatus }),
  setRemoteUserInfo: (remoteUserInfo) => set({ remoteUserInfo }),
}));