import React from "react";
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import MainLayout from "@/components/layout/main_layout";

interface VLayoutProps {
  children: React.ReactNode;
}

export default async function VLayout({ children }: VLayoutProps) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;
  
  if (!refreshToken) {
    redirect('/auth');
  }
  
  return <MainLayout>{children}</MainLayout>;
}