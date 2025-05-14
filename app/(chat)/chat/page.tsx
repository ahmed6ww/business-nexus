'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquarePlus, RefreshCw, User } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/context/socket-context';

interface Conversation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  participants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  } | null;
  unreadCount: number;
}

export default function ChatPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket();

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use fetch to call the API instead of directly calling server action
      const response = await fetch('/api/conversations');
      const data = await response.json();
      
      if (data.success && data.data) {
        setConversations(data.data);
      } else {
        setError(data.message || 'Failed to load conversations');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('An error occurred while fetching conversations');
    } finally {
      setLoading(false);
    }
  };

  // Handle socket events
  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('new-message', async (message) => {
        // Refresh conversations to update last message and unread count
        fetchConversations();
      });

      return () => {
        socket.off('new-message');
      };
    }
  }, [socket]);

  // Initial data fetch
  useEffect(() => {
    if (status === 'authenticated') {
      fetchConversations();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (status === 'loading') {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="p-8 flex justify-center items-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConversations}
            className="ml-2"
            disabled={loading}
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Your Conversations</CardTitle>
            <Button asChild>
              <Link href="/chat/new">
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                New Conversation
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You don't have any conversations yet.</p>
              <Button asChild>
                <Link href="/chat/new">
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Start a New Conversation
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => {
                const otherUser = conversation.participants[0] || { name: 'Unknown User' };
                
                return (
                  <Link 
                    key={conversation.id} 
                    href={`/chat/${conversation.id}`}
                    className="block"
                  >
                    <div className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer border">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://avatar.vercel.sh/${otherUser.id}`} alt={otherUser.name} />
                        <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{otherUser.name}</h3>
                          <span className="text-xs text-muted-foreground">
                            {conversation.lastMessage?.createdAt 
                              ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true }) 
                              : ''}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 