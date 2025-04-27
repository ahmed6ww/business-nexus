"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react';

// Define entrepreneur type
interface Entrepreneur {
  id: string;
  name: string;
  startup: string;
  pitchSummary: string;
  avatarUrl: string;
}

// Mock data for entrepreneurs
const mockEntrepreneurs: Entrepreneur[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    startup: 'EcoTech Solutions',
    pitchSummary: 'Sustainable energy solutions for urban environments. Our smart grid technology reduces energy consumption by up to 30% in commercial buildings.',
    avatarUrl: '/user-placeholder.png',
  },
  {
    id: '2',
    name: 'Michael Chen',
    startup: 'MedTech Innovations',
    pitchSummary: 'AI-powered diagnostic tools for healthcare providers. Our platform can detect early signs of conditions with 94% accuracy from standard medical imaging.',
    avatarUrl: '/user-placeholder.png',
  },
  {
    id: '3',
    name: 'Olivia Rodriguez',
    startup: 'FinFlow',
    pitchSummary: 'Next-generation financial management platform for small businesses. Our AI-driven software simplifies bookkeeping and provides actionable insights.',
    avatarUrl: '/user-placeholder.png',
  },
  {
    id: '4',
    name: 'David Park',
    startup: 'Urban Farm Technologies',
    pitchSummary: 'Vertical farming solutions for urban areas. Our hydroponic systems use 95% less water and deliver 30% higher yields than traditional farming.',
    avatarUrl: '/user-placeholder.png',
  },
];

export default function InvestorDashboard() {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Simulate fetching entrepreneurs from API
  useEffect(() => {
    // In a real app, you would fetch from your API
    const fetchEntrepreneurs = async () => {
      try {
        // Replace with actual API call
        // const response = await fetch('/api/entrepreneurs');
        // const data = await response.json();
        
        // Using mock data for now
        setEntrepreneurs(mockEntrepreneurs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching entrepreneurs:', error);
        setLoading(false);
      }
    };
    
    fetchEntrepreneurs();
  }, []);

  // Handle sending a collaboration request
  const handleSendRequest = async (entrepreneurId: string) => {
    alert(`Request sent to entrepreneur with ID: ${entrepreneurId}`);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Investor Dashboard</h1>
          <p className="text-muted-foreground">Connect with promising entrepreneurs</p>
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
      
      {/* Entrepreneur Listings */}
      <div className="grid gap-6 md:grid-cols-2">
        {loading ? (
          <p>Loading entrepreneurs...</p>
        ) : entrepreneurs.length > 0 ? (
          entrepreneurs.map((entrepreneur) => (
            <Card key={entrepreneur.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={entrepreneur.avatarUrl} alt={entrepreneur.name} />
                    <AvatarFallback>{entrepreneur.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{entrepreneur.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{entrepreneur.startup}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3">{entrepreneur.pitchSummary}</p>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-4">
                <Button 
                  size="lg" 
                  onClick={() => handleSendRequest(entrepreneur.id)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Request
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p>No entrepreneurs found.</p>
        )}
      </div>
    </div>
  );
}