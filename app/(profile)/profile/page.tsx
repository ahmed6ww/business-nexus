"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User, Building2, ArrowRight, Search, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProfileActions from "@/components/profile/profile-actions";
import { getMyEntrepreneurProfile } from "@/lib/actions/entrepreneurs";
import { getMyInvestorProfile } from "@/lib/actions/investors";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Dummy data - will be replaced with actual data from the database
const featuredEntrepreneurs = [
  {
    id: "e1",
    slug: "sarah-johnson",
    name: "Sarah Johnson",
    company: "EcoTech Solutions",
    avatar: "/user-placeholder.png",
    tags: ["CleanTech", "Sustainability"]
  },
  {
    id: "e2",
    slug: "david-smith",
    name: "David Smith",
    company: "DataSync AI",
    avatar: "/user-placeholder.png",
    tags: ["AI", "Data"]
  },
  {
    id: "e3",
    slug: "lisa-taylor",
    name: "Lisa Taylor",
    company: "MedTech Innovations",
    avatar: "/user-placeholder.png",
    tags: ["HealthTech", "IoT"]
  }
];

const featuredInvestors = [
  {
    id: "i1",
    slug: "alex-thompson",
    name: "Alex Thompson",
    firm: "Venture Capital Fund",
    avatar: "/user-placeholder.png",
    interests: ["SaaS", "AI"]
  },
  {
    id: "i2",
    slug: "jennifer-wu",
    name: "Jennifer Wu",
    firm: "Angel Investor",
    avatar: "/user-placeholder.png",
    interests: ["FinTech", "Sustainability"]
  },
  {
    id: "i3",
    slug: "michael-brown",
    name: "Michael Brown",
    firm: "Growth Partners",
    avatar: "/user-placeholder.png",
    interests: ["B2B", "MarketPlace"]
  }
];

export default function ProfilePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasEntrepreneurProfile, setHasEntrepreneurProfile] = useState(false);
  const [hasInvestorProfile, setHasInvestorProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const userRole = session?.user?.role || null;

  // Check user authentication and profile status
  useEffect(() => {
    const checkProfiles = async () => {
      try {
        // Check if user has entrepreneur profile
        const entrepreneurResult = await getMyEntrepreneurProfile();
        if (entrepreneurResult.success) {
          setHasEntrepreneurProfile(true);
          setIsAuthenticated(true);
        } else if (entrepreneurResult.message && !entrepreneurResult.message.includes("Unauthorized")) {
          // If error is not about authorization, user is logged in but doesn't have an entrepreneur profile
          setIsAuthenticated(true);
        }
        
        // Check if user has investor profile
        const investorResult = await getMyInvestorProfile();
        if (investorResult.success) {
          setHasInvestorProfile(true);
          setIsAuthenticated(true);
        } else if (investorResult.message && !investorResult.message.includes("Unauthorized")) {
          // If error is not about authorization, user is logged in but doesn't have an investor profile
          setIsAuthenticated(true);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking profiles:", error);
        setLoading(false);
      }
    };
    
    checkProfiles();
  }, []);

  // Determine recommended profile section based on user role
  const renderRoleRecommendation = () => {
    if (!isAuthenticated || !userRole) return null;
    
    if (userRole === 'entrepreneur') {
      return (
        <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 mb-6">
          <Info className="h-5 w-5 text-blue-500" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">Entrepreneur Recommendation</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            As an entrepreneur, you should focus on exploring <Link href="/profile/investor" className="font-medium underline">investor profiles</Link> to find 
            potential funding partners for your startup.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (userRole === 'investor') {
      return (
        <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 mb-6">
          <Info className="h-5 w-5 text-blue-500" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">Investor Recommendation</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            As an investor, you should focus on exploring <Link href="/profile/entrepreneur" className="font-medium underline">entrepreneur profiles</Link> to find 
            promising startups for potential investment.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Explore Profiles</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with entrepreneurs and investors in the ecosystem. View profiles and reach out to potential partners.
        </p>
      </div>
      
      {/* Role-based recommendation */}
      {renderRoleRecommendation()}
      
      {/* Search */}
      <div className="flex gap-4 max-w-xl mx-auto">
        <Input 
          placeholder="Search by name, company, or interests..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
      
      {/* Profile Types */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Entrepreneur Profiles */}
        <Card className={`overflow-hidden ${userRole === 'investor' ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Entrepreneur Profiles
            </CardTitle>
            <CardDescription>
              Founders and startups seeking funding or partnerships
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              {featuredEntrepreneurs.map(entrepreneur => (
                <Link 
                  href={`/profile/entrepreneur/${entrepreneur.slug}`} 
                  key={entrepreneur.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {entrepreneur.avatar ? (
                      <img src={entrepreneur.avatar} alt={entrepreneur.name} className="rounded-full" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{entrepreneur.name}</p>
                    <p className="text-sm text-muted-foreground">{entrepreneur.company}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {entrepreneur.tags.map(tag => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
            <Link 
              href="/profile/entrepreneur"
              className="flex items-center justify-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
            >
              View all entrepreneurs
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </CardContent>
        </Card>
        
        {/* Investor Profiles */}
        <Card className={`overflow-hidden ${userRole === 'entrepreneur' ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Investor Profiles
            </CardTitle>
            <CardDescription>
              VCs, angel investors and investment firms looking for opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              {featuredInvestors.map(investor => (
                <Link 
                  href={`/profile/investor/${investor.slug}`} 
                  key={investor.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {investor.avatar ? (
                      <img src={investor.avatar} alt={investor.name} className="rounded-full" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{investor.name}</p>
                    <p className="text-sm text-muted-foreground">{investor.firm}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {investor.interests.map(interest => (
                      <span key={interest} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
            <Link 
              href="/profile/investor"
              className="flex items-center justify-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
            >
              View all investors
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Profile Actions */}
      {!loading && (
        <ProfileActions 
          isAuthenticated={isAuthenticated}
          hasEntrepreneurProfile={hasEntrepreneurProfile}
          hasInvestorProfile={hasInvestorProfile}
        />
      )}
    </div>
  );
}