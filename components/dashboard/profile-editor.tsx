"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, User, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { upsertEntrepreneurProfile } from '@/lib/actions/entrepreneurs';
import { upsertInvestorProfile } from '@/lib/actions/investors';
import { slugify } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Entrepreneur profile type
interface EntrepreneurProfileFormData {
  name: string;
  role: string;
  companyName: string;
  slug: string;
  location: string;
  email: string;
  website: string;
  linkedin: string;
  twitter: string;
  bio: string;
  startupDescription: string;
  fundingNeed: {
    amount: string;
    stage: string;
    use: string;
  };
  avatar: string;
}

// Investor profile type
interface InvestorProfileFormData {
  name: string;
  role: string;
  firmName: string;
  slug: string;
  location: string;
  email: string;
  website: string;
  linkedin: string;
  twitter: string;
  bio: string;
  investmentCriteria: string;
  investmentFocus: string[];
  investmentStages: string[];
  investmentSizes: {
    min: string;
    max: string;
  };
  avatar: string;
}

interface ProfileEditorProps {
  type: 'entrepreneur' | 'investor';
  existingData?: any;
}

export default function ProfileEditor({ type, existingData }: ProfileEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Entrepreneur form state
  const [entrepreneurForm, setEntrepreneurForm] = useState<EntrepreneurProfileFormData>({
    name: '',
    role: '',
    companyName: '',
    slug: '',
    location: '',
    email: '',
    website: '',
    linkedin: '',
    twitter: '',
    bio: '',
    startupDescription: '',
    fundingNeed: {
      amount: '',
      stage: '',
      use: ''
    },
    avatar: ''
  });
  
  // Investor form state
  const [investorForm, setInvestorForm] = useState<InvestorProfileFormData>({
    name: '',
    role: '',
    firmName: '',
    slug: '',
    location: '',
    email: '',
    website: '',
    linkedin: '',
    twitter: '',
    bio: '',
    investmentCriteria: '',
    investmentFocus: [],
    investmentStages: [],
    investmentSizes: {
      min: '',
      max: ''
    },
    avatar: ''
  });
  
  // Load existing data if available
  useEffect(() => {
    if (existingData) {
      if (type === 'entrepreneur') {
        setEntrepreneurForm({
          name: existingData.name || '',
          role: existingData.role || '',
          companyName: existingData.companyName || '',
          slug: existingData.slug || '',
          location: existingData.location || '',
          email: existingData.email || '',
          website: existingData.website || '',
          linkedin: existingData.linkedin || '',
          twitter: existingData.twitter || '',
          bio: existingData.bio || '',
          startupDescription: existingData.startupDescription || '',
          fundingNeed: {
            amount: existingData.fundingNeed?.amount || '',
            stage: existingData.fundingNeed?.stage || '',
            use: existingData.fundingNeed?.use || ''
          },
          avatar: existingData.avatar || ''
        });
      } else {
        setInvestorForm({
          name: existingData.name || '',
          role: existingData.role || '',
          firmName: existingData.firmName || '',
          slug: existingData.slug || '',
          location: existingData.location || '',
          email: existingData.email || '',
          website: existingData.website || '',
          linkedin: existingData.linkedin || '',
          twitter: existingData.twitter || '',
          bio: existingData.bio || '',
          investmentCriteria: existingData.investmentCriteria || '',
          investmentFocus: existingData.investmentFocus || [],
          investmentStages: existingData.investmentStages || [],
          investmentSizes: {
            min: existingData.investmentSizes?.min || '',
            max: existingData.investmentSizes?.max || ''
          },
          avatar: existingData.avatar || ''
        });
      }
    }
  }, [existingData, type]);
  
  // Handle entrepreneur form change
  const handleEntrepreneurChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields like fundingNeed.amount
      const [parent, child] = name.split('.');
      setEntrepreneurForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof EntrepreneurProfileFormData],
          [child]: value
        }
      }));
    } else {
      setEntrepreneurForm(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Auto-generate slug from name or company name
      if (name === 'name' || name === 'companyName') {
        const slugSource = name === 'companyName' && value ? value : entrepreneurForm.name;
        if (slugSource) {
          setEntrepreneurForm(prev => ({
            ...prev,
            slug: slugify(slugSource)
          }));
        }
      }
    }
  };
  
  // Handle investor form change
  const handleInvestorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields like investmentSizes.min
      const [parent, child] = name.split('.');
      setInvestorForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof InvestorProfileFormData],
          [child]: value
        }
      }));
    } else {
      setInvestorForm(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Auto-generate slug from name or firm name
      if (name === 'name' || name === 'firmName') {
        const slugSource = name === 'firmName' && value ? value : investorForm.name;
        if (slugSource) {
          setInvestorForm(prev => ({
            ...prev,
            slug: slugify(slugSource)
          }));
        }
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (type === 'entrepreneur') {
        // Ensure required fields are provided
        if (!entrepreneurForm.name || !entrepreneurForm.slug) {
          toast({
            title: "Error",
            description: "Name and slug are required fields",
            variant: "destructive"
          });
          setSaving(false);
          return;
        }
        
        const result = await upsertEntrepreneurProfile(entrepreneurForm);
        
        if (result.success) {
          toast({
            title: "Success",
            description: existingData ? "Profile updated successfully" : "Profile created successfully"
          });
        } else {
          throw new Error(result.message || "Failed to save profile");
        }
      } else {
        // Ensure required fields are provided
        if (!investorForm.name || !investorForm.slug) {
          toast({
            title: "Error",
            description: "Name and slug are required fields",
            variant: "destructive"
          });
          setSaving(false);
          return;
        }
        
        const result = await upsertInvestorProfile(investorForm);
        
        if (result.success) {
          toast({
            title: "Success",
            description: existingData ? "Profile updated successfully" : "Profile created successfully"
          });
        } else {
          throw new Error(result.message || "Failed to save profile");
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while saving the profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
          {type === 'entrepreneur' ? (
            <User className="h-6 w-6 text-primary" />
          ) : (
            <Building2 className="h-6 w-6 text-primary" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            {existingData ? 'Update' : 'Create'} Your {type === 'entrepreneur' ? 'Entrepreneur' : 'Investor'} Profile
          </h2>
          <p className="text-muted-foreground">
            {type === 'entrepreneur'
              ? 'Share information about you and your startup with potential investors.'
              : 'Share your investment focus and criteria with entrepreneurs seeking funding.'}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {type === 'entrepreneur' ? (
          // Entrepreneur Profile Form
          <>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Basic information about you as a founder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={entrepreneurForm.name} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Input 
                      id="role" 
                      name="role" 
                      value={entrepreneurForm.role} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="Founder & CEO"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email"
                      value={entrepreneurForm.email} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      name="location" 
                      value={entrepreneurForm.location} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    value={entrepreneurForm.bio} 
                    onChange={handleEntrepreneurChange} 
                    placeholder="Tell us about yourself and your background"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input 
                      id="linkedin" 
                      name="linkedin" 
                      value={entrepreneurForm.linkedin} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input 
                      id="twitter" 
                      name="twitter" 
                      value={entrepreneurForm.twitter} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="@username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input 
                      id="avatar" 
                      name="avatar" 
                      value={entrepreneurForm.avatar} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Startup Information</CardTitle>
                <CardDescription>
                  Information about your startup and funding needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName" 
                      name="companyName" 
                      value={entrepreneurForm.companyName} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="Acme Inc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      name="website" 
                      value={entrepreneurForm.website} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startupDescription">Startup Description</Label>
                  <Textarea 
                    id="startupDescription" 
                    name="startupDescription" 
                    value={entrepreneurForm.startupDescription} 
                    onChange={handleEntrepreneurChange} 
                    placeholder="Describe what your startup does and its mission"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fundingNeed.amount">Funding Amount</Label>
                    <Input 
                      id="fundingNeed.amount" 
                      name="fundingNeed.amount" 
                      value={entrepreneurForm.fundingNeed.amount} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="$1M"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fundingNeed.stage">Funding Stage</Label>
                    <Input 
                      id="fundingNeed.stage" 
                      name="fundingNeed.stage" 
                      value={entrepreneurForm.fundingNeed.stage} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="Seed, Series A, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fundingNeed.use">Use of Funds</Label>
                    <Input 
                      id="fundingNeed.use" 
                      name="fundingNeed.use" 
                      value={entrepreneurForm.fundingNeed.use} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="Product development, marketing, etc."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">Profile URL Slug *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">business-nexus.com/profile/entrepreneur/</span>
                    <Input 
                      id="slug" 
                      name="slug" 
                      value={entrepreneurForm.slug} 
                      onChange={handleEntrepreneurChange} 
                      placeholder="your-slug"
                      required
                      className="max-w-[200px]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be automatically generated from your name or company name, but you can customize it.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          // Investor Profile Form
          <>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Basic information about you as an investor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={investorForm.name} 
                      onChange={handleInvestorChange} 
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Input 
                      id="role" 
                      name="role" 
                      value={investorForm.role} 
                      onChange={handleInvestorChange} 
                      placeholder="Partner, Angel Investor, etc."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email"
                      value={investorForm.email} 
                      onChange={handleInvestorChange} 
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      name="location" 
                      value={investorForm.location} 
                      onChange={handleInvestorChange} 
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    value={investorForm.bio} 
                    onChange={handleInvestorChange} 
                    placeholder="Tell us about yourself and your investment background"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input 
                      id="linkedin" 
                      name="linkedin" 
                      value={investorForm.linkedin} 
                      onChange={handleInvestorChange} 
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input 
                      id="twitter" 
                      name="twitter" 
                      value={investorForm.twitter} 
                      onChange={handleInvestorChange} 
                      placeholder="@username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input 
                      id="avatar" 
                      name="avatar" 
                      value={investorForm.avatar} 
                      onChange={handleInvestorChange} 
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Investment Information</CardTitle>
                <CardDescription>
                  Information about your investment focus and criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firmName">Firm Name</Label>
                    <Input 
                      id="firmName" 
                      name="firmName" 
                      value={investorForm.firmName} 
                      onChange={handleInvestorChange} 
                      placeholder="Acme Ventures"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      name="website" 
                      value={investorForm.website} 
                      onChange={handleInvestorChange} 
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="investmentCriteria">Investment Criteria</Label>
                  <Textarea 
                    id="investmentCriteria" 
                    name="investmentCriteria" 
                    value={investorForm.investmentCriteria} 
                    onChange={handleInvestorChange} 
                    placeholder="Describe what you look for in potential investments"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investmentSizes.min">Minimum Investment Size</Label>
                    <Input 
                      id="investmentSizes.min" 
                      name="investmentSizes.min" 
                      value={investorForm.investmentSizes.min} 
                      onChange={handleInvestorChange} 
                      placeholder="$50K"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="investmentSizes.max">Maximum Investment Size</Label>
                    <Input 
                      id="investmentSizes.max" 
                      name="investmentSizes.max" 
                      value={investorForm.investmentSizes.max} 
                      onChange={handleInvestorChange} 
                      placeholder="$500K"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">Profile URL Slug *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">business-nexus.com/profile/investor/</span>
                    <Input 
                      id="slug" 
                      name="slug" 
                      value={investorForm.slug} 
                      onChange={handleInvestorChange} 
                      placeholder="your-slug"
                      required
                      className="max-w-[200px]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be automatically generated from your name or firm name, but you can customize it.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
} 