import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, UserPlus, Building2 } from 'lucide-react';

interface ProfileCreateBannerProps {
  type: 'entrepreneur' | 'investor';
  isAuthenticated: boolean;
}

export default function ProfileCreateBanner({ type, isAuthenticated }: ProfileCreateBannerProps) {
  if (!isAuthenticated) {
    return null; // Don't show to non-authenticated users as they will see login prompts elsewhere
  }

  return (
    <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        {type === 'entrepreneur' ? (
          <UserPlus className="h-8 w-8 text-primary" />
        ) : (
          <Building2 className="h-8 w-8 text-primary" />
        )}
        <div>
          <h3 className="font-semibold">Create your {type === 'entrepreneur' ? 'entrepreneur' : 'investor'} profile</h3>
          <p className="text-sm text-muted-foreground">
            {type === 'entrepreneur' 
              ? 'Showcase your startup and connect with potential investors' 
              : 'Share your investment interests and connect with entrepreneurs'}
          </p>
        </div>
      </div>
      <Button asChild>
        <Link href={`/dashboard/${type}?tab=my-profile`}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Profile
        </Link>
      </Button>
    </div>
  );
} 