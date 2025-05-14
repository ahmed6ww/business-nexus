"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Search, Filter, ArrowUpDown, AlertTriangle } from "lucide-react";
import ProfileCreateBanner from "@/components/profile/profile-create-banner";
import { getMyInvestorProfile } from "@/lib/actions/investors";
import { useSession } from "next-auth/react";

// Dummy data - will be replaced with actual data from the database
const entrepreneurs = [
  {
    id: "e1",
    slug: "sarah-johnson",
    name: "Sarah Johnson",
    company: "EcoTech Solutions",
    location: "San Francisco, CA",
    avatar: "/user-placeholder.png",
    tags: ["CleanTech", "Sustainability", "Solar Energy"],
    funding: "$1.2M",
    fundingStage: "Seed"
  },
  {
    id: "e2",
    slug: "david-smith",
    name: "David Smith",
    company: "DataSync AI",
    location: "Boston, MA",
    avatar: "/user-placeholder.png",
    tags: ["AI", "Data", "Enterprise"],
    funding: "$500K",
    fundingStage: "Pre-seed"
  },
  {
    id: "e3",
    slug: "lisa-taylor",
    name: "Lisa Taylor",
    company: "MedTech Innovations",
    location: "Austin, TX",
    avatar: "/user-placeholder.png",
    tags: ["HealthTech", "IoT", "Medical Devices"],
    funding: "$3M",
    fundingStage: "Series A"
  },
  {
    id: "e4",
    slug: "michael-brown",
    name: "Michael Brown",
    company: "Urban Farm Technologies",
    location: "Portland, OR",
    avatar: "/user-placeholder.png",
    tags: ["AgTech", "Sustainability", "Food"],
    funding: "$750K",
    fundingStage: "Seed"
  },
  {
    id: "e5",
    slug: "jennifer-rodriguez",
    name: "Jennifer Rodriguez",
    company: "FinFlow",
    location: "New York, NY",
    avatar: "/user-placeholder.png",
    tags: ["FinTech", "SaaS", "AI"],
    funding: "$2.5M",
    fundingStage: "Series A"
  },
  {
    id: "e6",
    slug: "robert-nguyen",
    name: "Robert Nguyen",
    company: "SecureBlock",
    location: "Seattle, WA",
    avatar: "/user-placeholder.png",
    tags: ["Cybersecurity", "Blockchain", "Enterprise"],
    funding: "$1.8M",
    fundingStage: "Seed"
  }
];

// Define sorting options
const sortOptions = [
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Name (Z-A)", value: "name-desc" },
  { label: "Funding (Low to High)", value: "funding-asc" },
  { label: "Funding (High to Low)", value: "funding-desc" }
];

export default function EntrepreneursPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasInvestorProfile, setHasInvestorProfile] = useState(false);
  const { data: session } = useSession();
  const userRole = session?.user?.role || null;
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const investorResult = await getMyInvestorProfile();
        if (investorResult.success) {
          setIsAuthenticated(true);
          setHasInvestorProfile(true);
        } else if (investorResult.message && !investorResult.message.includes("Unauthorized")) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    };
    
    checkAuth();
  }, []);
  
  // Extract all unique tags from entrepreneurs
  const allTags = Array.from(
    new Set(entrepreneurs.flatMap(entrepreneur => entrepreneur.tags))
  ).sort();
  
  // Handle tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Filter entrepreneurs based on search query and selected tags
  const filteredEntrepreneurs = entrepreneurs.filter(entrepreneur => {
    const matchesSearch = searchQuery === "" || 
      entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => entrepreneur.tags.includes(tag));
      
    return matchesSearch && matchesTags;
  });
  
  // Sort entrepreneurs based on selected sort option
  const sortedEntrepreneurs = [...filteredEntrepreneurs].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "funding-asc":
        return parseFloat(a.funding.replace(/[^0-9.]/g, "")) - parseFloat(b.funding.replace(/[^0-9.]/g, ""));
      case "funding-desc":
        return parseFloat(b.funding.replace(/[^0-9.]/g, "")) - parseFloat(a.funding.replace(/[^0-9.]/g, ""));
      default:
        return 0;
    }
  });

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Entrepreneur Profiles</h1>
          <p className="text-muted-foreground">
            Discover startup founders looking for funding and partnerships
          </p>
        </div>
        <Link href="/profile">
          <Button variant="outline" size="sm">
            Back to All Profiles
          </Button>
        </Link>
      </div>

      {/* Role-based information banner */}
      {userRole === 'entrepreneur' && (
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 flex gap-4 items-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-300">Entrepreneur Notice</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                This page is primarily designed for investors to discover entrepreneurs. 
                As an entrepreneur, you might want to <Link href="/profile/investor" className="underline font-medium">explore investor profiles</Link> instead
                to find potential funding partners.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investor Profile Creation Banner */}
      {isAuthenticated && !hasInvestorProfile && userRole !== 'entrepreneur' && (
        <ProfileCreateBanner type="investor" isAuthenticated={isAuthenticated} />
      )}

      {/* Search and Filter */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="relative md:col-span-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search entrepreneurs by name, company, or industry..." 
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
                  <CardTitle className="text-sm font-medium">Filter by tags</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <Button
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleTag(tag)}
                        className="text-xs h-7"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-xs h-7"
                      onClick={() => setSelectedTags([])}
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
          Showing {sortedEntrepreneurs.length} entrepreneurs
          {selectedTags.length > 0 && ` · Filtered by ${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''}`}
        </p>
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Entrepreneurs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedEntrepreneurs.length > 0 ? (
          sortedEntrepreneurs.map((entrepreneur) => (
            <Link
              key={entrepreneur.id}
              href={`/profile/entrepreneur/${entrepreneur.slug}`}
              className="block group"
            >
              <Card className="h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={entrepreneur.avatar} alt={entrepreneur.name} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{entrepreneur.name}</h3>
                      <p className="text-sm">{entrepreneur.company}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{entrepreneur.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {entrepreneur.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t text-sm">
                    <span className="font-medium">
                      {entrepreneur.funding}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {entrepreneur.fundingStage}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="md:col-span-3 py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-medium">No entrepreneurs found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or filter criteria
            </p>
            {(searchQuery || selectedTags.length > 0) && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTags([]);
                }}
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