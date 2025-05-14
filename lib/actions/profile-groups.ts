'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { 
  profileGroups, 
  profileGroupEntrepreneurs, 
  profileGroupInvestors,
  type InsertProfileGroup,
  type ProfileGroup,
  type InsertProfileGroupEntrepreneur,
  type InsertProfileGroupInvestor
} from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth.config";
import { entrepreneurs } from '@/db/schema/entrepreneurs';
import { investors } from '@/db/schema/investors';
import { createId } from '@paralleldrive/cuid2';

/**
 * Create a new profile group
 */
export async function createProfileGroup(data: Omit<InsertProfileGroup, 'id' | 'createdById' | 'createdByType' | 'createdAt' | 'updatedAt'>, createdByType: 'investor' | 'entrepreneur') {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Determine if the user exists as the specified type
    if (createdByType === 'investor') {
      const investor = await db.query.investors.findFirst({
        where: eq(investors.userId, session.user.id),
      });
      
      if (!investor) {
        return { success: false, message: 'Investor profile not found' };
      }
      
      const newGroup = await db.insert(profileGroups).values({
        id: createId(),
        ...data,
        createdById: investor.id,
        createdByType: 'investor',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      revalidatePath('/dashboard/investor');
      
      return { success: true, data: newGroup[0], message: 'Group created successfully' };
    } 
    else {
      const entrepreneur = await db.query.entrepreneurs.findFirst({
        where: eq(entrepreneurs.userId, session.user.id),
      });
      
      if (!entrepreneur) {
        return { success: false, message: 'Entrepreneur profile not found' };
      }
      
      const newGroup = await db.insert(profileGroups).values({
        id: createId(),
        ...data,
        createdById: entrepreneur.id,
        createdByType: 'entrepreneur',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      revalidatePath('/dashboard/entrepreneur');
      
      return { success: true, data: newGroup[0], message: 'Group created successfully' };
    }
  } catch (error) {
    console.error('Error creating profile group:', error);
    return { success: false, message: 'Failed to create group', error };
  }
}

/**
 * Update an existing profile group
 */
export async function updateProfileGroup(id: string, data: Partial<Omit<InsertProfileGroup, 'id' | 'createdById' | 'createdByType' | 'createdAt' | 'updatedAt'>>) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Find the group
    const group = await db.query.profileGroups.findFirst({
      where: eq(profileGroups.id, id),
    });
    
    if (!group) {
      return { success: false, message: 'Group not found' };
    }

    // Check ownership - find if the user owns this group (either as investor or entrepreneur)
    let hasPermission = false;
    
    if (group.createdByType === 'investor') {
      const investor = await db.query.investors.findFirst({
        where: eq(investors.userId, session.user.id),
      });
      
      if (investor && investor.id === group.createdById) {
        hasPermission = true;
      }
    } else {
      const entrepreneur = await db.query.entrepreneurs.findFirst({
        where: eq(entrepreneurs.userId, session.user.id),
      });
      
      if (entrepreneur && entrepreneur.id === group.createdById) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return { success: false, message: 'You do not have permission to update this group' };
    }
    
    // Update the group
    await db.update(profileGroups)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(profileGroups.id, id));
    
    // Revalidate the appropriate path based on user type
    revalidatePath(`/dashboard/${group.createdByType}`);
    
    return { success: true, message: 'Group updated successfully' };
  } catch (error) {
    console.error('Error updating profile group:', error);
    return { success: false, message: 'Failed to update group', error };
  }
}

/**
 * Delete a profile group
 */
export async function deleteProfileGroup(id: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }
    
    // Find the group
    const group = await db.query.profileGroups.findFirst({
      where: eq(profileGroups.id, id),
    });
    
    if (!group) {
      return { success: false, message: 'Group not found' };
    }

    // Check ownership - find if the user owns this group (either as investor or entrepreneur)
    let hasPermission = false;
    
    if (group.createdByType === 'investor') {
      const investor = await db.query.investors.findFirst({
        where: eq(investors.userId, session.user.id),
      });
      
      if (investor && investor.id === group.createdById) {
        hasPermission = true;
      }
    } else {
      const entrepreneur = await db.query.entrepreneurs.findFirst({
        where: eq(entrepreneurs.userId, session.user.id),
      });
      
      if (entrepreneur && entrepreneur.id === group.createdById) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return { success: false, message: 'You do not have permission to delete this group' };
    }
    
    // Delete the group (cascade will handle deleting members)
    await db.delete(profileGroups).where(eq(profileGroups.id, id));
    
    // Revalidate the appropriate path based on user type
    revalidatePath(`/dashboard/${group.createdByType}`);
    
    return { success: true, message: 'Group deleted successfully' };
  } catch (error) {
    console.error('Error deleting profile group:', error);
    return { success: false, message: 'Failed to delete group', error };
  }
}

/**
 * Get all profile groups created by the current user
 */
export async function getMyProfileGroups() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Find the user's profile ID as both types
    const investorProfile = await db.query.investors.findFirst({
      where: eq(investors.userId, session.user.id),
    });
    
    const entrepreneurProfile = await db.query.entrepreneurs.findFirst({
      where: eq(entrepreneurs.userId, session.user.id),
    });
    
    if (!investorProfile && !entrepreneurProfile) {
      return { success: false, message: 'No profile found' };
    }

    let groups: ProfileGroup[] = [];
    
    if (investorProfile) {
      const investorGroups = await db.query.profileGroups.findMany({
        where: and(
          eq(profileGroups.createdById, investorProfile.id),
          eq(profileGroups.createdByType, 'investor')
        ),
        orderBy: (profileGroups, { desc }) => [desc(profileGroups.updatedAt)]
      });
      
      groups = [...groups, ...investorGroups];
    }
    
    if (entrepreneurProfile) {
      const entrepreneurGroups = await db.query.profileGroups.findMany({
        where: and(
          eq(profileGroups.createdById, entrepreneurProfile.id),
          eq(profileGroups.createdByType, 'entrepreneur')
        ),
        orderBy: (profileGroups, { desc }) => [desc(profileGroups.updatedAt)]
      });
      
      groups = [...groups, ...entrepreneurGroups];
    }

    return { success: true, data: groups };
  } catch (error) {
    console.error('Error fetching profile groups:', error);
    return { success: false, message: 'Failed to fetch groups', error };
  }
}

/**
 * Get a specific profile group by id with its members
 */
export async function getProfileGroupWithMembers(groupId: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Find the group
    const group = await db.query.profileGroups.findFirst({
      where: eq(profileGroups.id, groupId),
    });
    
    if (!group) {
      return { success: false, message: 'Group not found' };
    }

    // Check if the user is the owner or if the group is public
    let hasPermission = group.isPublic;
    
    if (!hasPermission) {
      if (group.createdByType === 'investor') {
        const investor = await db.query.investors.findFirst({
          where: eq(investors.userId, session.user.id),
        });
        
        if (investor && investor.id === group.createdById) {
          hasPermission = true;
        }
      } else {
        const entrepreneur = await db.query.entrepreneurs.findFirst({
          where: eq(entrepreneurs.userId, session.user.id),
        });
        
        if (entrepreneur && entrepreneur.id === group.createdById) {
          hasPermission = true;
        }
      }
    }
    
    if (!hasPermission) {
      return { success: false, message: 'You do not have permission to view this group' };
    }

    // Get the group members based on type
    let entrepreneurMembers: any[] = [];
    let investorMembers: any[] = [];
    
    // Get entrepreneur members if any
    const entrepreneurRelations = await db.query.profileGroupEntrepreneurs.findMany({
      where: eq(profileGroupEntrepreneurs.groupId, groupId),
    });
    
    if (entrepreneurRelations.length > 0) {
      const entrepreneurIds = entrepreneurRelations.map(r => r.entrepreneurId);
      entrepreneurMembers = await db.query.entrepreneurs.findMany({
        where: inArray(entrepreneurs.id, entrepreneurIds),
      });
    }
    
    // Get investor members if any
    const investorRelations = await db.query.profileGroupInvestors.findMany({
      where: eq(profileGroupInvestors.groupId, groupId),
    });
    
    if (investorRelations.length > 0) {
      const investorIds = investorRelations.map(r => r.investorId);
      investorMembers = await db.query.investors.findMany({
        where: inArray(investors.id, investorIds),
      });
    }
    
    return { 
      success: true, 
      data: {
        group,
        entrepreneurs: entrepreneurMembers,
        investors: investorMembers
      }
    };
  } catch (error) {
    console.error('Error fetching profile group with members:', error);
    return { success: false, message: 'Failed to fetch group details', error };
  }
}

/**
 * Add entrepreneurs to a profile group
 */
export async function addEntrepreneursToGroup(groupId: string, entrepreneurIds: string[]) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Find the group
    const group = await db.query.profileGroups.findFirst({
      where: eq(profileGroups.id, groupId),
    });
    
    if (!group) {
      return { success: false, message: 'Group not found' };
    }

    // Check ownership - find if the user owns this group
    let hasPermission = false;
    
    if (group.createdByType === 'investor') {
      const investor = await db.query.investors.findFirst({
        where: eq(investors.userId, session.user.id),
      });
      
      if (investor && investor.id === group.createdById) {
        hasPermission = true;
      }
    } else {
      const entrepreneur = await db.query.entrepreneurs.findFirst({
        where: eq(entrepreneurs.userId, session.user.id),
      });
      
      if (entrepreneur && entrepreneur.id === group.createdById) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return { success: false, message: 'You do not have permission to modify this group' };
    }

    // Get existing entries to avoid duplicates
    const existingEntries = await db.query.profileGroupEntrepreneurs.findMany({
      where: and(
        eq(profileGroupEntrepreneurs.groupId, groupId),
        inArray(profileGroupEntrepreneurs.entrepreneurId, entrepreneurIds)
      ),
    });
    
    const existingEntrepreneurIds = new Set(existingEntries.map(e => e.entrepreneurId));
    const newEntrepreneurIds = entrepreneurIds.filter(id => !existingEntrepreneurIds.has(id));
    
    if (newEntrepreneurIds.length === 0) {
      return { success: true, message: 'No new entrepreneurs to add' };
    }
    
    // Add the new entrepreneurs
    const valuesToInsert = newEntrepreneurIds.map(entrepreneurId => ({
      groupId,
      entrepreneurId,
      addedAt: new Date()
    }));
    
    await db.insert(profileGroupEntrepreneurs).values(valuesToInsert);
    
    // Revalidate the appropriate path based on user type
    revalidatePath(`/dashboard/${group.createdByType}`);
    
    return { success: true, message: `Added ${newEntrepreneurIds.length} entrepreneurs to the group` };
  } catch (error) {
    console.error('Error adding entrepreneurs to group:', error);
    return { success: false, message: 'Failed to add entrepreneurs to group', error };
  }
}

/**
 * Add investors to a profile group
 */
export async function addInvestorsToGroup(groupId: string, investorIds: string[]) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Find the group
    const group = await db.query.profileGroups.findFirst({
      where: eq(profileGroups.id, groupId),
    });
    
    if (!group) {
      return { success: false, message: 'Group not found' };
    }

    // Check ownership - find if the user owns this group
    let hasPermission = false;
    
    if (group.createdByType === 'investor') {
      const investor = await db.query.investors.findFirst({
        where: eq(investors.userId, session.user.id),
      });
      
      if (investor && investor.id === group.createdById) {
        hasPermission = true;
      }
    } else {
      const entrepreneur = await db.query.entrepreneurs.findFirst({
        where: eq(entrepreneurs.userId, session.user.id),
      });
      
      if (entrepreneur && entrepreneur.id === group.createdById) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return { success: false, message: 'You do not have permission to modify this group' };
    }

    // Get existing entries to avoid duplicates
    const existingEntries = await db.query.profileGroupInvestors.findMany({
      where: and(
        eq(profileGroupInvestors.groupId, groupId),
        inArray(profileGroupInvestors.investorId, investorIds)
      ),
    });
    
    const existingInvestorIds = new Set(existingEntries.map(e => e.investorId));
    const newInvestorIds = investorIds.filter(id => !existingInvestorIds.has(id));
    
    if (newInvestorIds.length === 0) {
      return { success: true, message: 'No new investors to add' };
    }
    
    // Add the new investors
    const valuesToInsert = newInvestorIds.map(investorId => ({
      groupId,
      investorId,
      addedAt: new Date()
    }));
    
    await db.insert(profileGroupInvestors).values(valuesToInsert);
    
    // Revalidate the appropriate path based on user type
    revalidatePath(`/dashboard/${group.createdByType}`);
    
    return { success: true, message: `Added ${newInvestorIds.length} investors to the group` };
  } catch (error) {
    console.error('Error adding investors to group:', error);
    return { success: false, message: 'Failed to add investors to group', error };
  }
}

/**
 * Remove entrepreneurs from a profile group
 */
export async function removeEntrepreneursFromGroup(groupId: string, entrepreneurIds: string[]) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Find the group
    const group = await db.query.profileGroups.findFirst({
      where: eq(profileGroups.id, groupId),
    });
    
    if (!group) {
      return { success: false, message: 'Group not found' };
    }

    // Check ownership - find if the user owns this group
    let hasPermission = false;
    
    if (group.createdByType === 'investor') {
      const investor = await db.query.investors.findFirst({
        where: eq(investors.userId, session.user.id),
      });
      
      if (investor && investor.id === group.createdById) {
        hasPermission = true;
      }
    } else {
      const entrepreneur = await db.query.entrepreneurs.findFirst({
        where: eq(entrepreneurs.userId, session.user.id),
      });
      
      if (entrepreneur && entrepreneur.id === group.createdById) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return { success: false, message: 'You do not have permission to modify this group' };
    }
    
    // Remove the entrepreneurs
    await db.delete(profileGroupEntrepreneurs).where(
      and(
        eq(profileGroupEntrepreneurs.groupId, groupId),
        inArray(profileGroupEntrepreneurs.entrepreneurId, entrepreneurIds)
      )
    );
    
    // Revalidate the appropriate path based on user type
    revalidatePath(`/dashboard/${group.createdByType}`);
    
    return { success: true, message: 'Entrepreneurs removed from the group' };
  } catch (error) {
    console.error('Error removing entrepreneurs from group:', error);
    return { success: false, message: 'Failed to remove entrepreneurs from group', error };
  }
}

/**
 * Remove investors from a profile group
 */
export async function removeInvestorsFromGroup(groupId: string, investorIds: string[]) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Find the group
    const group = await db.query.profileGroups.findFirst({
      where: eq(profileGroups.id, groupId),
    });
    
    if (!group) {
      return { success: false, message: 'Group not found' };
    }

    // Check ownership - find if the user owns this group
    let hasPermission = false;
    
    if (group.createdByType === 'investor') {
      const investor = await db.query.investors.findFirst({
        where: eq(investors.userId, session.user.id),
      });
      
      if (investor && investor.id === group.createdById) {
        hasPermission = true;
      }
    } else {
      const entrepreneur = await db.query.entrepreneurs.findFirst({
        where: eq(entrepreneurs.userId, session.user.id),
      });
      
      if (entrepreneur && entrepreneur.id === group.createdById) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return { success: false, message: 'You do not have permission to modify this group' };
    }
    
    // Remove the investors
    await db.delete(profileGroupInvestors).where(
      and(
        eq(profileGroupInvestors.groupId, groupId),
        inArray(profileGroupInvestors.investorId, investorIds)
      )
    );
    
    // Revalidate the appropriate path based on user type
    revalidatePath(`/dashboard/${group.createdByType}`);
    
    return { success: true, message: 'Investors removed from the group' };
  } catch (error) {
    console.error('Error removing investors from group:', error);
    return { success: false, message: 'Failed to remove investors from group', error };
  }
}