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
  const [isInitialized, setIsInitialized] = useState(false);

  // Separate effect for hydration
  useEffect(() => {
    setIsInitialized(true);
    console.log("💧 Hydration completed");
  }, []);

  // Auth handling effect
  useEffect(() => {
    // Skip if not hydrated yet
    if (!isInitialized) {
      return;
    }

    // Handle auth state
    if (isAuthenticated) {
      // Verify token once
      verifyUser().catch(() => {
        // On failure, redirect happens automatically via the interceptor & localLogout
        router.replace("/auth");
      });
    } else if (!loading) {
      // Not authenticated and not in loading state
      router.replace("/auth");
    }
  }, [isAuthenticated, isInitialized, router, verifyUser]);

  // Show loading state
  if (loading || !isInitialized || (isAuthenticated && !user)) {
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

  // Auth verified, render the layout
  return <MainLayout>{children}</MainLayout>;
}