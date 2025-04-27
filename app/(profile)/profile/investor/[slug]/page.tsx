"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Mail, Linkedin, Twitter, Globe, Building, UserPlus, CheckCircle } from "lucide-react";

// This will be replaced with real data from backend
const dummyInvestor = {
  id: "i1",
  slug: "alex-thompson",
  name: "Alex Thompson",
  avatar: "/user-placeholder.png",
  role: "Partner",
  firmName: "Venture Capital Fund",
  location: "New York, NY",
  email: "alex@vcfund.com",
  website: "https://vcfund.com",
  linkedin: "linkedin.com/in/alexthompson",
  twitter: "@alex_investor",
  // Required properties according to schema
  bio: "Partner at Venture Capital Fund with 12+ years of investment experience. Previously funded three unicorns in the SaaS space. MBA from Harvard Business School and B.S. in Computer Science from MIT.",
  investmentInterests: [
    "Artificial Intelligence", "SaaS", "Enterprise Software", 
    "FinTech", "HealthTech", "Sustainability"
  ],
  portfolioCompanies: [
    {
      name: "DataSync AI",
      description: "AI-powered data integration platform",
      role: "Lead Investor, Series A",
      year: 2023
    },
    {
      name: "HealthMonitor",
      description: "Remote patient monitoring solution",
      role: "Seed Investor",
      year: 2022
    },
    {
      name: "FinanceFlow",
      description: "Automated bookkeeping software for SMBs",
      role: "Lead Investor, Seed",
      year: 2021
    },
    {
      name: "CloudSecure",
      description: "Zero-trust security platform",
      role: "Co-Investor, Series A",
      year: 2020
    }
  ]
};

export default function InvestorProfilePage({ params }: { params: { slug: string } }) {
  // State to track connection request status
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'sent'>('none');
  
  // In a real app, you would fetch data based on the slug
  // const { data, isLoading, error } = useSWR(`/api/investors/${params.slug}`, fetcher)
  
  // For now, using dummy data
  const investor = dummyInvestor;
  
  // Handle connection request
  const handleRequestConnection = async () => {
    // In a real app, this would send a request to your API
    // const response = await fetch('/api/connections/request', {
    //   method: 'POST',
    //   body: JSON.stringify({ investorId: investor.id }),
    //   headers: { 'Content-Type': 'application/json' }
    // });
    
    // Simulate API call with a delay
    setRequestStatus('pending');
    setTimeout(() => {
      setRequestStatus('sent');
    }, 1500);
  };
  
  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
          <AvatarImage src={investor.avatar} alt={investor.name} />
          <AvatarFallback className="text-2xl">
            {investor.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{investor.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{investor.role}, {investor.firmName}</span>
              {investor.location && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{investor.location}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {investor.investmentInterests.slice(0, 5).map(interest => (
              <span 
                key={interest} 
                className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
              >
                {interest}
              </span>
            ))}
            {investor.investmentInterests.length > 5 && (
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                +{investor.investmentInterests.length - 5} more
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Connection request button */}
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
              <Button size="sm" variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20" disabled>
                <CheckCircle className="h-4 w-4 mr-2" />
                Request Sent
              </Button>
            )}
            
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Contact
            </Button>
            {investor.linkedin && (
              <Button variant="outline" size="sm" className="text-[#0A66C2]" asChild>
                <a href={`https://${investor.linkedin}`} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            )}
            {investor.twitter && (
              <Button variant="outline" size="sm" className="text-[#1DA1F2]" asChild>
                <a href={`https://twitter.com/${investor.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </a>
              </Button>
            )}
            {investor.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={investor.website} target="_blank" rel="noopener noreferrer">
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
              <p>{investor.bio}</p>
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
              <div className="grid gap-4">
                {investor.portfolioCompanies.map((company, index) => (
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
              <div className="flex flex-wrap gap-2">
                {investor.investmentInterests.map(interest => (
                  <span 
                    key={interest} 
                    className="bg-muted/50 px-2.5 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}