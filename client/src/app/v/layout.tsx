"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/main_layout";
import useAuth from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface VLayoutProps {
  children: React.ReactNode;
}

export default function VLayout({ children }: VLayoutProps) {
  const { isAuthenticated, loading, user, verifyUser } = useAuth();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  // Component mount log
  useEffect(() => {
    console.log('🔄 VLayout mounted with auth state:', { 
      isAuthenticated, 
      hasUser: !!user, 
      loading 
    });
    
    return () => {
      console.log('🛑 VLayout unmounting');
    };
  }, []);

  // Wait for hydration first
  useEffect(() => {
    setIsHydrated(true);
    console.log('💧 Hydration completed');
  }, []);

  // Authentication verification
  useEffect(() => {
    console.log('👀 Auth state changed:', { isAuthenticated, loading, hasUser: !!user });
    
    if (isHydrated && isAuthenticated) {
      console.log('🔑 Authenticated state detected, verifying user token...');
      verifyUser().then(() => {
        console.log('✅ Verification completed successfully');
      }).catch((error) => {
        console.log('❌ Verification failed:', error);
        console.log('🚪 Redirecting to login page after verification failure');
        router.replace('/auth');
      });
    } else if (isHydrated && !loading && !isAuthenticated) {
      console.log('🚫 Not authenticated, redirecting to login');
      router.replace('/auth');
    }
  }, [isHydrated, isAuthenticated, loading, verifyUser, router, user]);

  // Add render state logs
  console.log('🖥️ VLayout rendering with state:', { 
    isAuthenticated, 
    loading, 
    isHydrated, 
    hasUser: !!user 
  });

  // Show skeleton during loading states
  if (loading || !isHydrated || (isAuthenticated && !user)) {
    console.log('⏳ Rendering loading skeleton');
    return (
      <div className="w-full h-screen p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  // Not authenticated, render nothing while redirecting
  if (!isAuthenticated) {
    console.log('🚶‍♂️ Rendering null during redirect');
    return null;
  }

  console.log('✨ Rendering main layout with authenticated user:', user?.username);
  // Authentication verified, render the layout
  return <MainLayout>{children}</MainLayout>;
}