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
  const { isAuthenticated, loading, verifyUser } = useAuth();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  // First, wait for component hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Periodically verify token validity
  useEffect(() => {
    // Initial verification
    if (isHydrated && isAuthenticated) {
      verifyUser();
    }
    
    // Set up interval for periodic verification
    const tokenCheckInterval = setInterval(() => {
      if (isAuthenticated) {
        verifyUser();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(tokenCheckInterval);
  }, [isHydrated, isAuthenticated, verifyUser]);

  // Then, only redirect if not authenticated and hydration is complete
  useEffect(() => {
    if (isHydrated && !loading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, loading, router, isHydrated]);

  // Show skeleton during initial load
  if (loading || !isHydrated) {
    return (
      <div className="w-full h-screen p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; 
  }

  return <MainLayout>{children}</MainLayout>;
}