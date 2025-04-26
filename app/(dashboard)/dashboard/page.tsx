import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, Briefcase } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Stats overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Users"
          value="2,834"
          description="+12% from last month"
          icon={<Users className="h-8 w-8 text-primary" />}
        />
        <StatsCard 
          title="New Projects"
          value="24"
          description="+6 since last week"
          icon={<Briefcase className="h-8 w-8 text-chart-2" />}
        />
        <StatsCard 
          title="Revenue"
          value="$48,294"
          description="+18% from last quarter"
          icon={<TrendingUp className="h-8 w-8 text-chart-3" />}
        />
        <StatsCard 
          title="Analytics"
          value="1,432"
          description="+4% engagement rate"
          icon={<BarChart3 className="h-8 w-8 text-chart-4" />}
        />
      </div>
      
      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Sample content - you can replace with real data */}
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">New connection request</p>
                <p className="text-sm text-muted-foreground">Jane Smith wants to connect with you</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">Project update</p>
                <p className="text-sm text-muted-foreground">Business plan assessment completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 grid-cols-2">
              <button className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border p-4 hover:bg-muted transition-colors">
                <Users className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Connect</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border p-4 hover:bg-muted transition-colors">
                <Briefcase className="h-8 w-8 text-chart-2" />
                <span className="text-sm font-medium">New Project</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border p-4 hover:bg-muted transition-colors">
                <TrendingUp className="h-8 w-8 text-chart-3" />
                <span className="text-sm font-medium">Analytics</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border p-4 hover:bg-muted transition-colors">
                <BarChart3 className="h-8 w-8 text-chart-4" />
                <span className="text-sm font-medium">Reports</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for stats cards
function StatsCard({ 
  title, 
  value, 
  description, 
  icon 
}: { 
  title: string; 
  value: string; 
  description: string; 
  icon: React.ReactNode; 
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}