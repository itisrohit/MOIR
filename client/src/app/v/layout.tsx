import React from "react";
import MainLayout from "@/components/layout/main_layout";

interface VLayoutProps {
  children: React.ReactNode;
}

export default function VLayout({ children }: VLayoutProps) {
  return <MainLayout>{children}</MainLayout>;
}