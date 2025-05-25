import { useEffect, useState, useCallback, useRef } from 'react';
import { useFriendStore } from '@/store/friendStore';

// Global initialization state for persisting across remounts
const GLOBAL_INITIALIZED = { value: false };

export function useFriend() {
  const { 
    friends,
    incomingRequests, 
    outgoingRequests,
    acceptances,
    unreadCounts,
    error,
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest,
    respondToFriendRequest,
    markAllAsRead,
  } = useFriendStore();
  
  
  // Use the global initialization state
  const hasInitializedRef = useRef<boolean>(GLOBAL_INITIALIZED.value);
  const [loading, setLoading] = useState(!GLOBAL_INITIALIZED.value);
  const [isInitialized, setIsInitialized] = useState<boolean>(GLOBAL_INITIALIZED.value);
  
  // Safety timeout refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentLoadingRef = useRef<boolean>(loading);

  // Update ref whenever loading changes
  useEffect(() => {
    currentLoadingRef.current = loading;
  }, [loading]);

  // Safety timeout
  useEffect(() => {
    if (loading) {
      timeoutRef.current = setTimeout(() => {
        if (currentLoadingRef.current) {
          console.log("Forcing exit from loading state after timeout");
          setLoading(false);
          GLOBAL_INITIALIZED.value = true;
        }
      }, 3000);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading]);

  // Initialize only once globally
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!hasInitializedRef.current) {
          console.log("Initializing friend data...");
          
          // Fetch both friends and requests
          await Promise.all([
            fetchFriends(),
            fetchFriendRequests()
          ]);
          
          hasInitializedRef.current = true;
          GLOBAL_INITIALIZED.value = true;
          setIsInitialized(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error initializing friend data:", err);
        setLoading(false);
      }
    };
    
    initialize();
  }, [fetchFriends, fetchFriendRequests]);
  
  // Convenience methods with loading state management
  const handleSendFriendRequest = useCallback(async (emailOrUsername: string) => {
    setLoading(true);
    try {
      await sendFriendRequest(emailOrUsername);
    } finally {
      setLoading(false);
    }
  }, [sendFriendRequest]);
  
  const handleRespondToRequest = useCallback(async (friendshipId: string, accept: boolean) => {
    setLoading(true);
    try {
      await respondToFriendRequest(friendshipId, accept);
    } finally {
      setLoading(false);
    }
  }, [respondToFriendRequest]);
  
  const handleMarkAllAsRead = useCallback(async () => {
    setLoading(true);
    try {
      await markAllAsRead();
    } finally {
      setLoading(false);
    }
  }, [markAllAsRead]);

  // Add this function to refresh data at regular intervals
  useEffect(() => {
    // Skip if not initialized yet
    if (!isInitialized) return;
    
    // Refresh data every 10 seconds to stay in sync with socket events
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Auto-refreshing friend data');
        fetchFriendRequests();
        // Don't fetch friends too often as that list changes less frequently
        if (Math.random() > 0.7) fetchFriends(); 
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [isInitialized, fetchFriendRequests, fetchFriends]);

  // Add a visibility change listener to refresh data when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isInitialized) {
        console.log('Tab became visible, refreshing friend data');
        fetchFriendRequests();
        fetchFriends();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isInitialized, fetchFriendRequests, fetchFriends]);

  // Expose the friend store methods and state
  return {
    friends,
    incomingRequests,
    outgoingRequests,
    acceptances,
    unreadCounts,
    loading,
    error,
    isInitialized,
    sendFriendRequest: handleSendFriendRequest,
    respondToRequest: handleRespondToRequest,
    markAllAsRead: handleMarkAllAsRead,
    refreshFriends: fetchFriends,
    refreshRequests: fetchFriendRequests
  };
}

export default useFriend;