"use client";

import React from "react";
import { Menu, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";

interface DashboardNavbarProps {
  onMenuClick: () => void;
  collapsed: boolean;
}

export default function DashboardNavbar({ 
  onMenuClick,
  collapsed 
}: DashboardNavbarProps) {
  return (
    <header className={cn(
      "h-16 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30",
      "flex items-center justify-between px-4 transition-all duration-300",
      collapsed ? "lg:pl-20" : "lg:pl-64"
    )}>
      {/* Left section: Menu toggle and logo on small screens */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="rounded-full p-2 hover:bg-accent flex items-center justify-center focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="lg:hidden flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Business Nexus" width={28} height={28} />
            <span className="font-medium hidden md:inline">Business Nexus</span>
          </Link>
        </div>
      </div>
      
      {/* Center section: Search */}
      <div className="hidden md:flex relative max-w-md flex-1 mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="w-full bg-muted/50 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>
      
      {/* Right section: Notifications and user menu */}
      <div className="flex items-center gap-2">
        <button className="rounded-full p-2 hover:bg-accent relative flex items-center justify-center">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        
        <Avatar className="cursor-pointer h-8 w-8 transition-transform hover:scale-105">
          <AvatarImage src="/user-placeholder.png" alt="User" />
          <AvatarFallback>UN</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}