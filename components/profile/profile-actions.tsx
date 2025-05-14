import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileActionsProps {
  hasEntrepreneurProfile?: boolean;
  hasInvestorProfile?: boolean;
  isAuthenticated?: boolean;
}

export default function ProfileActions({
  hasEntrepreneurProfile = false,
  hasInvestorProfile = false,
  isAuthenticated = false
}: ProfileActionsProps) {
  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Your Profile</CardTitle>
          <CardDescription>
            Sign in to create or manage your profiles on Business Nexus
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild variant="default">
            <Link href="/login">
              Sign In
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">
              Create an Account
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Your Profiles</CardTitle>
        <CardDescription>
          {!hasEntrepreneurProfile && !hasInvestorProfile
            ? "You don't have any profiles yet. Create one to connect with others."
            : "Update your profiles or create a new one."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Entrepreneur Profile Action */}
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="rounded-full bg-primary/10 p-3">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Entrepreneur Profile</h3>
            <p className="text-sm text-muted-foreground">
              {hasEntrepreneurProfile
                ? "Update your entrepreneur profile information"
                : "Create a profile as a founder or startup looking for investment"}
            </p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/entrepreneur?tab=my-profile`}>
              {hasEntrepreneurProfile ? "Update Profile" : "Create Profile"}
            </Link>
          </Button>
        </div>

        {/* Investor Profile Action */}
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="rounded-full bg-primary/10 p-3">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Investor Profile</h3>
            <p className="text-sm text-muted-foreground">
              {hasInvestorProfile
                ? "Update your investor profile information"
                : "Create a profile as an investor looking for opportunities"}
            </p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/investor?tab=my-profile`}>
              {hasInvestorProfile ? "Update Profile" : "Create Profile"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 