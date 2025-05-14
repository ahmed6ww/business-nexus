"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LightbulbIcon, TrendingUp, Users, Check, X, Clock, LogOut, User, ExternalLink, Edit, RefreshCw, AlertCircle, Info, Building2, Bug, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { getMyCollaborationRequests, updateRequestStatus, dumpCollaborationRequests } from '@/lib/actions/collaboration-requests';
import { getMyEntrepreneurProfile } from '@/lib/actions/entrepreneurs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileEditor from "@/components/dashboard/profile-editor";
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

// Define the request type based on the server action return type
interface CollaborationRequest {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
  message?: string | null;
  investor: {
    id: string;
    name: string;
    avatar?: string | null;
    role?: string | null;
    firmName?: string | null;
  };
}

export default function EntrepreneurDashboard() {
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [processingRequestIds, setProcessingRequestIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Get the tab from URL query parameter
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'dashboard');
  
  // Check if user has the correct role
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'entrepreneur') {
      toast({
        title: "Access Restricted",
        description: "This dashboard is for entrepreneurs only. Redirecting you to the appropriate dashboard.",
        variant: "destructive"
      });
      
      // Redirect to the appropriate dashboard based on role
      if (session?.user?.role === 'investor') {
        router.push('/dashboard/investor');
      } else {
        router.push('/login');
      }
    }
  }, [status, session, router, toast]);
  
  // Fetch collaboration requests from the database
  const fetchRequests = async (showToast = false) => {
    try {
      // If not authenticated or wrong role, abort early
      if (status === 'unauthenticated' || (session?.user?.role !== 'entrepreneur')) {
        setError(status === 'unauthenticated' 
          ? 'Please log in to view your requests' 
          : 'This dashboard is for entrepreneurs only');
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
        setError('You must be logged in to view collaboration requests');
        if (showToast) toast({ 
          title: "Authentication Error", 
          description: "Please log in to view your requests", 
          variant: "destructive" 
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      setDebug(`Authenticated as user ID: ${session.user.id} with role: ${session.user.role}`);
      
      // Step 2: Fetch entrepreneur profile
      const profileResult = await getMyEntrepreneurProfile();
      console.log("Entrepreneur profile result:", profileResult);
      
      if (profileResult.success && profileResult.data) {
        setProfileData(profileResult.data);
        setDebug(debug => `${debug}\nProfile found with ID: ${profileResult.data.id}`);
      } else if (!profileResult.success && profileResult.message?.includes('Unauthorized')) {
        setError('Please log in to view your requests');
        setDebug(debug => `${debug}\nAuthorization error: ${profileResult.message}`);
        if (showToast) toast({ 
          title: "Authentication Error", 
          description: "Please log in to view your requests", 
          variant: "destructive" 
        });
        setLoading(false);
        setRefreshing(false);
        return;
      } else if (!profileResult.success && profileResult.message?.includes('not found')) {
        setError('You need to create an entrepreneur profile first');
        setDebug(debug => `${debug}\nProfile not found: ${profileResult.message}`);
        if (showToast) toast({ 
          title: "Profile Required", 
          description: "You need to create an entrepreneur profile first", 
          variant: "destructive" 
        });
        setLoading(false);
        setRefreshing(false);
        return;
      } else {
        setError('Could not retrieve your profile');
        setDebug(debug => `${debug}\nUnknown profile error: ${profileResult.message}`);
        if (showToast) toast({ 
          title: "Error", 
          description: "Could not retrieve your profile", 
          variant: "destructive" 
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Step 3: Fetch collaboration requests
      console.log("About to fetch collaboration requests for entrepreneur ID:", profileResult.data.id);
      const result = await getMyCollaborationRequests();
      console.log("Collaboration requests result:", result);
      
      if (result.success) {
        console.log("Received successful result with data:", result.data);
        // Add this line to force a refresh of the data and reset any cached empty arrays
        setRequests([]);
        // Use setTimeout to ensure state update happens in next tick
        setTimeout(() => {
          setRequests(result.data as CollaborationRequest[]);
          setDebug(debug => `${debug}\nLoaded ${result.data.length} requests`);
          
          // Additional debugging
          if (result.data.length === 0) {
            console.log("No requests found - this might be an issue with the database query");
            setDebug(debug => `${debug}\nNo requests found - verify database has entries`);
          } else {
            console.log("Received requests:", result.data);
          }
          
          if (showToast) toast({ title: "Success", description: "Collaboration requests refreshed" });
        }, 0);
      } else {
        console.error("Failed to fetch requests:", result);
        setError(result.message || 'Failed to fetch requests');
        setDebug(debug => `${debug}\nRequest error: ${result.message}`);
        if (showToast) toast({ 
          title: "Error", 
          description: result.message || "Failed to fetch requests", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
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
  
  // Initial data load when component mounts or session changes
  useEffect(() => {
    if (status !== 'loading') {
      fetchRequests();
    }
  }, [status, activeTab]);

  // Add a periodic refresh for requests
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // Only set up polling if user is authenticated as entrepreneur
    if (status === 'authenticated' && session?.user?.role === 'entrepreneur') {
      intervalId = setInterval(() => {
        fetchRequests(false); // Silent refresh
      }, 30000); // Refresh every 30 seconds
      
      console.log("Set up automatic refresh for collaboration requests");
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, session]);

  // Handle accepting a request
  const handleAccept = async (requestId: string) => {
    try {
      setProcessingRequestIds(prev => new Set(prev).add(requestId));
      
      const result = await updateRequestStatus({
        requestId,
        status: 'accepted'
      });
      
      if (result.success) {
        if (result.data) {
          // Use the returned data to update the request
          setRequests(prevRequests => 
            prevRequests.map(req => 
              req.id === requestId ? 
              { 
                ...req, 
                status: result.data.status,
                // Ensure we're using the most up-to-date data
                updatedAt: result.data.updatedAt
              } : req
            )
          );
        } else {
          // Fallback to simple status update if no data returned
          setRequests(prevRequests => 
            prevRequests.map(req => 
              req.id === requestId ? { ...req, status: 'accepted' } : req
            )
          );
        }
        toast({ title: "Success", description: "Request accepted successfully" });
      } else {
        toast({ 
          title: "Error", 
          description: result.message || "Failed to accept request", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({ 
        title: "Error", 
        description: "Failed to accept request", 
        variant: "destructive" 
      });
    } finally {
      setProcessingRequestIds(prev => {
        const updated = new Set(prev);
        updated.delete(requestId);
        return updated;
      });
    }
  };
  
  // Handle rejecting a request
  const handleReject = async (requestId: string) => {
    try {
      setProcessingRequestIds(prev => new Set(prev).add(requestId));
      
      const result = await updateRequestStatus({
        requestId,
        status: 'rejected'
      });
      
      if (result.success) {
        if (result.data) {
          // Use the returned data to update the request
          setRequests(prevRequests => 
            prevRequests.map(req => 
              req.id === requestId ? 
              { 
                ...req, 
                status: result.data.status,
                // Ensure we're using the most up-to-date data
                updatedAt: result.data.updatedAt
              } : req
            )
          );
        } else {
          // Fallback to simple status update if no data returned
          setRequests(prevRequests => 
            prevRequests.map(req => 
              req.id === requestId ? { ...req, status: 'rejected' } : req
            )
          );
        }
        toast({ title: "Success", description: "Request declined" });
      } else {
        toast({ 
          title: "Error", 
          description: result.message || "Failed to decline request", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({ 
        title: "Error", 
        description: "Failed to decline request", 
        variant: "destructive" 
      });
    } finally {
      setProcessingRequestIds(prev => {
        const updated = new Set(prev);
        updated.delete(requestId);
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

  // Handle debugging action
  const handleDebugAction = async () => {
    try {
      setRefreshing(true);
      const result = await dumpCollaborationRequests();
      if (result.success) {
        toast({ 
          title: "Debug Info", 
          description: result.message,
          duration: 5000
        });
      } else {
        toast({ 
          title: "Debug Error", 
          description: result.message,
          variant: "destructive",
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error during debug action:', error);
      toast({ 
        title: "Debug Error", 
        description: "An error occurred during debugging",
        variant: "destructive" 
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to get the status badge with appropriate color
  const getStatusBadge = (status: 'pending' | 'accepted' | 'rejected') => {
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
            <span>Accepted</span>
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
          <h1 className="text-3xl font-bold">Entrepreneur Dashboard</h1>
          <p className="text-muted-foreground">Welcome back{profileData?.name ? `, ${profileData.name}` : ''}</p>
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
      ) : status === 'authenticated' && session?.user?.role !== 'entrepreneur' ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h2 className="text-xl font-semibold">Access Restricted</h2>
              <p className="mt-2 text-muted-foreground">
                This dashboard is for entrepreneurs only. Please log in with an entrepreneur account or switch to the appropriate dashboard.
              </p>
              <div className="flex justify-center mt-6 gap-4">
                {session?.user?.role === 'investor' ? (
                  <Button asChild>
                    <Link href="/dashboard/investor">
                      Go to Investor Dashboard
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
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="requests">Collaboration Requests</TabsTrigger>
            <TabsTrigger value="find-investors">Find Investors</TabsTrigger>
            <TabsTrigger value="my-profile">My Profile</TabsTrigger>
          </TabsList>
          
          {/* Main Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Entrepreneur-specific stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pitch Views</p>
                      <p className="text-3xl font-bold">248</p>
                      <p className="text-xs text-muted-foreground mt-1">+32% from last week</p>
                    </div>
                    <div className="rounded-full bg-primary/10 p-3">
                      <LightbulbIcon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Investor Connections</p>
                      <p className="text-3xl font-bold">{requests.filter(r => r.status === 'accepted').length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Connected investors</p>
                    </div>
                    <div className="rounded-full bg-chart-2/10 p-3">
                      <Building2 className="h-8 w-8 text-chart-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Funding</p>
                      <p className="text-3xl font-bold">{profileData?.fundingNeed?.amount || '$0'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{profileData?.fundingNeed?.stage || 'Not specified'}</p>
                    </div>
                    <div className="rounded-full bg-chart-3/10 p-3">
                      <TrendingUp className="h-8 w-8 text-chart-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Collaboration Requests</p>
                      <p className="text-3xl font-bold">{requests.filter(r => r.status === 'pending').length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Awaiting your response</p>
                    </div>
                    <div className="rounded-full bg-chart-4/10 p-3">
                      <Users className="h-8 w-8 text-chart-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Collaboration Requests Preview */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Recent Requests</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => fetchRequests(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? "Refreshing..." : "Refresh Now"}
                  </Button>
                  {requests.length > 0 && (
                    <Button variant="ghost" onClick={() => setActiveTab('requests')}>
                      View all
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <Card className="p-6">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      <p>Loading collaboration requests...</p>
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
                ) : requests.length > 0 ? (
                  requests.slice(0, 2).map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={request.investor.avatar || undefined} alt={request.investor.name} />
                              <AvatarFallback>{request.investor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{request.investor.name}</h3>
                              <p className="text-sm text-muted-foreground">{request.investor.role || request.investor.firmName}</p>
                              <p className="text-sm mt-2">{request.message || 'Investor is interested in your startup'}</p>
                              <div className="mt-2">
                                {getStatusBadge(request.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex md:flex-col justify-end gap-2 p-4 md:p-6 bg-muted/50 md:border-l">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleAccept(request.id)}
                              disabled={processingRequestIds.has(request.id)}
                            >
                              {processingRequestIds.has(request.id) ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              {processingRequestIds.has(request.id) ? "Processing..." : "Accept"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleReject(request.id)}
                              disabled={processingRequestIds.has(request.id)}
                            >
                              {processingRequestIds.has(request.id) ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <X className="h-4 w-4 mr-2" />
                              )}
                              {processingRequestIds.has(request.id) ? "Processing..." : "Decline"}
                            </Button>
                          </div>
                        )}
                        {(request.status === 'accepted' || request.status === 'rejected') && (
                          <div className="flex justify-end p-4 md:p-6 bg-muted/50 md:border-l">
                            <Button 
                              variant={request.status === 'accepted' ? "default" : "outline"}
                              size="sm"
                              disabled={request.status === 'rejected'}
                              asChild={request.status === 'accepted'}
                            >
                              {request.status === 'accepted' ? (
                                <Link href={`/profile/investor/${request.investor.id}`}>
                                  <Building2 className="h-4 w-4 mr-2" />
                                  View Profile
                                </Link>
                              ) : (
                                'Request Declined'
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-6 text-center">
                    <p>No collaboration requests yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      When investors send you connection requests, they will appear here.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Collaboration Requests Tab */}
          <TabsContent value="requests">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Collaboration Requests</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchRequests(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                  
                  {/* Debug Button - only visible in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDebugAction}
                      disabled={refreshing}
                      className="flex items-center gap-2 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border-yellow-300"
                    >
                      <Bug className="h-4 w-4" />
                      Debug
                    </Button>
                  )}
                </div>
              </div>
              
              {loading ? (
                <Card className="p-6">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    <p>Loading collaboration requests...</p>
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
              ) : requests.length > 0 ? (
                requests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.investor.avatar || undefined} alt={request.investor.name} />
                            <AvatarFallback>{request.investor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{request.investor.name}</h3>
                            <p className="text-sm text-muted-foreground">{request.investor.role || request.investor.firmName}</p>
                            <p className="text-sm mt-2">{request.message || 'Investor is interested in your startup'}</p>
                            <div className="mt-2">
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex md:flex-col justify-end gap-2 p-4 md:p-6 bg-muted/50 md:border-l">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleAccept(request.id)}
                            disabled={processingRequestIds.has(request.id)}
                          >
                            {processingRequestIds.has(request.id) ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            {processingRequestIds.has(request.id) ? "Processing..." : "Accept"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleReject(request.id)}
                            disabled={processingRequestIds.has(request.id)}
                          >
                            {processingRequestIds.has(request.id) ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            {processingRequestIds.has(request.id) ? "Processing..." : "Decline"}
                          </Button>
                        </div>
                      )}
                      {(request.status === 'accepted' || request.status === 'rejected') && (
                        <div className="flex justify-end p-4 md:p-6 bg-muted/50 md:border-l">
                          <Button 
                            variant={request.status === 'accepted' ? "default" : "outline"}
                            size="sm"
                            disabled={request.status === 'rejected'}
                            asChild={request.status === 'accepted'}
                          >
                            {request.status === 'accepted' ? (
                              <Link href={`/profile/investor/${request.investor.id}`}>
                                <Building2 className="h-4 w-4 mr-2" />
                                View Profile
                              </Link>
                            ) : (
                              'Request Declined'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-6 text-center">
                  <p>No collaboration requests yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    When investors send you connection requests, they will appear here.
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* Find Investors Tab */}
          <TabsContent value="find-investors">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Find Investors</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <Link href="/profile/investor">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View All Investors
                  </Link>
                </Button>
              </div>
              
              <div className="p-6 text-center">
                <Building2 className="h-12 w-12 mx-auto text-primary/60" />
                <h3 className="mt-4 text-lg font-medium">Discover Potential Investors</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Browse our collection of investors looking for opportunities like yours.
                  Filter by interests, investment stage, and more.
                </p>
                <Button 
                  className="mt-4"
                  asChild
                >
                  <Link href="/profile/investor">
                    Find Investors
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* My Profile Tab */}
          <TabsContent value="my-profile" className="space-y-6">
            <ProfileEditor 
              type="entrepreneur" 
              existingData={profileData} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}