import React from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Providers } from "@/components/providers";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <DashboardLayout>{children}</DashboardLayout>
    </Providers>
  );
}