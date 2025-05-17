"use client";

import { Sidebar, SidebarContext } from "@/components/layout/sidebar";
import { useState } from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  // Control sidebar visibility
  const [visible, setVisible] = useState(false); 
  
  const toggleSidebar = () => {
    setVisible(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ toggleSidebar, isVisible: visible }}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Application Sidebar */}
        <Sidebar />  
        {/* Main Content Container */}
        <div className="flex flex-1 h-screen overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}