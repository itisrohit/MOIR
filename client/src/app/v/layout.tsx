import React from "react";
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import MainLayout from "@/components/layout/main_layout";

interface VLayoutProps {
  children: React.ReactNode;
}

export default async function VLayout({ children }: VLayoutProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  if (!accessToken) {
    redirect('/auth');
  }
  
  return <MainLayout>{children}</MainLayout>;
}