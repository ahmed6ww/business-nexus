"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, UsersRound, Plus, Trash2, User, Building2, Settings, FolderPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import { 
  createProfileGroup,
  getMyProfileGroups,
  deleteProfileGroup,
  getProfileGroupWithMembers,
  addEntrepreneursToGroup,
  addInvestorsToGroup,
  removeEntrepreneursFromGroup,
  removeInvestorsFromGroup,
  updateProfileGroup
} from '@/lib/actions/profile-groups';

import { listEntrepreneurProfiles } from '@/lib/actions/entrepreneurs';
import { listInvestorProfiles } from '@/lib/actions/investors';

// Types for profile groups and profiles
interface ProfileGroup {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdById: string;
  createdByType: 'investor' | 'entrepreneur';
  createdAt: Date;
  updatedAt: Date;
}

interface Entrepreneur {
  id: string;
  name: string;
  companyName: string | null;
  avatar: string | null;
}

interface Investor {
  id: string;
  name: string;
  firm: string | null;
  avatar: string | null;
}

interface ProfileGroupWithMembers {
  group: ProfileGroup;
  entrepreneurs: Entrepreneur[];
  investors: Investor[];
}

interface ProfileGroupsProps {
  userType: 'investor' | 'entrepreneur';
}

export default function ProfileGroups({ userType }: ProfileGroupsProps) {
  const { toast } = useToast();
  
  // State management
  const [profileGroups, setProfileGroups] = useState<ProfileGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  const [currentGroup, setCurrentGroup] = useState<ProfileGroupWithMembers | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  
  const [selectedEntrepreneurIds, setSelectedEntrepreneurIds] = useState<string[]>([]);
  const [selectedInvestorIds, setSelectedInvestorIds] = useState<string[]>([]);
  
  const [processingAction, setProcessingAction] = useState(false);
  
  // Fetch groups on component mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const result = await getMyProfileGroups();
        if (result.success) {
          setProfileGroups(result.data);
        } else {
          toast({
            title: 'Error',
            description: result.message || 'Failed to load profile groups',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error fetching profile groups:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile groups',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroups();
  }, [toast]);
  
  // Fetch profiles for adding to groups
  const fetchProfiles = async () => {
    try {
      // Fetch entrepreneurs
      const entrepreneursResult = await listEntrepreneurProfiles();
      if (entrepreneursResult.success) {
        setEntrepreneurs(entrepreneursResult.data || []);
      }
      
      // Fetch investors
      const investorsResult = await listInvestorProfiles();
      if (investorsResult.success) {
        setInvestors(investorsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
    }
  };

  // Create a new group
  const handleCreateGroup = async () => {
    try {
      if (!newGroupName.trim()) {
        toast({
          title: 'Error',
          description: 'Group name is required',
          variant: 'destructive'
        });
        return;
      }
      
      setProcessingAction(true);
      
      const result = await createProfileGroup({
        name: newGroupName,
        description: newGroupDescription || null,
        isPublic
      }, userType);
      
      if (result.success) {
        // Add the new group to state
        setProfileGroups([...profileGroups, result.data]);
        
        toast({
          title: 'Success',
          description: 'Profile group created successfully'
        });
        
        // Reset form and close dialog
        setNewGroupName('');
        setNewGroupDescription('');
        setIsPublic(true);
        setShowCreateDialog(false);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to create profile group',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating profile group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create profile group',
        variant: 'destructive'
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Delete a group
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    
    try {
      setProcessingAction(true);
      
      const result = await deleteProfileGroup(groupToDelete);
      
      if (result.success) {
        // Remove from state
        setProfileGroups(profileGroups.filter(g => g.id !== groupToDelete));
        
        toast({
          title: 'Success',
          description: 'Group deleted successfully'
        });
        
        setShowDeleteDialog(false);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to delete group',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'destructive'
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // View a group's details
  const handleViewGroup = async (groupId: string) => {
    try {
      const result = await getProfileGroupWithMembers(groupId);
      
      if (result.success) {
        setCurrentGroup(result.data);
        setShowViewDialog(true);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to load group details',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group details',
        variant: 'destructive'
      });
    }
  };

  // Open the manage dialog for a group
  const handleOpenManageDialog = async (groupId: string) => {
    try {
      // Fetch the group details first
      const result = await getProfileGroupWithMembers(groupId);
      
      if (result.success) {
        setCurrentGroup(result.data);
        
        // Fetch all profiles for selection
        await fetchProfiles();
        
        // Initialize selected IDs with current members
        const currentEntrepreneurIds = result.data.entrepreneurs.map(e => e.id);
        const currentInvestorIds = result.data.investors.map(i => i.id);
        
        setSelectedEntrepreneurIds(currentEntrepreneurIds);
        setSelectedInvestorIds(currentInvestorIds);
        
        setShowManageDialog(true);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to load group details',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error preparing to manage group:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group data',
        variant: 'destructive'
      });
    }
  };

  // Save changes to group members
  const handleSaveGroupMembers = async () => {
    if (!currentGroup) return;
    
    try {
      setProcessingAction(true);
      
      // Determine which entrepreneurs to add and which to remove
      const currentEntrepreneurIds = currentGroup.entrepreneurs.map(e => e.id);
      const toAddEntrepreneurs = selectedEntrepreneurIds.filter(id => !currentEntrepreneurIds.includes(id));
      const toRemoveEntrepreneurs = currentEntrepreneurIds.filter(id => !selectedEntrepreneurIds.includes(id));
      
      // Determine which investors to add and which to remove
      const currentInvestorIds = currentGroup.investors.map(i => i.id);
      const toAddInvestors = selectedInvestorIds.filter(id => !currentInvestorIds.includes(id));
      const toRemoveInvestors = currentInvestorIds.filter(id => !selectedInvestorIds.includes(id));
      
      // Perform the operations
      if (toAddEntrepreneurs.length > 0) {
        await addEntrepreneursToGroup(currentGroup.group.id, toAddEntrepreneurs);
      }
      
      if (toRemoveEntrepreneurs.length > 0) {
        await removeEntrepreneursFromGroup(currentGroup.group.id, toRemoveEntrepreneurs);
      }
      
      if (toAddInvestors.length > 0) {
        await addInvestorsToGroup(currentGroup.group.id, toAddInvestors);
      }
      
      if (toRemoveInvestors.length > 0) {
        await removeInvestorsFromGroup(currentGroup.group.id, toRemoveInvestors);
      }
      
      // Update the group details in state
      const updatedGroup = await getProfileGroupWithMembers(currentGroup.group.id);
      if (updatedGroup.success) {
        setCurrentGroup(updatedGroup.data);
      }
      
      setShowManageDialog(false);
      
      toast({
        title: 'Success',
        description: 'Group members updated successfully'
      });
    } catch (error) {
      console.error('Error updating group members:', error);
      toast({
        title: 'Error',
        description: 'Failed to update group members',
        variant: 'destructive'
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Toggle entrepreneur selection
  const toggleEntrepreneurSelection = (id: string) => {
    setSelectedEntrepreneurIds(prev => 
      prev.includes(id) 
        ? prev.filter(eId => eId !== id) 
        : [...prev, id]
    );
  };

  // Toggle investor selection
  const toggleInvestorSelection = (id: string) => {
    setSelectedInvestorIds(prev => 
      prev.includes(id) 
        ? prev.filter(iId => iId !== id) 
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Profile Groups</h2>
        <Button 
          onClick={() => setShowCreateDialog(true)} 
          size="sm"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p>Loading profile groups...</p>
        </div>
      ) : profileGroups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <UsersRound className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No profile groups yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create groups to organize your connections and collaborations.
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profileGroups.map(group => (
            <Card key={group.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle>{group.name}</CardTitle>
                  {!group.isPublic && (
                    <Badge variant="outline" className="bg-muted">Private</Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {group.description || 'No description'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="text-sm pb-3">
                <div className="flex items-center text-muted-foreground">
                  <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-3 bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewGroup(group.id)}
                >
                  View Details
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleOpenManageDialog(group.id)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setGroupToDelete(group.id);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Profile Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize your connections and collaborations
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input 
                id="name" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Enter a brief description"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="public" 
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Public Group</Label>
              <p className="text-xs text-muted-foreground ml-auto">
                {isPublic ? "Visible to other users" : "Only visible to you"}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGroup}
              disabled={processingAction || !newGroupName.trim()}
            >
              {processingAction ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Profile Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={processingAction}
            >
              {processingAction ? "Deleting..." : "Delete Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Group Details Dialog */}
      {currentGroup && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="text-lg">{currentGroup.group.name}</DialogTitle>
                {!currentGroup.group.isPublic && (
                  <Badge variant="outline" className="bg-muted">Private</Badge>
                )}
              </div>
              <DialogDescription>
                {currentGroup.group.description || 'No description'}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="entrepreneurs" className="mt-2 flex-1 overflow-hidden flex flex-col">
              <TabsList>
                <TabsTrigger value="entrepreneurs" className="flex gap-2">
                  <User className="h-4 w-4" />
                  <span>Entrepreneurs</span>
                  <Badge variant="secondary" className="ml-1">{currentGroup.entrepreneurs.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="investors" className="flex gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Investors</span>
                  <Badge variant="secondary" className="ml-1">{currentGroup.investors.length}</Badge>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="entrepreneurs" className="mt-3 flex-1 overflow-hidden">
                <ScrollArea className="h-[250px]">
                  {currentGroup.entrepreneurs.length > 0 ? (
                    <div className="space-y-3">
                      {currentGroup.entrepreneurs.map(entrepreneur => (
                        <div key={entrepreneur.id} className="flex items-center gap-2 p-2 border rounded-md">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entrepreneur.avatar || '/user-placeholder.png'} alt={entrepreneur.name} />
                            <AvatarFallback>{entrepreneur.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{entrepreneur.name}</div>
                            {entrepreneur.companyName && (
                              <div className="text-xs text-muted-foreground">{entrepreneur.companyName}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No entrepreneurs in this group
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="investors" className="mt-3 flex-1 overflow-hidden">
                <ScrollArea className="h-[250px]">
                  {currentGroup.investors.length > 0 ? (
                    <div className="space-y-3">
                      {currentGroup.investors.map(investor => (
                        <div key={investor.id} className="flex items-center gap-2 p-2 border rounded-md">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={investor.avatar || '/user-placeholder.png'} alt={investor.name} />
                            <AvatarFallback>{investor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{investor.name}</div>
                            {investor.firm && (
                              <div className="text-xs text-muted-foreground">{investor.firm}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No investors in this group
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            <div className="pt-4 flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                Created: {new Date(currentGroup.group.createdAt).toLocaleDateString()}
              </div>
              <Button 
                onClick={() => handleOpenManageDialog(currentGroup.group.id)}
                size="sm"
              >
                <Settings className="h-4 w-4 mr-1" />
                Manage Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Manage Group Members Dialog */}
      {currentGroup && (
        <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Manage Group: {currentGroup.group.name}</DialogTitle>
              <DialogDescription>
                Add or remove members from this group
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="entrepreneurs" className="mt-2 flex-1 overflow-hidden flex flex-col">
              <TabsList className="mb-2">
                <TabsTrigger value="entrepreneurs">Entrepreneurs</TabsTrigger>
                <TabsTrigger value="investors">Investors</TabsTrigger>
              </TabsList>
              
              <TabsContent value="entrepreneurs" className="overflow-hidden flex-1">
                <ScrollArea className="h-[300px] border rounded-md p-2">
                  <div className="space-y-2">
                    {entrepreneurs.length > 0 ? entrepreneurs.map(entrepreneur => (
                      <div key={entrepreneur.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                        <Checkbox
                          id={`entrepreneur-${entrepreneur.id}`}
                          checked={selectedEntrepreneurIds.includes(entrepreneur.id)}
                          onCheckedChange={() => toggleEntrepreneurSelection(entrepreneur.id)}
                        />
                        <div className="flex items-center gap-2 flex-1" onClick={() => toggleEntrepreneurSelection(entrepreneur.id)}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entrepreneur.avatar || '/user-placeholder.png'} alt={entrepreneur.name} />
                            <AvatarFallback>{entrepreneur.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Label htmlFor={`entrepreneur-${entrepreneur.id}`} className="font-medium cursor-pointer">
                              {entrepreneur.name}
                            </Label>
                            {entrepreneur.companyName && (
                              <p className="text-xs text-muted-foreground">{entrepreneur.companyName}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-muted-foreground py-8">
                        No entrepreneurs available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="investors" className="overflow-hidden flex-1">
                <ScrollArea className="h-[300px] border rounded-md p-2">
                  <div className="space-y-2">
                    {investors.length > 0 ? investors.map(investor => (
                      <div key={investor.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                        <Checkbox
                          id={`investor-${investor.id}`}
                          checked={selectedInvestorIds.includes(investor.id)}
                          onCheckedChange={() => toggleInvestorSelection(investor.id)}
                        />
                        <div className="flex items-center gap-2 flex-1" onClick={() => toggleInvestorSelection(investor.id)}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={investor.avatar || '/user-placeholder.png'} alt={investor.name} />
                            <AvatarFallback>{investor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Label htmlFor={`investor-${investor.id}`} className="font-medium cursor-pointer">
                              {investor.name}
                            </Label>
                            {investor.firm && (
                              <p className="text-xs text-muted-foreground">{investor.firm}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-muted-foreground py-8">
                        No investors available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowManageDialog(false)}
                disabled={processingAction}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveGroupMembers}
                disabled={processingAction}
              >
                {processingAction ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}