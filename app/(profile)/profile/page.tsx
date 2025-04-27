"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Building2, ArrowRight, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Explore Profiles</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with entrepreneurs and investors in the ecosystem. View profiles and reach out to potential partners.
        </p>
      </div>
      
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
        <Card className="overflow-hidden">
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
        <Card className="overflow-hidden">
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
      
      {/* Your Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            View and manage your own profile
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link href="/profile/entrepreneur/my-profile">
              My Entrepreneur Profile
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/profile/investor/my-profile">
              My Investor Profile
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}