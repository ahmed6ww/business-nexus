"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { 
  Home, 
  MessagesSquare,
  User,
  Users,
  Building2,
  FolderPlus
} from "lucide-react";

interface DashboardSidebarProps {
  collapsed: boolean;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[]; // Optional array of roles that can see this item
}

export default function DashboardSidebar({ collapsed }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  
  // Define navigation items with role restrictions
  const navItems: NavItem[] = [
    { 
      label: "Overview", 
      href: "/dashboard", 
      icon: <Home className="h-5 w-5" /> 
    },
    { 
      label: "Investor Dashboard", 
      href: "/dashboard/investor", 
      icon: <Building2 className="h-5 w-5" />,
      roles: ["investor"]
    },
    { 
      label: "Entrepreneur Dashboard", 
      href: "/dashboard/entrepreneur", 
      icon: <User className="h-5 w-5" />,
      roles: ["entrepreneur"]
    },
    { 
      label: "Chat", 
      href: "/chat", 
      icon: <MessagesSquare className="h-5 w-5" /> 
    }
  ];
  
  // Define profile links with role restrictions
  const profileLinks: NavItem[] = [
    { 
      label: "Investor Profiles", 
      href: "/profile/investor", 
      icon: <Building2 className="h-5 w-5" />,
      roles: userRole === 'entrepreneur' ? ['entrepreneur'] : undefined // Show to entrepreneurs or when no specific role is set
    },
    { 
      label: "Entrepreneur Profiles", 
      href: "/profile/entrepreneur", 
      icon: <Users className="h-5 w-5" />,
      roles: userRole === 'investor' ? ['investor'] : undefined // Show to investors or when no specific role is set
    }
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => 
    !item.roles || !userRole || item.roles.includes(userRole)
  );
  
  // Filter profile links based on user role
  const filteredProfileLinks = profileLinks.filter(item => 
    !item.roles || !userRole || item.roles.includes(userRole)
  );

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
        {/* Main navigation */}
        <div className="space-y-6">
          <nav className="space-y-1 px-2">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
                    <div className="ml-auto h-2 w-2 rounded-full bg-sidebar-primary-foreground"></div>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Profile section */}
          {!collapsed && filteredProfileLinks.length > 0 && <div className="px-3 py-2">
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              Explore Profiles
            </h3>
          </div>}
          {filteredProfileLinks.length > 0 && (
            <nav className="space-y-1 px-2">
              {filteredProfileLinks.map((item) => {
                const isActive = pathname.startsWith(item.href);
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
            </nav>
          )}
        </div>
      </div>
    </aside>
  );
}