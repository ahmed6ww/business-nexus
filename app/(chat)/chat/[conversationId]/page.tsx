'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCw, Send, ArrowLeft, UserCircle2 } from 'lucide-react';
import { formatRelative } from 'date-fns';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Message, User, Conversation } from '@/types/chat-types';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  isRead: boolean;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTyping, setUserTyping] = useState<string | null>(null);
  const conversationId = params.conversationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setMessages(result.data);
        
        // Mark unread messages as read
        const unreadMessageIds = result.data
          .filter(msg => !msg.isRead && msg.senderId !== session?.user.id)
          .map(msg => msg.id);
        
        if (unreadMessageIds.length > 0) {
          await fetch('/api/messages', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messageIds: unreadMessageIds
            }),
          });
        }
      } else {
        setError(result.message || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('An error occurred while fetching messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content: newMessage.trim()
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Emit the message to other participants via socket
        socket?.emit('send-message', {
          conversationId,
          message: result.data
        });
        
        // Add the new message to the local state
        setMessages(prev => [...prev, result.data]);
        setNewMessage('');
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to send message',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while sending your message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  // Handle typing indication
  const handleTyping = () => {
    if (!socket || !isConnected || !session) return;
    
    socket.emit('typing', { conversationId, userId: session.user.id });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a new timeout to emit stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { conversationId, userId: session.user.id });
    }, 3000);
  };

  // Handle keydown for sending message with Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initialize socket event listeners
  useEffect(() => {
    if (socket && isConnected) {
      // Join the conversation room
      socket.emit('join-conversation', conversationId);
      
      // Listen for new messages
      socket.on('new-message', (message) => {
        // Only add the message if it's for this conversation
        if (message.conversationId === conversationId) {
          setMessages(prev => [...prev, message]);
          
          // Mark the message as read if it's from someone else
          if (message.senderId !== session?.user.id) {
            fetch('/api/messages', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messageIds: [message.id]
              }),
            });
          }
        }
      });
      
      // Listen for typing indicators
      socket.on('user-typing', ({ userId }) => {
        if (userId !== session?.user.id) {
          setUserTyping(userId);
        }
      });
      
      // Listen for stop typing
      socket.on('user-stop-typing', ({ userId }) => {
        if (userTyping === userId) {
          setUserTyping(null);
        }
      });
      
      // Cleanup on unmount
      return () => {
        socket.emit('leave-conversation', conversationId);
        socket.off('new-message');
        socket.off('user-typing');
        socket.off('user-stop-typing');
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [socket, isConnected, conversationId, session]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial data fetch
  useEffect(() => {
    if (status === 'authenticated') {
      fetchMessages();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, conversationId]);

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
      <div className="mb-4">
        <Button variant="ghost" asChild>
          <Link href="/chat">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Conversations
          </Link>
        </Button>
      </div>
      
      <Card className="h-[calc(100vh-180px)] flex flex-col">
        <CardHeader className="border-b pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle>Conversation</CardTitle>
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMessages}
              disabled={loading}
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-6">
              {error}
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-full">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-2" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === session?.user.id;
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] items-end gap-2`}>
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${message.senderId}`} />
                          <AvatarFallback>
                            <UserCircle2 className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`rounded-lg px-4 py-2 ${
                        isOwnMessage 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p>{message.content}</p>
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <span className="text-xs opacity-70">
                            {formatRelative(new Date(message.createdAt), new Date())}
                          </span>
                          {message.isEdited && (
                            <span className="text-xs opacity-70">· edited</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {userTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2 text-sm animate-pulse">
                    Someone is typing...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t p-4">
          <div className="flex w-full gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleTyping}
              className="resize-none"
              disabled={!isConnected || sending}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || !isConnected || sending}
            >
              {sending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 