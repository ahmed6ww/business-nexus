"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Search, Filter, ArrowUpDown, DollarSign, Building, AlertTriangle } from "lucide-react";
import ProfileCreateBanner from "@/components/profile/profile-create-banner";
import { getMyEntrepreneurProfile } from "@/lib/actions/entrepreneurs";
import { useSession } from "next-auth/react";

// Dummy data - will be replaced with actual data from the database
const investors = [
  {
    id: "i1",
    slug: "alex-thompson",
    name: "Alex Thompson",
    role: "Partner",
    firm: "Venture Capital Fund",
    location: "New York, NY",
    avatar: "/user-placeholder.png",
    interests: ["SaaS", "AI", "Enterprise Software", "FinTech", "HealthTech"],
    checkSize: "$500K - $2M",
    stage: "Seed to Series A",
    portfolioCount: 24
  },
  {
    id: "i2",
    slug: "jennifer-wu",
    name: "Jennifer Wu",
    role: "Angel Investor",
    firm: "Independent",
    location: "San Francisco, CA",
    avatar: "/user-placeholder.png",
    interests: ["FinTech", "Sustainability", "D2C", "Marketplace"],
    checkSize: "$50K - $250K",
    stage: "Pre-seed to Seed",
    portfolioCount: 12
  },
  {
    id: "i3",
    slug: "michael-brown",
    name: "Michael Brown",
    role: "Managing Partner",
    firm: "Growth Partners",
    location: "Chicago, IL",
    avatar: "/user-placeholder.png",
    interests: ["B2B", "MarketPlace", "E-commerce", "Logistics"],
    checkSize: "$1M - $5M",
    stage: "Series A to Series B",
    portfolioCount: 18
  },
  {
    id: "i4",
    slug: "sarah-garcia",
    name: "Sarah Garcia",
    role: "Investment Manager",
    firm: "Tech Ventures",
    location: "Austin, TX",
    avatar: "/user-placeholder.png",
    interests: ["CleanTech", "Sustainability", "AgTech", "IoT"],
    checkSize: "$250K - $1M",
    stage: "Seed",
    portfolioCount: 9
  },
  {
    id: "i5",
    slug: "daniel-kim",
    name: "Daniel Kim",
    role: "General Partner",
    firm: "Horizon Capital",
    location: "Boston, MA",
    avatar: "/user-placeholder.png",
    interests: ["HealthTech", "BioTech", "Medical Devices", "AI"],
    checkSize: "$2M - $10M",
    stage: "Series A to Series C",
    portfolioCount: 31
  },
  {
    id: "i6",
    slug: "rachel-patel",
    name: "Rachel Patel",
    role: "Founding Partner",
    firm: "Disrupt Ventures",
    location: "Los Angeles, CA",
    avatar: "/user-placeholder.png",
    interests: ["Consumer Apps", "Entertainment", "EdTech", "Social"],
    checkSize: "$500K - $3M",
    stage: "Seed to Series A",
    portfolioCount: 15
  }
];

// Define sorting options
const sortOptions = [
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Name (Z-A)", value: "name-desc" },
  { label: "Portfolio Size (Small to Large)", value: "portfolio-asc" },
  { label: "Portfolio Size (Large to Small)", value: "portfolio-desc" }
];

// Extract all unique interests from investors
const allInterests = Array.from(
  new Set(investors.flatMap(investor => investor.interests))
).sort();

// Extract all unique investment stages
const allStages = Array.from(
  new Set(investors.map(investor => investor.stage))
).sort();

export default function InvestorsPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasEntrepreneurProfile, setHasEntrepreneurProfile] = useState(false);
  const { data: session } = useSession();
  const userRole = session?.user?.role || null;
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const entrepreneurResult = await getMyEntrepreneurProfile();
        if (entrepreneurResult.success) {
          setIsAuthenticated(true);
          setHasEntrepreneurProfile(true);
        } else if (entrepreneurResult.message && !entrepreneurResult.message.includes("Unauthorized")) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    };
    
    checkAuth();
  }, []);
  
  // Handle interest selection
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };
  
  // Handle stage selection
  const toggleStage = (stage: string) => {
    if (selectedStages.includes(stage)) {
      setSelectedStages(selectedStages.filter(s => s !== stage));
    } else {
      setSelectedStages([...selectedStages, stage]);
    }
  };
  
  // Filter investors based on search query, selected interests and stages
  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = searchQuery === "" || 
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.firm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.interests.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesInterests = selectedInterests.length === 0 || 
      selectedInterests.some(interest => investor.interests.includes(interest));
    
    const matchesStages = selectedStages.length === 0 ||
      selectedStages.some(stage => investor.stage.includes(stage));
      
    return matchesSearch && matchesInterests && matchesStages;
  });
  
  // Sort investors based on selected sort option
  const sortedInvestors = [...filteredInvestors].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "portfolio-asc":
        return a.portfolioCount - b.portfolioCount;
      case "portfolio-desc":
        return b.portfolioCount - a.portfolioCount;
      default:
        return 0;
    }
  });

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedInterests([]);
    setSelectedStages([]);
  };

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Investor Profiles</h1>
          <p className="text-muted-foreground">
            Find investors looking for opportunities in your industry
          </p>
        </div>
        <Link href="/profile">
          <Button variant="outline" size="sm">
            Back to All Profiles
          </Button>
        </Link>
      </div>

      {/* Role-based information banner */}
      {userRole === 'investor' && (
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 flex gap-4 items-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-300">Investor Notice</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                This page is primarily designed for entrepreneurs to discover investors. 
                As an investor, you might want to <Link href="/profile/entrepreneur" className="underline font-medium">explore entrepreneur profiles</Link> instead
                to find potential investment opportunities.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entrepreneur Profile Creation Banner */}
      {isAuthenticated && !hasEntrepreneurProfile && userRole !== 'investor' && (
        <ProfileCreateBanner type="entrepreneur" isAuthenticated={isAuthenticated} />
      )}

      {/* Search and Filter */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="relative md:col-span-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search investors by name, firm, or interest..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Button 
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            {showFilterMenu && (
              <Card className="absolute top-full mt-1 z-50 w-72 right-0">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Filter by interests</CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {allInterests.map(interest => (
                      <Button
                        key={interest}
                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleInterest(interest)}
                        className="text-xs h-7"
                      >
                        {interest}
                      </Button>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Investment stage</h4>
                    <div className="flex flex-wrap gap-2">
                      {allStages.map(stage => (
                        <Button
                          key={stage}
                          variant={selectedStages.includes(stage) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleStage(stage)}
                          className="text-xs h-7"
                        >
                          {stage}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {(selectedInterests.length > 0 || selectedStages.length > 0) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-xs h-7 w-full"
                      onClick={clearAllFilters}
                    >
                      Clear all filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-md p-2 text-sm bg-background"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results stats */}
      <div className="flex justify-between items-center py-2 border-b">
        <p className="text-sm text-muted-foreground">
          Showing {sortedInvestors.length} investors
          {(selectedInterests.length > 0 || selectedStages.length > 0) && (
            <span>
              {selectedInterests.length > 0 && ` · ${selectedInterests.length} interest${selectedInterests.length > 1 ? 's' : ''}`} 
              {selectedStages.length > 0 && ` · ${selectedStages.length} stage${selectedStages.length > 1 ? 's' : ''}`}
            </span>
          )}
        </p>
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Investors Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedInvestors.length > 0 ? (
          sortedInvestors.map((investor) => (
            <Link
              key={investor.id}
              href={`/profile/investor/${investor.slug}`}
              className="block group"
            >
              <Card className="h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={investor.avatar} alt={investor.name} />
                      <AvatarFallback>
                        <Building2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{investor.name}</h3>
                      <p className="text-sm">
                        {investor.role}, <span className="font-medium">{investor.firm}</span>
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{investor.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {investor.interests.slice(0, 3).map(interest => (
                      <span key={interest} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                        {interest}
                      </span>
                    ))}
                    {investor.interests.length > 3 && (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                        +{investor.interests.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Check Size</p>
                      <p className="font-medium">{investor.checkSize}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Portfolio</p>
                      <p className="font-medium">{investor.portfolioCount} companies</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Investment Stage</p>
                      <p className="font-medium text-primary">{investor.stage}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="md:col-span-3 py-12 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-medium">No investors found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or filter criteria
            </p>
            {(searchQuery || selectedInterests.length > 0 || selectedStages.length > 0) && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}