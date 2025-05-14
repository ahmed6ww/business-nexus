'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RefreshCw, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function NewConversationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users to chat with
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would typically be a server action, but we're accessing the database directly for simplicity
      const response = await fetch('/api/users/search?query=' + encodeURIComponent(searchQuery || ''));
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.filter((user: User) => user.id !== session?.user.id));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    const newSelectedUsers = new Set(selectedUsers);
    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }
    setSelectedUsers(newSelectedUsers);
  };

  // Create a new conversation
  const handleCreateConversation = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'Select a user',
        description: 'Please select at least one user to start a conversation with',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setCreating(true);
      
      // Use fetch to call the API instead of directly calling server action
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds: Array.from(selectedUsers)
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        router.push(`/chat/${result.data.id}`);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to create conversation',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the conversation',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  // Seed example users for testing
  const handleSeedUsers = async () => {
    try {
      setSeeding(true);
      setError(null);
      
      const response = await fetch('/api/seed/simple', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        // Fetch users again after seeding
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to seed users',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error seeding users:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while seeding users',
        variant: 'destructive'
      });
    } finally {
      setSeeding(false);
    }
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Initial data fetch
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, searchQuery]);

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
      
      <Card>
        <CardHeader>
          <CardTitle>Start a New Conversation</CardTitle>
          <CardDescription>
            Select the users you want to chat with. You can start a conversation with one or more users.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={fetchUsers}
                disabled={loading}
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-6">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No users found. Try a different search term.</p>
                
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      You are in development mode. You can seed example users for testing:
                    </p>
                    <Button 
                      onClick={handleSeedUsers}
                      disabled={seeding}
                      variant="outline"
                    >
                      {seeding ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Seeding Users...
                        </>
                      ) : (
                        'Seed Example Users'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center p-3 rounded-lg border"
                >
                  <div className="flex items-center flex-1">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={`https://avatar.vercel.sh/${user.id}`} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Label
                      htmlFor={`select-${user.id}`}
                      className="cursor-pointer flex items-center mr-4"
                    >
                      <Checkbox
                        id={`select-${user.id}`}
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      <span className="ml-2">Select</span>
                    </Label>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-4">
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">
              {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <Button
            onClick={handleCreateConversation}
            disabled={selectedUsers.size === 0 || creating}
          >
            {creating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Start Conversation'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 