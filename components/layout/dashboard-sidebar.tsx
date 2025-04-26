"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  Home, 
  BarChart3, 
  Users, 
  Briefcase, 
  MessagesSquare, 
  Bell,
  Settings,
  HelpCircle,
  ChevronRight
} from "lucide-react";

interface DashboardSidebarProps {
  collapsed: boolean;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function DashboardSidebar({ collapsed }: DashboardSidebarProps) {
  const pathname = usePathname();
  
  // Define navigation items
  const navItems: NavItem[] = [
    { 
      label: "Overview", 
      href: "/dashboard", 
      icon: <Home className="h-5 w-5" /> 
    },
    { 
      label: "Analytics", 
      href: "/dashboard/analytics", 
      icon: <BarChart3 className="h-5 w-5" /> 
    },
    { 
      label: "Network", 
      href: "/dashboard/network", 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      label: "Projects", 
      href: "/dashboard/projects", 
      icon: <Briefcase className="h-5 w-5" /> 
    },
    { 
      label: "Messages", 
      href: "/dashboard/messages", 
      icon: <MessagesSquare className="h-5 w-5" /> 
    },
    { 
      label: "Notifications", 
      href: "/dashboard/notifications", 
      icon: <Bell className="h-5 w-5" /> 
    }
  ];
  
  // Define settings nav items
  const settingsNavItems: NavItem[] = [
    { 
      label: "Settings", 
      href: "/dashboard/settings", 
      icon: <Settings className="h-5 w-5" /> 
    },
    { 
      label: "Help", 
      href: "/dashboard/help", 
      icon: <HelpCircle className="h-5 w-5" /> 
    }
  ];

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-20 bg-sidebar text-sidebar-foreground",
        "flex h-full flex-col border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        "lg:relative"
      )}
    >
      {/* Sidebar header with logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Business Nexus" width={36} height={36} />
          {!collapsed && (
            <span className="text-lg font-semibold">Business Nexus</span>
          )}
        </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex flex-1 flex-col justify-between overflow-y-auto py-6">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent/20",
                  collapsed && "justify-center"
                )}
              >
                {item.icon}
                {!collapsed && (
                  <span>{item.label}</span>
                )}
                {!collapsed && isActive && (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Settings section at bottom */}
        <div className="space-y-1 px-2 mt-2">
          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent/20",
                  collapsed && "justify-center"
                )}
              >
                {item.icon}
                {!collapsed && (
                  <span>{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}