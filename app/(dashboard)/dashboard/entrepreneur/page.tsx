"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LightbulbIcon, TrendingUp, Users, Briefcase, CalendarDays, Check, X, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define the request type
interface CollaborationRequest {
  id: string;
  investorId: string;
  investorName: string;
  investorTitle: string;
  profileSnippet: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
  avatarUrl: string;
}

// Mock data for investor collaboration requests
const mockRequests: CollaborationRequest[] = [
  {
    id: '1',
    investorId: 'inv-1',
    investorName: 'Alex Thompson',
    investorTitle: 'Partner at Venture Capital Fund',
    profileSnippet: 'Specializing in early-stage tech startups with 12+ years of investment experience. Previously funded 3 unicorns in the SaaS space.',
    status: 'Pending',
    createdAt: '2025-04-22T10:30:00Z',
    avatarUrl: '/user-placeholder.png',
  },
  {
    id: '2',
    investorId: 'inv-2',
    investorName: 'Jennifer Wu',
    investorTitle: 'Angel Investor',
    profileSnippet: 'Seed-stage investor focused on fintech and sustainable solutions. Former CEO of FinanceHub with extensive network in Asian markets.',
    status: 'Accepted',
    createdAt: '2025-04-18T14:45:00Z',
    avatarUrl: '/user-placeholder.png',
  },
  {
    id: '3',
    investorId: 'inv-3',
    investorName: 'Marcus Johnson',
    investorTitle: 'Investment Director at TechFund',
    profileSnippet: 'Looking for innovative solutions in healthcare and biotech. Our typical investment range is $500K-2M for Series A.',
    status: 'Rejected',
    createdAt: '2025-04-15T09:15:00Z',
    avatarUrl: '/user-placeholder.png',
  },
  {
    id: '4',
    investorId: 'inv-4',
    investorName: 'Sophia Garcia',
    investorTitle: 'Principal at Growth Partners',
    profileSnippet: 'Focusing on B2B SaaS and marketplace startups. Looking to invest in companies with strong unit economics and clear path to profitability.',
    status: 'Pending',
    createdAt: '2025-04-25T16:20:00Z',
    avatarUrl: '/user-placeholder.png',
  },
];

export default function EntrepreneurDashboard() {
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Simulate fetching investor requests from API
  useEffect(() => {
    // In a real app, you would fetch from your API
    const fetchRequests = async () => {
      try {
        // Replace with actual API call
        // const response = await fetch('/api/entrepreneur/requests');
        // const data = await response.json();
        
        // Using mock data for now
        setRequests(mockRequests);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, []);

  // Handle accepting a request
  const handleAccept = async (requestId: string) => {
    try {
      // In a real app, you would send a request to your API
      // await fetch(`/api/entrepreneur/requests/${requestId}/accept`, { method: 'POST' });
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'Accepted' } : req
      ));
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };
  
  // Handle rejecting a request
  const handleReject = async (requestId: string) => {
    try {
      // In a real app, you would send a request to your API
      // await fetch(`/api/entrepreneur/requests/${requestId}/reject`, { method: 'POST' });
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'Rejected' } : req
      ));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };
  
  // Helper function to get the status badge with appropriate color
  const getStatusBadge = (status: 'Pending' | 'Accepted' | 'Rejected') => {
    switch (status) {
      case 'Pending':
        return (
          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </div>
        );
      case 'Accepted':
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs">
            <Check className="h-3 w-3" />
            <span>Accepted</span>
          </div>
        );
      case 'Rejected':
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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Entrepreneur Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, let's grow your business!</p>
      </div>
      
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
                <p className="text-3xl font-bold">18</p>
                <p className="text-xs text-muted-foreground mt-1">3 new this month</p>
              </div>
              <div className="rounded-full bg-chart-2/10 p-3">
                <Users className="h-8 w-8 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Funding</p>
                <p className="text-3xl font-bold">$145K</p>
                <p className="text-xs text-muted-foreground mt-1">58% of goal</p>
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
                <p className="text-3xl font-bold">{requests.filter(r => r.status === 'Pending').length}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting your response</p>
              </div>
              <div className="rounded-full bg-chart-4/10 p-3">
                <Users className="h-8 w-8 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Investor Collaboration Requests */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Collaboration Requests</h2>
        <div className="space-y-4">
          {loading ? (
            <p>Loading collaboration requests...</p>
          ) : requests.length > 0 ? (
            requests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.avatarUrl} alt={request.investorName} />
                        <AvatarFallback>{request.investorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{request.investorName}</h3>
                        <p className="text-sm text-muted-foreground">{request.investorTitle}</p>
                        <p className="text-sm mt-2">{request.profileSnippet}</p>
                        <div className="mt-2">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {request.status === 'Pending' && (
                    <div className="flex md:flex-col justify-end gap-2 p-4 md:p-6 bg-muted/50 md:border-l">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleAccept(request.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleReject(request.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}
                  {(request.status === 'Accepted' || request.status === 'Rejected') && (
                    <div className="flex justify-end p-4 md:p-6 bg-muted/50 md:border-l">
                      <Button 
                        variant={request.status === 'Accepted' ? "default" : "outline"}
                        size="sm"
                        disabled={request.status === 'Rejected'}
                      >
                        {request.status === 'Accepted' ? (
                          <>
                            <Users className="h-4 w-4 mr-2" />
                            View Profile
                          </>
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
    </div>
  );
}