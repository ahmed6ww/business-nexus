"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { MessageSquare, PlusCircle, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/lib/socket';
import { getConversations } from '@/lib/actions/conversations';
import { Conversation } from '@/types/chat-types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const socket = useSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = session?.user?.id;
  
  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        if (!session?.user?.id) return;
        
        setLoading(true);
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, [session]);
  
  // Socket.io listeners for real-time updates
  useEffect(() => {
    if (!socket || !userId) return;
    
    // New conversation created
    socket.on('new-conversation', (conversation: Conversation) => {
      setConversations(prev => {
        if (prev.some(c => c.id === conversation.id)) return prev;
        return [conversation, ...prev];
      });
    });
    
    // New message in a conversation
    socket.on('new-message-notification', (data: { conversationId: string, message: any }) => {
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              lastMessage: data.message,
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    });
    
    return () => {
      socket.off('new-conversation');
      socket.off('new-message-notification');
    };
  }, [socket, userId]);
  
  // Helper to get the conversation name (excluding current user)
  const getConversationName = (conversation: Conversation) => {
    const otherParticipants = conversation.participants
      .filter(p => p.id !== userId)
      .map(p => p.name || p.email.split('@')[0]);
    
    if (otherParticipants.length === 0) return 'No participants';
    return otherParticipants.join(', ');
  };
  
  // Get user initials for avatar
  const getUserInitials = (conversation: Conversation) => {
    const otherParticipants = conversation.participants.filter(p => p.id !== userId);
    if (otherParticipants.length === 0) return 'CH';
    
    const user = otherParticipants[0];
    if (user.name) {
      return user.name.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    return user.email.substring(0, 2).toUpperCase();
  };
  
  // Get user avatar if available
  const getUserAvatar = (conversation: Conversation) => {
    const otherParticipants = conversation.participants.filter(p => p.id !== userId);
    if (otherParticipants.length === 0) return null;
    
    return otherParticipants[0].image;
  };
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-80 border-r flex flex-col h-full">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold flex items-center">
            <MessageSquare className="mr-2 h-6 w-6" />
            Chats
          </h1>
        </div>
        
        <div className="p-4 border-b">
          <Link href="/chat/new">
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Conversation
            </Button>
          </Link>
        </div>
        
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {conversations.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">
                    Start by creating a new conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conversation) => {
                    const isActive = pathname === `/chat/${conversation.id}`;
                    const conversationName = getConversationName(conversation);
                    const lastMessage = conversation.lastMessage?.content || 'Start a conversation';
                    
                    return (
                      <Link 
                        key={conversation.id} 
                        href={`/chat/${conversation.id}`}
                      >
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-accent' : 'hover:bg-accent/50'}`}>
                          <Avatar>
                            <AvatarFallback>
                              {getUserInitials(conversation)}
                            </AvatarFallback>
                            {getUserAvatar(conversation) && (
                              <AvatarImage src={getUserAvatar(conversation)!} />
                            )}
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {conversationName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {lastMessage}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
} 