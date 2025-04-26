"use client";

import React from "react";
import { cn } from "@/lib/utils";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardNavbar from "./dashboard-navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardLayout({
  children,
  className,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <DashboardSidebar collapsed={collapsed} />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        {/* Navbar */}
        <DashboardNavbar 
          onMenuClick={() => setCollapsed(!collapsed)}
          collapsed={collapsed}
        />
        
        {/* Content */}
        <main className={cn("flex-1 overflow-auto p-6", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}