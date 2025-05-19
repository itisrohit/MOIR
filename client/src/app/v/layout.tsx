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

  // Wait for hydration first
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Authentication verification
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      // Let verifyUser handle all auth logic, including token checking and error handling
      verifyUser().catch(() => {
        // Verification already handles logout in error cases, just redirect
        router.replace('/auth');
      });
    } else if (isHydrated && !loading && !isAuthenticated) {
      // Not authenticated and not loading, redirect to login
      router.replace('/auth');
    }
  }, [isHydrated, isAuthenticated, loading, verifyUser, router]);

  // Show skeleton during loading states
  if (loading || !isHydrated || (isAuthenticated && !user)) {
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
    return null;
  }

  // Authentication verified, render the layout
  return <MainLayout>{children}</MainLayout>;
}