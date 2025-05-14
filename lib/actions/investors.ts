'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { investors, type InsertInvestor, type Investor } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth.config";
import { createId } from '@paralleldrive/cuid2';

/**
 * Create or update investor profile
 */
export async function upsertInvestorProfile(investorData: Omit<InsertInvestor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      throw new Error('Unauthorized');
    }

    // Generate a slug if one isn't provided
    if (!investorData.slug && investorData.name) {
      // Convert name to lowercase, replace spaces with hyphens, and remove special characters
      investorData.slug = investorData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');
    }

    // Check if profile exists
    const existingInvestor = await db.query.investors.findFirst({
      where: eq(investors.userId, session.user.id)
    });

    if (existingInvestor) {
      // Update existing profile
      await db
        .update(investors)
        .set({
          ...investorData,
          updatedAt: new Date()
        })
        .where(eq(investors.userId, session.user.id));
      
      revalidatePath('/profile/investor');
      revalidatePath(`/profile/investor/${existingInvestor.slug}`);
      
      return { success: true, message: 'Profile updated' };
    } else {
      // Create new profile
      const newInvestor = await db
        .insert(investors)
        .values({
          id: createId(),
          userId: session.user.id,
          ...investorData,
          updatedAt: new Date(),
          createdAt: new Date()
        })
        .returning();
      
      revalidatePath('/profile/investor');
      
      return { success: true, message: 'Profile created', data: newInvestor[0] };
    }
  } catch (error) {
    console.error('Error upserting investor profile:', error);
    return { success: false, message: 'Failed to save profile', error };
  }
}

/**
 * Get investor profile by ID or slug
 */
export async function getInvestorProfile(idOrSlug: string) {
  try {
    // First try to find by ID
    let investor = await db.query.investors.findFirst({
      where: eq(investors.id, idOrSlug)
    });

    // If not found, try finding by slug
    if (!investor) {
      investor = await db.query.investors.findFirst({
        where: eq(investors.slug, idOrSlug)
      });
    }

    // If still not found, try finding by firm name
    if (!investor) {
      investor = await db.query.investors.findFirst({
        where: eq(investors.firmName, idOrSlug)
      });
    }

    if (!investor) {
      return { success: false, message: 'Investor profile not found' };
    }

    return { success: true, data: investor };
  } catch (error) {
    console.error('Error fetching investor profile:', error);
    return { success: false, message: 'Failed to fetch profile', error };
  }
}

/**
 * Get current user's investor profile
 */
export async function getMyInvestorProfile() {
  try {
    console.log("Starting getMyInvestorProfile");
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      console.error("No authenticated session found in getMyInvestorProfile");
      return { success: false, message: 'Unauthorized' };
    }
    
    console.log(`Fetching investor profile for user ${session.user.id}`);

    const investor = await db.query.investors.findFirst({
      where: eq(investors.userId, session.user.id)
    });

    if (!investor) {
      console.log(`No investor profile found for user ${session.user.id}`);
      return { success: false, message: 'Investor profile not found' };
    }
    
    console.log(`Found investor profile with ID: ${investor.id}`);

    return { success: true, data: investor };
  } catch (error) {
    console.error('Error fetching own investor profile:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to fetch profile',
    };
  }
}

/**
 * List all investor profiles
 */
export async function listInvestorProfiles() {
  try {
    const result = await db.query.investors.findMany();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error listing investor profiles:', error);
    return { success: false, message: 'Failed to fetch profiles', error };
  }
}

/**
 * Delete investor profile
 */
export async function deleteInvestorProfile() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      throw new Error('Unauthorized');
    }

    await db
      .delete(investors)
      .where(eq(investors.userId, session.user.id));
    
    revalidatePath('/profile/investor');
    
    return { success: true, message: 'Profile deleted' };
  } catch (error) {
    console.error('Error deleting investor profile:', error);
    return { success: false, message: 'Failed to delete profile', error };
  }
}