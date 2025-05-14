"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Mail, Linkedin, Twitter, Globe, Building, UserPlus, CheckCircle, LogIn, Loader2, User } from "lucide-react";
import { getInvestorProfile, getMyInvestorProfile } from "@/lib/actions/investors";
import { createCollaborationRequest, getMySentRequests, getMyCollaborationRequests } from "@/lib/actions/collaboration-requests";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyEntrepreneurProfile } from "@/lib/actions/entrepreneurs";
import ProfileActions from "@/components/profile/profile-actions";
import Link from "next/link";

// Define type for investor profile
interface InvestorProfile {
  id: string;
  slug: string;
  name: string;
  avatar: string | null;
  role: string | null;
  firmName: string | null;
  location: string | null;
  email: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  bio: string | null;
  interests: string[] | null;
  checkSize: string | null;
  investmentStage: string | null;
  portfolioCompanies: {
    name: string;
    description: string;
    role: string;
    year: number;
  }[] | null;
  portfolioCount: string | null;
}

// Fallback data in case the fetch fails
const fallbackInvestor = {
  id: "",
  slug: "",
  name: "Unknown Investor",
  avatar: "/user-placeholder.png",
  role: "Investor",
  firmName: "Unnamed Firm",
  location: "Location not specified",
  email: null,
  website: null,
  linkedin: null,
  twitter: null,
  bio: "Profile information not available.",
  interests: ["Technology"],
  checkSize: "Not specified",
  investmentStage: "Not specified",
  portfolioCompanies: [],
  portfolioCount: "0"
};

export default function InvestorProfilePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { toast } = useToast();
  const [investor, setInvestor] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [myEntrepreneurProfile, setMyEntrepreneurProfile] = useState<any>(null);
  const [hasMyInvestorProfile, setHasMyInvestorProfile] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'sent' | 'accepted'>('none');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch investor profile
        const result = await getInvestorProfile(slug);
        if (result.success && result.data) {
          // Transform data if needed to match our interface
          const profileData = result.data as InvestorProfile;
          
          // Ensure interests is an array
          if (!profileData.interests) {
            profileData.interests = [];
          }
          
          setInvestor(profileData);
          
          // Check if the current user is an entrepreneur
          const entrepreneurResult = await getMyEntrepreneurProfile();
          
          // If we get any result (success or error), the user is authenticated
          // Only an "Unauthorized" error would indicate not authenticated
          if (entrepreneurResult.success || (entrepreneurResult.message && !entrepreneurResult.message.includes("Unauthorized"))) {
            setIsAuthenticated(true);
          }
          
          if (entrepreneurResult.success && entrepreneurResult.data) {
            setMyEntrepreneurProfile(entrepreneurResult.data);
            
            // Check if a request has already been sent to this investor
            const receivedRequestsResult = await getMyCollaborationRequests();
            if (receivedRequestsResult.success && receivedRequestsResult.data) {
              const existingRequest = receivedRequestsResult.data.find(
                request => request.investor.id === profileData.id
              );
              
              if (existingRequest) {
                setRequestStatus(existingRequest.status as 'none' | 'pending' | 'sent' | 'accepted');
              }
            }
          }
          
          // Check if the user has an investor profile
          const myInvestorResult = await getMyInvestorProfile();
          if (myInvestorResult.success && myInvestorResult.data) {
            setHasMyInvestorProfile(true);
          }
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to load investor profile",
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
  const handleRequestConnection = async () => {
    if (!investor) {
      toast({
        title: "Error",
        description: "Could not load investor details",
        variant: "destructive"
      });
      return;
    }
    
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "You need to be logged in to request connections",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user has an entrepreneur profile; if not, try to create a minimal one
    if (!myEntrepreneurProfile) {
      toast({
        title: "Profile Required",
        description: "Please create an entrepreneur profile first",
        variant: "destructive"
      });
      return;
    }
    
    // Set to pending while request is sent
    setRequestStatus('pending');
    
    try {
      const result = await createCollaborationRequest({
        investorId: investor.id,
        message: `Hello ${investor.name}, I'm interested in connecting with you regarding potential investment opportunities.`
      });
      
      if (result.success) {
        setRequestStatus('sent');
        toast({
          title: "Request Sent",
          description: "Your connection request has been sent to the investor.",
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
  
  // Use the investor data from state, fallback to our default
  const profileData = investor || fallbackInvestor;
  
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
              <span>{profileData.role || "Investor"}, {profileData.firmName || "Independent"}</span>
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
            {profileData.interests && profileData.interests.slice(0, 5).map(interest => (
              <span 
                key={interest} 
                className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
              >
                {interest}
              </span>
            ))}
            {profileData.interests && profileData.interests.length > 5 && (
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                +{profileData.interests.length - 5} more
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Connection request button - accessible if user is authenticated */}
            {isAuthenticated ? (
              <>
                {myEntrepreneurProfile ? (
                  <>
                    {requestStatus === 'none' && (
                      <Button size="sm" onClick={handleRequestConnection}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Request Connection
                      </Button>
                    )}
                    {requestStatus === 'pending' && (
                      <Button size="sm" disabled>
                        <span className="animate-pulse">Sending request...</span>
                      </Button>
                    )}
                    {requestStatus === 'sent' && (
                      <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Request Sent
                      </Button>
                    )}
                    {requestStatus === 'accepted' && (
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Connected
                      </Button>
                    )}
                    {requestStatus === 'rejected' && (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-600 bg-red-50 dark:bg-red-900/20" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Request Declined
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <Button asChild variant="default" size="sm">
                      <Link href="/dashboard/entrepreneur?tab=my-profile">
                        <User className="h-4 w-4 mr-2" />
                        Create Entrepreneur Profile
                      </Link>
                    </Button>
                    
                    {/* Add ProfileActions component */}
                    <ProfileActions 
                      isAuthenticated={isAuthenticated}
                      hasEntrepreneurProfile={false}
                      hasInvestorProfile={hasMyInvestorProfile}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <Button asChild variant="default" size="sm">
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Log in to Connect
                  </Link>
                </Button>
                
                {/* Add ProfileActions component */}
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
        {/* Left Column: Bio & Investment Details */}
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
          
          {/* Portfolio Companies */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                <span>Portfolio Companies</span>
              </CardTitle>
              <CardDescription>
                Selected investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileData.portfolioCompanies && profileData.portfolioCompanies.length > 0 ? (
                <div className="grid gap-4">
                  {profileData.portfolioCompanies.map((company, index) => (
                    <div key={company.name} className={`flex items-center gap-4 ${index !== 0 ? 'pt-4 border-t' : ''}`}>
                      <div className="bg-muted rounded-md p-2 flex items-center justify-center">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-base">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">{company.description}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="bg-muted/50 px-2 py-0.5 rounded-full">
                            {company.role}
                          </span>
                          <span className="text-muted-foreground">
                            {company.year}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">No portfolio companies listed</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Investment Interests */}
        <div className="space-y-6">
          {/* All Investment Interests */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Investment Interests</CardTitle>
            </CardHeader>
            <CardContent>
              {profileData.interests && profileData.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.map(interest => (
                    <span 
                      key={interest} 
                      className="bg-muted/50 px-2.5 py-1 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-3">No interests specified</p>
              )}
            </CardContent>
          </Card>
          
          {/* Investment Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Investment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Check Size</p>
                <p className="font-medium">{profileData.checkSize || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investment Stage</p>
                <p className="font-medium">{profileData.investmentStage || "Not specified"}</p>
              </div>
              {profileData.portfolioCount && (
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Size</p>
                  <p className="font-medium">{profileData.portfolioCount} companies</p>
                </div>
              )}
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
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t">
                  <Skeleton className="h-10 w-10" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-40" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-6 w-36" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}