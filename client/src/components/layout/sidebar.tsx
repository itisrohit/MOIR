"use client";

import { useState, createContext, useContext, useCallback, useEffect, useMemo } from "react";
import { MessageSquare, Users, LogOut, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation"; // Add these imports
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// Import only what we need, remove tooltip imports
// import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import useAuth from "@/hooks/useAuth";
import { toastSuccess } from "@/utility/toastStyle";
import { useChatStore } from "@/store/chatStore";
import useFriendStore from "@/store/friendStore"; // Import friend store

// Context definition remains the same
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
  const { logout, user } = useAuth();
  const router = useRouter(); // Add router
  const pathname = usePathname(); // Add pathname to detect current route
  
  // Get unread counts from chat store
  const { unreadCounts } = useChatStore();
  
  // Get friend unread counts
  const { unreadCounts: friendUnreadCounts } = useFriendStore();
  
  // Calculate total unread messages
  const totalUnreadMessages = Object.values(unreadCounts).reduce((total, count) => total + count, 0);

  // Memoize navItems to prevent recreating on every render
  const navItems = useMemo(() => [
    { 
      name: "Chat", 
      path: "/v/chat",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : null  
    },
    { 
      name: "Friends", 
      path: "/v/friends",
      icon: <Users className="h-5 w-5" />,
      badge: friendUnreadCounts?.total > 0 ? friendUnreadCounts.total : null
    }
  ], [totalUnreadMessages, friendUnreadCounts?.total]);  // Include only the dependencies that affect navItems

  // Update active item based on pathname when component mounts
  useEffect(() => {  // Change useState to useEffect
    const currentRoute = navItems.find(item => pathname.startsWith(item.path));
    if (currentRoute) {
      setActiveItem(currentRoute.name);
    }
  }, [pathname, navItems]);  // Now navItems won't change on every render

  // Modified handler for navigation item clicks
  const handleNavItemClick = useCallback((item: { name: string; path: string }) => {
    setActiveItem(item.name);
    router.push(item.path);
  }, [router]);

  const handleLogout = useCallback(() => {
    toastSuccess("Logged Out", {
      description: "You have been successfully logged out",
      duration: 3000
    });
    logout();
  }, [logout]);

  return (
    <>
      {/* Desktop toggle button */}
      <Button
        variant="ghost"
        onClick={toggleSidebar}
        className={cn(
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

      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        onClick={toggleSidebar}
        className={cn(
          "md:hidden fixed z-50 flex items-center justify-center",
          "bottom-4 right-4 h-12 w-12 rounded-full",
          "bg-background/95 backdrop-blur-sm shadow-md border border-border/60",
          "transition-all duration-300 ease-in-out",
          isVisible ? "rotate-180" : "rotate-0",
          messageViewActive && "hidden"
        )}
        aria-label={isVisible ? "Close menu" : "Open menu"}
      >
        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
      </Button>
      
      {/* Overlay for mobile */}
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
        "w-[120px] md:w-[70px] shadow-sm border-r border-border/40",
        isVisible ? "translate-x-0" : "-translate-x-full",
      )}>
        {/* User profile section */}
        <div className="flex justify-center items-center py-6">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarImage src={user?.image || "https://github.com/shadcn.png"} alt={user?.name || "Profile"} />
              <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || "ME"}</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background"></span>
          </div>
        </div>

        <Separator className="w-[80%] mx-auto opacity-50" />

        {/* Navigation Items - Updated onClick handler */}
        <div className="px-2 py-6 flex-1">
          <nav className="space-y-6 md:space-y-8 flex flex-col items-center">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                size="icon"
                onClick={() => handleNavItemClick(item)}
                className={cn(
                  "h-11 w-11 rounded-xl transition-all relative",
                  activeItem === item.name 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "hover:bg-muted"
                )}
                title={item.name}
              >
                {item.icon}
                
                {/* Notification Badge */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Button>
            ))}
          </nav>
        </div>

        {/* Bottom section - REMOVED TOOLTIPS */}
        <div className="mt-auto pb-6 flex flex-col items-center">
          <Separator className="w-[80%] mx-auto opacity-50 mb-6" />
          
          {/* Profile Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl text-primary hover:bg-primary/10 hover:text-primary/80 mb-3"
            title="Profile" // Basic HTML tooltip as fallback
          >
            <User className="h-5 w-5" />
          </Button>

          {/* Logout Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600"
            title="Logout" // Basic HTML tooltip as fallback
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;