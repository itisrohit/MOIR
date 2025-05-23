"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/main_layout";
import useAuth from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket"; 
import { Skeleton } from "@/components/ui/skeleton";

interface VLayoutProps {
  children: React.ReactNode;
}

export default function VLayout({ children }: VLayoutProps) {
  const { isAuthenticated, loading, user, verifyUser } = useAuth();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const hasVerified = useRef(false);

  // Initialize socket connection for authenticated users
  useSocket(); // Adding this line - this will handle all socket logic

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
    if (isAuthenticated && !hasVerified.current) {
      // Mark verification as done to prevent loops
      hasVerified.current = true;

      // Verify token once
      verifyUser().catch(() => {
        router.replace("/auth");
      });
    } else if (!loading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, isInitialized, loading, router, verifyUser]);

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

  // Auth verified, render the layout with socket connection active
  return <MainLayout>{children}</MainLayout>;
}