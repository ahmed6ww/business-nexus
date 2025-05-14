'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { entrepreneurs, type InsertEntrepreneur, type Entrepreneur } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth.config";
import { createId } from '@paralleldrive/cuid2';

/**
 * Create or update entrepreneur profile
 */
export async function upsertEntrepreneurProfile(entrepreneurData: Omit<InsertEntrepreneur, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      throw new Error('Unauthorized');
    }

    // Generate a slug if one isn't provided
    if (!entrepreneurData.slug && entrepreneurData.name) {
      // Convert name to lowercase, replace spaces with hyphens, and remove special characters
      entrepreneurData.slug = entrepreneurData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');
    }

    // Check if profile exists
    const existingEntrepreneur = await db.query.entrepreneurs.findFirst({
      where: eq(entrepreneurs.userId, session.user.id)
    });

    if (existingEntrepreneur) {
      // Update existing profile
      await db
        .update(entrepreneurs)
        .set({
          ...entrepreneurData,
          updatedAt: new Date()
        })
        .where(eq(entrepreneurs.userId, session.user.id));
      
      revalidatePath('/profile/entrepreneur');
      revalidatePath(`/profile/entrepreneur/${existingEntrepreneur.slug}`);
      
      return { success: true, message: 'Profile updated' };
    } else {
      // Create new profile
      const newEntrepreneur = await db
        .insert(entrepreneurs)
        .values({
          id: createId(),
          userId: session.user.id,
          ...entrepreneurData,
          updatedAt: new Date(),
          createdAt: new Date()
        })
        .returning();
      
      revalidatePath('/profile/entrepreneur');
      
      return { success: true, message: 'Profile created', data: newEntrepreneur[0] };
    }
  } catch (error) {
    console.error('Error upserting entrepreneur profile:', error);
    return { success: false, message: 'Failed to save profile', error };
  }
}

/**
 * Get entrepreneur profile by ID or slug
 */
export async function getEntrepreneurProfile(idOrSlug: string) {
  try {
    // First try to find by ID
    let entrepreneur = await db.query.entrepreneurs.findFirst({
      where: eq(entrepreneurs.id, idOrSlug)
    });

    // If not found, try finding by slug
    if (!entrepreneur) {
      entrepreneur = await db.query.entrepreneurs.findFirst({
        where: eq(entrepreneurs.slug, idOrSlug)
      });
    }

    // If still not found, try finding by company name
    if (!entrepreneur) {
      entrepreneur = await db.query.entrepreneurs.findFirst({
        where: eq(entrepreneurs.companyName, idOrSlug)
      });
    }

    if (!entrepreneur) {
      return { success: false, message: 'Entrepreneur profile not found' };
    }

    return { success: true, data: entrepreneur };
  } catch (error) {
    console.error('Error fetching entrepreneur profile:', error);
    return { success: false, message: 'Failed to fetch profile', error };
  }
}

/**
 * Get current user's entrepreneur profile
 */
export async function getMyEntrepreneurProfile() {
  try {
    console.log("Starting getMyEntrepreneurProfile");
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      console.error("No authenticated session found in getMyEntrepreneurProfile");
      return { success: false, message: 'Unauthorized' };
    }
    
    console.log(`Fetching entrepreneur profile for user ${session.user.id}`);
    
    const entrepreneur = await db.query.entrepreneurs.findFirst({
      where: eq(entrepreneurs.userId, session.user.id)
    });
    
    if (!entrepreneur) {
      console.log(`No entrepreneur profile found for user ${session.user.id}`);
      return { success: false, message: 'Entrepreneur profile not found' };
    }
    
    console.log(`Found entrepreneur profile with ID: ${entrepreneur.id}`);
    
    return { success: true, data: entrepreneur };
  } catch (error) {
    console.error('Error fetching own entrepreneur profile:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to fetch profile',
    };
  }
}

/**
 * List all entrepreneur profiles
 */
export async function listEntrepreneurProfiles() {
  try {
    const result = await db.query.entrepreneurs.findMany();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error listing entrepreneur profiles:', error);
    return { success: false, message: 'Failed to fetch profiles', error };
  }
}

/**
 * Delete entrepreneur profile
 */
export async function deleteEntrepreneurProfile() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      throw new Error('Unauthorized');
    }

    await db
      .delete(entrepreneurs)
      .where(eq(entrepreneurs.userId, session.user.id));
    
    revalidatePath('/profile/entrepreneur');
    
    return { success: true, message: 'Profile deleted' };
  } catch (error) {
    console.error('Error deleting entrepreneur profile:', error);
    return { success: false, message: 'Failed to delete profile', error };
  }
}