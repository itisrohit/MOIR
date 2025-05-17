"use client";

import { useState, createContext, useContext } from "react";
import { MessageSquare, Users, Bell, LogOut, ChevronLeft, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Create a context to expose the sidebar toggle function
export const SidebarContext = createContext({
  toggleSidebar: () => {},
  isVisible: true,
  messageViewActive: false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setMessageViewActive: (active: boolean) => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("Chat");
  const { isVisible, toggleSidebar, messageViewActive } = useSidebar();

  const navItems = [
    { name: "Chat", icon: <MessageSquare className="h-5 w-5" /> },
    { name: "Friends", icon: <Users className="h-5 w-5" /> },
    { name: "Notifications", icon: <Bell className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Desktop toggle button - unchanged */}
      <Button
        variant="ghost"
        onClick={toggleSidebar}
        className={cn(
          // Desktop styling remains the same
          "hidden md:flex fixed z-40 items-center justify-center p-0",
          "h-12 w-6 border border-l-0 border-border/60",
          "bg-background/95 backdrop-blur-sm shadow-sm",
          "rounded-r-xl transition-all duration-300 ease-in-out",
          "hover:bg-muted focus:ring-1 focus:ring-primary/20 focus:outline-none",
          isVisible 
            ? "md:left-[70px] md:top-20" 
            : "md:left-0 md:top-20"
        )}
        aria-label={isVisible ? "Hide sidebar" : "Show sidebar"}
      >
        {isVisible ? (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {/* Mobile toggle button - hide when message view is active */}
      <Button
        variant="ghost"
        onClick={toggleSidebar}
        className={cn(
          "md:hidden fixed z-50 flex items-center justify-center",
          "bottom-4 right-4 h-12 w-12 rounded-full",
          "bg-background/95 backdrop-blur-sm shadow-md border border-border/60",
          "transition-all duration-300 ease-in-out",
          isVisible ? "rotate-180" : "rotate-0",
          // Hide when message view is active
          messageViewActive && "hidden"
        )}
        aria-label={isVisible ? "Close menu" : "Open menu"}
      >
        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
      </Button>
      
      {/* Overlay for mobile - blurs the background when sidebar is open */}
      <div
        className={cn(
          "md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30",
          "transition-opacity duration-300 ease-in-out",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col bg-background h-screen fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 ease-in-out",
        "w-[120px] md:w-[70px] shadow-sm border-r border-border/40", // Reduced width for mobile
        isVisible ? "translate-x-0" : "-translate-x-full",
      )}>
        {/* User profile section */}
        <div className="flex justify-center items-center py-6">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarImage src="https://github.com/shadcn.png" alt="Profile" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" 
                  aria-label="Online status indicator">
            </span>
          </div>
        </div>

        <Separator className="w-[80%] mx-auto opacity-50" />

        {/* Navigation Items - More compact spacing on mobile */}
        <TooltipProvider delayDuration={0}>
          <div className="px-2 py-6 flex-1">
            <nav className="space-y-6 md:space-y-8 flex flex-col items-center">
              {navItems.map((item) => (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActiveItem(item.name)}
                      className={cn(
                        "h-11 w-11 rounded-xl transition-all",
                        activeItem === item.name 
                ? "bg-primary/10 text-primary shadow-sm" 
                          : "hover:bg-muted"
                      )}
                    >
                      {item.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium md:flex hidden">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </div>
        </TooltipProvider>

        <div className="mt-auto pb-6 flex flex-col items-center">
          <Separator className="w-[80%] mx-auto opacity-50 mb-6" />
          <TooltipProvider>
            {/* Profile Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl text-primary hover:bg-primary/10 hover:text-primary/80 mb-3"
                >
                  <User className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium md:flex hidden">
                Profile
              </TooltipContent>
            </Tooltip>

            {/* Logout Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium md:flex hidden">
                Logout
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </>
  );
}

export default Sidebar;