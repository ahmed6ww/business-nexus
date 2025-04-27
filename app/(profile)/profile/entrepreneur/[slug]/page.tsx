"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MapPin, Mail, Linkedin, Twitter, Globe, FileText, DollarSign } from "lucide-react";

// This will be replaced with real data from backend
const dummyEntrepreneur = {
  id: "e1",
  slug: "sarah-johnson",
  name: "Sarah Johnson",
  avatar: "/user-placeholder.png",
  role: "Founder & CEO",
  companyName: "EcoTech Solutions",
  location: "San Francisco, CA",
  email: "sarah@ecotech.co",
  website: "https://ecotechsolutions.com",
  linkedin: "linkedin.com/in/sarahjohnson",
  twitter: "@sarahj_ecotech",
  // Required properties according to schema
  bio: "Serial entrepreneur with 10+ years of experience in sustainable technology. Previously founded GreenWave (acquired in 2021) and led product at CleanEnergy Corp. MSc in Environmental Engineering from Stanford University.",
  startupDescription: "EcoTech Solutions is developing innovative solar-powered water purification systems for regions with limited access to clean water. Our patented technology reduces energy consumption by 40% compared to traditional methods while delivering 99.9% purification.",
  fundingNeed: {
    amount: "$1.2M",
    stage: "Seed",
    use: "Product development, team expansion, and market testing in three pilot regions"
  }
};

export default function EntrepreneurProfilePage({ params }: { params: { slug: string } }) {
  // In a real app, you would fetch data based on the slug
  // const { data, isLoading, error } = useSWR(`/api/entrepreneurs/${params.slug}`, fetcher)
  
  // For now, using dummy data
  const entrepreneur = dummyEntrepreneur;
  
  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
          <AvatarImage src={entrepreneur.avatar} alt={entrepreneur.name} />
          <AvatarFallback className="text-2xl">
            {entrepreneur.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{entrepreneur.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{entrepreneur.role}, {entrepreneur.companyName}</span>
              {entrepreneur.location && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{entrepreneur.location}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Contact
            </Button>
            {entrepreneur.linkedin && (
              <Button variant="outline" size="sm" className="text-[#0A66C2]" asChild>
                <a href={`https://${entrepreneur.linkedin}`} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            )}
            {entrepreneur.twitter && (
              <Button variant="outline" size="sm" className="text-[#1DA1F2]" asChild>
                <a href={`https://twitter.com/${entrepreneur.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </a>
              </Button>
            )}
            {entrepreneur.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={entrepreneur.website} target="_blank" rel="noopener noreferrer">
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
              <p>{entrepreneur.bio}</p>
            </CardContent>
          </Card>
          
          {/* Company */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5" />
                  <span>{entrepreneur.companyName}</span>
                </div>
              </CardTitle>
              <CardDescription>Startup Description</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{entrepreneur.startupDescription}</p>
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
                  <span className="font-medium">{entrepreneur.fundingNeed.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stage</span>
                  <span className="font-medium">{entrepreneur.fundingNeed.stage}</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Use of Funds</p>
                  <p className="text-sm">{entrepreneur.fundingNeed.use}</p>
                </div>
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