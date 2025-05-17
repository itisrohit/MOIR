"use client";

import { Sidebar, SidebarContext } from "@/components/layout/sidebar";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  // Control sidebar visibility
  const [visible, setVisible] = useState(false); // Default closed on mobile
  
  // Define the toggle function
  const toggleSidebar = () => {
    setVisible(prev => !prev);
  };

  // Create the context value
  const sidebarContextValue = {
    toggleSidebar,
    isVisible: visible,
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar with visibility state passed down */}
        <Sidebar  />
        
        {/* Main Content - transitions with sidebar */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          // Mobile has no margin adjustment since sidebar overlays content
          // Desktop adjusts margin based on sidebar visibility
          visible ? "md:ml-[70px]" : "md:ml-0"
        )}>
          {/* Header */}
          <header className="flex items-center p-4 border-b">
            <h1 className="text-xl font-medium">Chat Application</h1>
          </header>
          
          {/* Main content area */}
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}