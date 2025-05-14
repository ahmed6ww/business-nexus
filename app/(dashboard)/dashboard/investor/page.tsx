"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, TrendingUp, Users, Check, X, Clock, LogOut, ExternalLink, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { createCollaborationRequest, getMySentRequests } from '@/lib/actions/collaboration-requests';
import { getMyInvestorProfile } from '@/lib/actions/investors';
import { listEntrepreneurProfiles } from '@/lib/actions/entrepreneurs';
import { EntrepreneurProfile } from '@/lib/types/entrepreneurs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileEditor from "@/components/dashboard/profile-editor";
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface InvestorProfile {
  id: string;
  userId: string;
  name: string;
  firmName?: string | null;
  role?: string | null;
  interests?: string[] | null;
  bio?: string | null;
  avatar?: string | null;
  investmentPreferences?: {
    stages?: string[] | null;
    sectors?: string[] | null;
    geographies?: string[] | null;
    ticketSize?: {
      min?: number | null;
      max?: number | null;
      currency?: string | null;
    } | null;
  } | null;
}

interface SentRequest {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  message?: string | null;
  entrepreneur: {
    id: string;
    name: string;
    avatar?: string | null;
    companyName: string;
    industry?: string | null;
  };
}

export default function InvestorDashboard() {
  const [entrepreneurs, setEntrepreneurs] = useState<EntrepreneurProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [processingEntrepreneurIds, setProcessingEntrepreneurIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Get the tab from URL query parameter
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'entrepreneurs');
  
  // Check if user has the correct role
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'investor') {
      toast({
        title: "Access Restricted",
        description: "This dashboard is for investors only. Redirecting you to the appropriate dashboard.",
        variant: "destructive"
      });
      
      // Redirect to the appropriate dashboard based on role
      if (session?.user?.role === 'entrepreneur') {
        router.push('/dashboard/entrepreneur');
      } else {
        router.push('/login');
      }
    }
  }, [status, session, router, toast]);
  
  // Fetch entrepreneurs and sent collaboration requests from the database
  const fetchData = async (showToast = false) => {
    try {
      // If not authenticated or wrong role, abort early
      if (status === 'unauthenticated' || (session?.user?.role !== 'investor')) {
        setError(status === 'unauthenticated' 
          ? 'Please log in to view this dashboard' 
          : 'This dashboard is for investors only');
        setLoading(false);
        return;
      }
      
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setDebug(null);
      
      // Step 1: Make sure we're authenticated and have a userId
      if (!session || !session.user?.id) {
        setDebug("User not authenticated or missing ID");
        setError('You must be logged in to view this dashboard');
        if (showToast) toast({ 
          title: "Authentication Error", 
          description: "Please log in to continue", 
          variant: "destructive" 
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      setDebug(`Authenticated as user ID: ${session.user.id} with role: ${session.user.role}`);
      
      // Step 2: Fetch investor profile
      const investorResult = await getMyInvestorProfile();
      console.log("Investor profile result:", investorResult);
      
      if (investorResult.success && investorResult.data) {
        setInvestorProfile(investorResult.data);
        setDebug(debug => `${debug}\nInvestor profile found with ID: ${investorResult.data.id}`);
      } else if (!investorResult.success && investorResult.message?.includes('Unauthorized')) {
        setError('Please log in to view this dashboard');
        setDebug(debug => `${debug}\nAuthorization error: ${investorResult.message}`);
        if (showToast) toast({ 
          title: "Authentication Error", 
          description: "Please log in to continue", 
          variant: "destructive" 
        });
        setLoading(false);
        setRefreshing(false);
        return;
      } else if (!investorResult.success && investorResult.message?.includes('not found')) {
        setError('You need to create an investor profile first');
        setDebug(debug => `${debug}\nProfile not found: ${investorResult.message}`);
        if (showToast) toast({ 
          title: "Profile Required", 
          description: "You need to create an investor profile first", 
          variant: "destructive" 
        });
        setLoading(false);
        setRefreshing(false);
        return;
      } else {
        setError('Could not retrieve your profile');
        setDebug(debug => `${debug}\nUnknown profile error: ${investorResult.message}`);
        if (showToast) toast({ 
          title: "Error", 
          description: "Could not retrieve your profile", 
          variant: "destructive" 
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Step 3: Fetch entrepreneurs 
      const entrepreneursResult = await listEntrepreneurProfiles();
      console.log("Entrepreneurs result:", entrepreneursResult);
      
      if (entrepreneursResult.success) {
        setEntrepreneurs(entrepreneursResult.data);
        setDebug(debug => `${debug}\nLoaded ${entrepreneursResult.data.length} entrepreneurs`);
      } else {
        console.error("Failed to fetch entrepreneurs:", entrepreneursResult);
        setError(entrepreneursResult.message || 'Failed to fetch entrepreneurs');
        setDebug(debug => `${debug}\nEntrepreneurs error: ${entrepreneursResult.message}`);
        if (showToast) toast({ 
          title: "Error", 
          description: entrepreneursResult.message || "Failed to fetch entrepreneurs", 
          variant: "destructive" 
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Step 4: Fetch sent collaboration requests
      const requestsResult = await getMySentRequests();
      console.log("Sent requests result:", requestsResult);
      
      if (requestsResult.success) {
        setSentRequests(requestsResult.data as SentRequest[]);
        setDebug(debug => `${debug}\nLoaded ${requestsResult.data.length} sent requests`);
        if (showToast) toast({ title: "Success", description: "Data refreshed successfully" });
      } else {
        console.error("Failed to fetch sent requests:", requestsResult);
        // Don't block the UI for sent requests errors, just show a toast
        if (showToast) toast({ 
          title: "Warning", 
          description: "Could not load your sent collaboration requests", 
          variant: "destructive" 
        });
        setDebug(debug => `${debug}\nSent requests error: ${requestsResult.message}`);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An unexpected error occurred. Please try again.');
      setDebug(debug => `${debug}\nException: ${error instanceof Error ? error.message : String(error)}`);
      if (showToast) toast({ 
        title: "Error", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial data load
  useEffect(() => {
    if (status !== 'loading') {
      fetchData();
    }
  }, [status, activeTab]); // Reload data when session or tab changes
  
  // Send a collaboration request
  const sendRequest = async (entrepreneurId: string, message?: string) => {
    try {
      setProcessingEntrepreneurIds(prev => new Set(prev).add(entrepreneurId));
      
      const result = await createCollaborationRequest({
        entrepreneurId,
        message: message || "I'm interested in your startup. Let's connect."
      });
      
      if (result.success) {
        // Refresh sent requests
        const requestsResult = await getMySentRequests();
        if (requestsResult.success) {
          setSentRequests(requestsResult.data as SentRequest[]);
        }
        
        toast({ title: "Success", description: "Collaboration request sent" });
      } else {
        toast({ title: "Error", description: result.message || "Failed to send request", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast({ title: "Error", description: "Failed to send request", variant: "destructive" });
    } finally {
      setProcessingEntrepreneurIds(prev => {
        const updated = new Set(prev);
        updated.delete(entrepreneurId);
        return updated;
      });
    }
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({ redirect: true, callbackUrl: '/login' });
    } catch (error) {
      console.error('Error logging out:', error);
      setIsLoggingOut(false);
    }
  };
  
  // Helper function to get the request status for an entrepreneur
  const getRequestStatus = (entrepreneurId: string) => {
    const request = sentRequests.find(r => r.entrepreneur.id === entrepreneurId);
    if (!request) return 'none';
    return request.status;
  };
  
  // Helper function to get the status badge with appropriate color
  const getStatusBadge = (status: 'pending' | 'accepted' | 'rejected' | 'none') => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </div>
        );
      case 'accepted':
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs">
            <Check className="h-3 w-3" />
            <span>Connected</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1 text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full text-xs">
            <X className="h-3 w-3" />
            <span>Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Investor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back{investorProfile?.name ? `, ${investorProfile.name}` : ''}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>

      {status === 'loading' ? (
        <div className="py-12 text-center">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary/80" />
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      ) : status === 'authenticated' && session?.user?.role !== 'investor' ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h2 className="text-xl font-semibold">Access Restricted</h2>
              <p className="mt-2 text-muted-foreground">
                This dashboard is for investors only. Please log in with an investor account or switch to the appropriate dashboard.
              </p>
              <div className="flex justify-center mt-6 gap-4">
                {session?.user?.role === 'entrepreneur' ? (
                  <Button asChild>
                    <Link href="/dashboard/entrepreneur">
                      Go to Entrepreneur Dashboard
                    </Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/login">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="entrepreneurs">Entrepreneurs</TabsTrigger>
            <TabsTrigger value="sent-requests">Sent Requests</TabsTrigger>
            <TabsTrigger value="explore-startups">Explore Startups</TabsTrigger>
            <TabsTrigger value="my-profile">My Profile</TabsTrigger>
          </TabsList>
          
          {/* Entrepreneurs Tab */}
          <TabsContent value="entrepreneurs" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Entrepreneurs</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            
            {loading ? (
              <Card className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  <p>Loading entrepreneurs...</p>
                </div>
              </Card>
            ) : error ? (
              <Card className="p-6">
                <div className="flex items-center justify-center text-destructive gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
                {debug && (
                  <div className="mt-3 p-3 border rounded bg-slate-50 dark:bg-slate-900 text-xs whitespace-pre-wrap font-mono">
                    <details>
                      <summary className="cursor-pointer text-muted-foreground">Debug Information</summary>
                      <div className="mt-2 text-muted-foreground">
                        {debug}
                      </div>
                    </details>
                  </div>
                )}
              </Card>
            ) : entrepreneurs.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                {entrepreneurs.map((entrepreneur) => {
                  const requestStatus = getRequestStatus(entrepreneur.id);
                  return (
                    <Card key={entrepreneur.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={entrepreneur.avatar || undefined} alt={entrepreneur.name} />
                              <AvatarFallback>{entrepreneur.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{entrepreneur.name}</h3>
                                {getStatusBadge(requestStatus as any)}
                              </div>
                              <p className="text-sm text-muted-foreground">{entrepreneur.companyName}</p>
                              <p className="text-sm mt-2 line-clamp-2">
                                {entrepreneur.pitch || 'No pitch available'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex md:flex-col justify-end gap-2 p-4 md:p-6 bg-muted/50 md:border-l">
                          <Button 
                            size="sm" 
                            asChild
                            variant="outline"
                          >
                            <Link href={`/profile/entrepreneur/${entrepreneur.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Profile
                            </Link>
                          </Button>
                          {requestStatus === 'none' && (
                            <Button 
                              size="sm" 
                              onClick={() => sendRequest(entrepreneur.id)}
                              disabled={processingEntrepreneurIds.has(entrepreneur.id)}
                            >
                              {processingEntrepreneurIds.has(entrepreneur.id) ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Users className="h-4 w-4 mr-2" />
                              )}
                              {processingEntrepreneurIds.has(entrepreneur.id) ? "Sending..." : "Connect"}
                            </Button>
                          )}
                          {requestStatus === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              disabled
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Request Sent
                            </Button>
                          )}
                          {requestStatus === 'accepted' && (
                            <Button 
                              size="sm" 
                              variant="default"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Connected
                            </Button>
                          )}
                          {requestStatus === 'rejected' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled
                            >
                              <X className="h-4 w-4 mr-2" />
                              Request Declined
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p>No entrepreneurs found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back later or refresh to see new entrepreneurs.
                </p>
              </Card>
            )}
          </TabsContent>
          
          {/* Sent Requests Tab */}
          <TabsContent value="sent-requests" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Sent Requests</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            
            {loadingRequests ? (
              <Card className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  <p>Loading sent requests...</p>
                </div>
              </Card>
            ) : error ? (
              <Card className="p-6">
                <div className="flex items-center justify-center text-destructive gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
                {debug && (
                  <div className="mt-3 p-3 border rounded bg-slate-50 dark:bg-slate-900 text-xs whitespace-pre-wrap font-mono">
                    <details>
                      <summary className="cursor-pointer text-muted-foreground">Debug Information</summary>
                      <div className="mt-2 text-muted-foreground">
                        {debug}
                      </div>
                    </details>
                  </div>
                )}
              </Card>
            ) : sentRequests.length > 0 ? (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.entrepreneur.avatar || undefined} alt={request.entrepreneur.name} />
                            <AvatarFallback>{request.entrepreneur.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{request.entrepreneur.name}</h3>
                            <p className="text-sm text-muted-foreground">{request.entrepreneur.companyName}</p>
                            <p className="text-sm mt-2">{request.message || 'No message'}</p>
                            <div className="mt-2">
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end p-4 md:p-6 bg-muted/50 md:border-l">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link href={`/profile/entrepreneur/${request.entrepreneur.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p>No collaboration requests sent yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  View the Entrepreneurs tab to send connection requests.
                </p>
              </Card>
            )}
          </TabsContent>
          
          {/* Explore Startups Tab */}
          <TabsContent value="explore-startups">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Explore Startups</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <Link href="/profile/entrepreneur">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View All Startups
                  </Link>
                </Button>
              </div>
              
              <div className="p-6 text-center">
                <User className="h-12 w-12 mx-auto text-primary/60" />
                <h3 className="mt-4 text-lg font-medium">Discover Promising Startups</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Browse through our directory of entrepreneurs seeking investment and partnerships.
                  Filter by industry, stage, and funding needs.
                </p>
                <Button 
                  className="mt-4"
                  asChild
                >
                  <Link href="/profile/entrepreneur">
                    Browse Startups
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* My Profile Tab */}
          <TabsContent value="my-profile" className="space-y-6">
            <ProfileEditor 
              type="investor" 
              existingData={investorProfile} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}