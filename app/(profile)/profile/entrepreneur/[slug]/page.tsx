"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MapPin, Mail, Linkedin, Twitter, Globe, FileText, DollarSign, UserPlus, CheckCircle, XCircle, User, Building2, LogIn, Loader2 } from "lucide-react";
import Link from "next/link";
import { getEntrepreneurProfile, getMyEntrepreneurProfile } from "@/lib/actions/entrepreneurs";
import { createCollaborationRequest, getMySentRequests } from "@/lib/actions/collaboration-requests";
import { getMyInvestorProfile } from "@/lib/actions/investors";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileActions from "@/components/profile/profile-actions";

// Define type for entrepreneur profile
interface EntrepreneurProfile {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  role: string | null;
  companyName: string | null;
  location: string | null;
  email: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  bio: string | null;
  startupDescription: string | null;
  pitchSummary: string | null;
  tags: string[];
  fundingNeed: {
    amount: string | null;
    stage: string | null;
    use: string | null;
  };
}

// Fallback data in case the fetch fails
const fallbackEntrepreneur: EntrepreneurProfile = {
  id: "",
  name: "Unknown Entrepreneur",
  slug: "",
  avatar: "/user-placeholder.png",
  role: "Founder",
  companyName: "Unnamed Company",
  location: null,
  email: null,
  website: null,
  linkedin: null,
  twitter: null,
  bio: "Profile information not available.",
  startupDescription: "No startup description available.",
  pitchSummary: "No pitch summary available.",
  tags: ["Technology"],
  fundingNeed: {
    amount: null,
    stage: null,
    use: null
  }
};

export default function EntrepreneurProfilePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { toast } = useToast();
  const [entrepreneur, setEntrepreneur] = useState<EntrepreneurProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [myInvestorProfile, setMyInvestorProfile] = useState<any>(null);
  const [hasMyEntrepreneurProfile, setHasMyEntrepreneurProfile] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'sent' | 'accepted'>('none');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch entrepreneur profile
        const result = await getEntrepreneurProfile(slug);
        if (result.success && result.data) {
          // Transform data if needed to match our interface
          const profileData = result.data as EntrepreneurProfile;
          
          // Ensure tags is an array
          if (!profileData.tags) {
            profileData.tags = [];
          }
          
          // Ensure funding need object exists
          if (!profileData.fundingNeed) {
            profileData.fundingNeed = {
              amount: null,
              stage: null,
              use: null
            };
          }
          
          setEntrepreneur(profileData);
          
          // Check if the current user is an investor
          const investorResult = await getMyInvestorProfile();
          
          // If we get any result (success or error), the user is authenticated
          // Only an "Unauthorized" error would indicate not authenticated
          if (investorResult.success || (investorResult.message && !investorResult.message.includes("Unauthorized"))) {
            setIsAuthenticated(true);
          }
          
          if (investorResult.success && investorResult.data) {
            setMyInvestorProfile(investorResult.data);
            
            // Check if a request has already been sent
            const sentRequestsResult = await getMySentRequests();
            if (sentRequestsResult.success && sentRequestsResult.data) {
              const existingRequest = sentRequestsResult.data.find(
                request => request.entrepreneur.id === profileData.id
              );
              
              if (existingRequest) {
                setRequestStatus(existingRequest.status as 'none' | 'pending' | 'sent' | 'accepted');
              }
            }
          }
          
          // Check if the user has an entrepreneur profile
          const myEntrepreneurResult = await getMyEntrepreneurProfile();
          if (myEntrepreneurResult.success && myEntrepreneurResult.data) {
            setHasMyEntrepreneurProfile(true);
          }
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to load entrepreneur profile",
            variant: "destructive"
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "An error occurred while loading the profile",
          variant: "destructive"
        });
        setLoading(false);
      }
    };
    
    fetchData();
  }, [slug, toast]);
  
  // Handle connection request
  const handleConnect = async () => {
    if (!entrepreneur) {
      toast({
        title: "Error",
        description: "Could not load entrepreneur details",
        variant: "destructive"
      });
      return;
    }
    
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "You need to be logged in to connect with entrepreneurs",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user has an investor profile
    if (!myInvestorProfile) {
      toast({
        title: "Profile Required",
        description: "Please create an investor profile first",
        variant: "destructive"
      });
      return;
    }
    
    // Set pending status while sending request
    setRequestStatus('pending');
    
    try {
      const result = await createCollaborationRequest({
        entrepreneurId: entrepreneur.id,
        message: `Hello ${entrepreneur.name}, I'm interested in learning more about ${entrepreneur.companyName || "your startup"}.`
      });
      
      if (result.success) {
        setRequestStatus('sent');
        toast({
          title: "Connection Request Sent",
          description: "Your connection request has been sent to the entrepreneur.",
        });
      } else {
        // Reset status if failed
        setRequestStatus('none');
        toast({
          title: "Error", 
          description: result.message || "Failed to send connection request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      setRequestStatus('none');
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return <ProfileSkeleton />;
  }
  
  // Use the entrepreneur data from state, fallback to our default
  const profileData = entrepreneur || fallbackEntrepreneur;
  
  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
          <AvatarImage src={profileData.avatar || "/user-placeholder.png"} alt={profileData.name} />
          <AvatarFallback className="text-2xl">
            {profileData.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{profileData.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{profileData.role || "Founder"}, {profileData.companyName || "Company Name Not Available"}</span>
              {profileData.location && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{profileData.location}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {profileData.tags && profileData.tags.map(tag => (
              <span 
                key={tag} 
                className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Only show Connect button if user is authenticated */}
            {isAuthenticated ? (
              myInvestorProfile ? (
                <Button 
                  className="w-full"
                  onClick={handleConnect}
                  disabled={requestStatus === 'pending' || requestStatus === 'sent' || requestStatus === 'accepted'}
                >
                  {requestStatus === 'none' && (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Connect
                    </>
                  )}
                  {requestStatus === 'pending' && (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  )}
                  {requestStatus === 'sent' && (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Request Sent
                    </>
                  )}
                  {requestStatus === 'accepted' && (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Connected
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <Button asChild variant="default" className="w-full">
                    <Link href="/dashboard/investor?tab=my-profile">
                      <Building2 className="mr-2 h-4 w-4" />
                      Create Investor Profile
                    </Link>
                  </Button>
                  
                  <ProfileActions 
                    isAuthenticated={isAuthenticated}
                    hasEntrepreneurProfile={hasMyEntrepreneurProfile}
                    hasInvestorProfile={false}
                  />
                </div>
              )
            ) : (
              <div className="space-y-4">
                <Button asChild variant="default" className="w-full">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Log in to Connect
                  </Link>
                </Button>
                
                <ProfileActions 
                  isAuthenticated={false}
                  hasEntrepreneurProfile={false}
                  hasInvestorProfile={false}
                />
              </div>
            )}
            
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Contact
            </Button>
            {profileData.linkedin && (
              <Button variant="outline" size="sm" className="text-[#0A66C2]" asChild>
                <a href={`https://${profileData.linkedin}`} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            )}
            {profileData.twitter && (
              <Button variant="outline" size="sm" className="text-[#1DA1F2]" asChild>
                <a href={`https://twitter.com/${profileData.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </a>
              </Button>
            )}
            {profileData.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bio & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
              <p>{profileData.bio || "No biography available."}</p>
            </CardContent>
          </Card>
          
          {/* Company */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <Briefcase className="h-5 w-5" />
                <span>{profileData.companyName || "Company"}</span>
              </CardTitle>
              <CardDescription>Startup Description</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{profileData.startupDescription || "No company description available."}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Funding & Pitch */}
        <div className="space-y-6">
          {/* Funding Needs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span>Funding Needs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{profileData.fundingNeed?.amount || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stage</span>
                  <span className="font-medium">{profileData.fundingNeed?.stage || "Not specified"}</span>
                </div>
                {profileData.fundingNeed?.use && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">Use of Funds</p>
                    <p className="text-sm">{profileData.fundingNeed.use}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Pitch Deck */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>Pitch Materials</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 border border-dashed rounded-md p-6 text-center space-y-2">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="font-medium">Pitch Deck</p>
                <p className="text-xs text-muted-foreground">
                  Available upon request
                </p>
                <Button size="sm" className="mt-2">Request Access</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Skeleton component for loading state
function ProfileSkeleton() {
  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Skeleton className="w-32 h-32 rounded-full" />
        <div className="flex-1 space-y-4">
          <div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-48 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-7 w-48" />
              </div>
              <Skeleton className="h-5 w-32 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-7 w-36" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="pt-2 border-t">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-7 w-36" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 border border-dashed rounded-md p-6 text-center space-y-2">
                <Skeleton className="h-8 w-8 mx-auto rounded-md" />
                <Skeleton className="h-5 w-24 mx-auto" />
                <Skeleton className="h-4 w-36 mx-auto" />
                <Skeleton className="h-8 w-32 mx-auto mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}