'use client';

import React from 'react';
import { SocketProvider } from '@/context/socket-context';
import { SessionProvider } from 'next-auth/react';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SocketProvider>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                  <MessageSquare className="h-6 w-6" />
                  <span className="font-bold">Business Nexus Chat</span>
                </Link>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <Link
                    href="/chat"
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    Conversations
                  </Link>
                  <Link
                    href="/dashboard"
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    Profiles
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </SocketProvider>
    </SessionProvider>
  );
} 