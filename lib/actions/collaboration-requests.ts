'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { 
  collaborationRequests, 
  entrepreneurs, 
  investors, 
  users,
  requestStatusEnum
} from '@/db/schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth.config";
import { createId } from '@paralleldrive/cuid2';
import { getMyEntrepreneurProfile } from './entrepreneurs';
import { getMyInvestorProfile } from './investors';
import { z } from 'zod';

// Type for the data returned in the collaboration requests
export type CollaborationRequestWithDetails = {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  message?: string | null;
  investor: {
    id: string;
    name: string;
    avatar?: string | null;
    role?: string | null;
    firmName?: string | null;
  };
  entrepreneur: {
    id: string;
    name: string;
    avatar?: string | null;
    companyName?: string | null;
  };
};

// Types
export type CollaborationRequestStatus = 'pending' | 'accepted' | 'rejected';

// Schema for creating collaboration requests
const createCollaborationRequestSchema = z.object({
  entrepreneurId: z.string(),
  message: z.string().optional(),
});

// Schema for updating request status
const updateRequestStatusSchema = z.object({
  requestId: z.string(),
  status: z.enum(['pending', 'accepted', 'rejected']),
});

/**
 * Create a new collaboration request from investor to entrepreneur
 */
export async function createCollaborationRequest(data: z.infer<typeof createCollaborationRequestSchema>) {
  try {
    // Validate input
    const validatedData = createCollaborationRequestSchema.parse(data);
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, message: 'Unauthorized' };
    }
    
    console.log(`Creating collaboration request from user ${session.user.id} to entrepreneur ${validatedData.entrepreneurId}`);
    
    // Get investor profile
    const investorResult = await getMyInvestorProfile();
    if (!investorResult.success || !investorResult.data) {
      console.error(`Failed to get investor profile for user ${session.user.id}:`, investorResult.message);
      return { success: false, message: 'You must create an investor profile before sending collaboration requests' };
    }
    
    // Check if request already exists
    const existingRequest = await db.query.collaborationRequests.findFirst({
      where: and(
        eq(collaborationRequests.investorId, investorResult.data.id),
        eq(collaborationRequests.entrepreneurId, validatedData.entrepreneurId)
      ),
    });
    
    if (existingRequest) {
      console.log(`Request already exists: ${existingRequest.id}, status: ${existingRequest.status}`);
      return { success: false, message: 'You have already sent a request to this entrepreneur' };
    }
    
    // Create new request
    const [newRequest] = await db.insert(collaborationRequests).values({
      investorId: investorResult.data.id,
      entrepreneurId: validatedData.entrepreneurId,
      status: 'pending',
      message: validatedData.message,
    }).returning();
    
    console.log(`Created new collaboration request: ${newRequest.id}`);
    
    return { success: true, data: newRequest };
  } catch (error) {
    console.error('Error creating collaboration request:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

/**
 * Get collaboration requests for the current entrepreneur
 */
export async function getMyCollaborationRequests() {
  try {
    console.log("Starting getMyCollaborationRequests");
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.error("No authenticated session found");
      return { success: false, message: 'Unauthorized' };
    }
    
    console.log(`Fetching collaboration requests for user ${session.user.id}`);
    
    // Get entrepreneur profile
    const entrepreneurResult = await getMyEntrepreneurProfile();
    
    if (!entrepreneurResult.success) {
      console.error(`Failed to get entrepreneur profile for user ${session.user.id}:`, entrepreneurResult.message);
      return { success: false, message: entrepreneurResult.message };
    }
    
    if (!entrepreneurResult.data) {
      console.error(`No entrepreneur profile found for user ${session.user.id}`);
      return { success: false, message: 'Entrepreneur profile not found' };
    }
    
    const entrepreneurId = entrepreneurResult.data.id;
    console.log(`Found entrepreneur profile with ID: ${entrepreneurId}`);
    
    // First let's do a direct count to confirm collaboration requests exist
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(collaborationRequests)
      .where(eq(collaborationRequests.entrepreneurId, entrepreneurId));
    
    const totalRequests = Number(countResult[0]?.count || 0);
    console.log(`Direct count query found ${totalRequests} requests for entrepreneur ${entrepreneurId}`);
    
    // If we have requests, start with the simple approach to get them
    if (totalRequests > 0) {
      console.log("Fetching requests with simple query first");
      
      // Try a simpler query without joins first
      const simpleRequests = await db.select()
        .from(collaborationRequests)
        .where(eq(collaborationRequests.entrepreneurId, entrepreneurId))
        .orderBy(desc(collaborationRequests.createdAt));
      
      console.log(`Simple query found ${simpleRequests.length} requests`);
      
      if (simpleRequests.length > 0) {
        // If we got results with the simple query, then manually join with investors
        const investorIds = simpleRequests.map(req => req.investorId);
        console.log("Investor IDs to lookup:", investorIds);
        
        const investorsData = await db.select()
          .from(investors)
          .where(inArray(investors.id, investorIds));
        
        console.log(`Found ${investorsData.length} investors for manual join`);
        
        // Create a lookup map
        const investorMap = new Map();
        investorsData.forEach(inv => investorMap.set(inv.id, inv));
        
        // Map the results manually
        const mappedRequests = simpleRequests.map(request => {
          const investor = investorMap.get(request.investorId) || { 
            id: request.investorId,
            name: "Unknown Investor",
          };
          
          return {
            id: request.id,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            message: request.message,
            investor: {
              id: investor.id,
              name: investor.name || "Unknown Investor",
              avatar: investor.avatar,
              role: investor.role,
              firmName: investor.firmName,
            }
          };
        });
        
        console.log("Successfully created manually mapped requests:", mappedRequests);
        return { success: true, data: mappedRequests };
      }
    }
    
    // Only try the join approach if simpler approach didn't work
    console.log("Simple query didn't return results, trying join query instead");
    
    // Use a more direct query approach instead of relying on the relation system
    const requests = await db.select({
      id: collaborationRequests.id,
      status: collaborationRequests.status,
      createdAt: collaborationRequests.createdAt,
      updatedAt: collaborationRequests.updatedAt,
      message: collaborationRequests.message,
      investorId: investors.id,
      investorName: investors.name,
      investorAvatar: investors.avatar,
      investorRole: investors.role,
      investorFirmName: investors.firmName,
    })
    .from(collaborationRequests)
    .leftJoin(investors, eq(collaborationRequests.investorId, investors.id))
    .where(eq(collaborationRequests.entrepreneurId, entrepreneurId))
    .orderBy(desc(collaborationRequests.createdAt));
    
    console.log(`Found ${requests.length} collaboration requests for entrepreneur ${entrepreneurId}`);
    
    // Map the joined results to our expected format
    const mappedRequests = requests.map(request => ({
      id: request.id,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      message: request.message,
      investor: {
        id: request.investorId,
        name: request.investorName || "Unknown Investor",
        avatar: request.investorAvatar,
        role: request.investorRole,
        firmName: request.investorFirmName,
      }
    }));
    
    console.log("Final mapped requests:", mappedRequests);
    return { success: true, data: mappedRequests };
  } catch (error) {
    console.error('Error fetching collaboration requests:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

/**
 * Get sent collaboration requests for the current investor
 */
export async function getMySentRequests() {
  try {
    console.log("Starting getMySentRequests");
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.error("No authenticated session found");
      return { success: false, message: 'Unauthorized' };
    }
    
    console.log(`Fetching sent collaboration requests for user ${session.user.id}`);
    
    // Get investor profile
    const investorResult = await getMyInvestorProfile();
    
    if (!investorResult.success || !investorResult.data) {
      console.error(`Failed to get investor profile for user ${session.user.id}:`, investorResult.message);
      return { success: false, message: 'You must create an investor profile before fetching sent collaboration requests' };
    }
    
    const investorId = investorResult.data.id;
    console.log(`Found investor profile with ID: ${investorId}`);
    
    // First let's do a direct count to confirm collaboration requests exist
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(collaborationRequests)
      .where(eq(collaborationRequests.investorId, investorId));
    
    const totalRequests = Number(countResult[0]?.count || 0);
    console.log(`Direct count query found ${totalRequests} requests for investor ${investorId}`);
    
    // If we have requests, start with the simple approach to get them
    if (totalRequests > 0) {
      console.log("Fetching requests with simple query first");
      
      // Try a simpler query without joins first
      const simpleRequests = await db.select()
        .from(collaborationRequests)
        .where(eq(collaborationRequests.investorId, investorId))
        .orderBy(desc(collaborationRequests.createdAt));
      
      console.log(`Simple query found ${simpleRequests.length} requests`);
      
      if (simpleRequests.length > 0) {
        // If we got results with the simple query, then manually join with entrepreneurs
        const entrepreneurIds = simpleRequests.map(req => req.entrepreneurId);
        console.log("Entrepreneur IDs to lookup:", entrepreneurIds);
        
        const entrepreneursData = await db.select()
          .from(entrepreneurs)
          .where(inArray(entrepreneurs.id, entrepreneurIds));
        
        console.log(`Found ${entrepreneursData.length} entrepreneurs for manual join`);
        
        // Create a lookup map
        const entrepreneurMap = new Map();
        entrepreneursData.forEach(ent => entrepreneurMap.set(ent.id, ent));
        
        // Map the results manually
        const mappedRequests = simpleRequests.map(request => {
          const entrepreneur = entrepreneurMap.get(request.entrepreneurId) || { 
            id: request.entrepreneurId,
            name: "Unknown Entrepreneur",
          };
          
          return {
            id: request.id,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            message: request.message,
            entrepreneur: {
              id: entrepreneur.id,
              name: entrepreneur.name || "Unknown Entrepreneur",
              avatar: entrepreneur.avatar,
              companyName: entrepreneur.companyName,
            }
          };
        });
        
        console.log("Successfully created manually mapped requests:", mappedRequests);
        return { success: true, data: mappedRequests };
      }
    }
    
    // Only try the join approach if simpler approach didn't work
    console.log("Simple query didn't return results, trying join query instead");
    
    // Use a more direct query approach instead of relying on the relation system
    const requests = await db.select({
      id: collaborationRequests.id,
      status: collaborationRequests.status,
      createdAt: collaborationRequests.createdAt,
      updatedAt: collaborationRequests.updatedAt,
      message: collaborationRequests.message,
      entrepreneurId: entrepreneurs.id,
      entrepreneurName: entrepreneurs.name,
      entrepreneurAvatar: entrepreneurs.avatar,
      entrepreneurCompanyName: entrepreneurs.companyName,
    })
    .from(collaborationRequests)
    .leftJoin(entrepreneurs, eq(collaborationRequests.entrepreneurId, entrepreneurs.id))
    .where(eq(collaborationRequests.investorId, investorId))
    .orderBy(desc(collaborationRequests.createdAt));
    
    console.log(`Found ${requests.length} sent collaboration requests for investor ${investorId}`);
    
    // Map the joined results to our expected format
    const mappedRequests = requests.map(request => ({
      id: request.id,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      message: request.message,
      entrepreneur: {
        id: request.entrepreneurId,
        name: request.entrepreneurName || "Unknown Entrepreneur",
        avatar: request.entrepreneurAvatar,
        companyName: request.entrepreneurCompanyName,
      }
    }));
    
    console.log("Final mapped requests:", mappedRequests);
    return { success: true, data: mappedRequests };
  } catch (error) {
    console.error('Error fetching sent collaboration requests:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

/**
 * Update the status of a collaboration request (accept or reject)
 * This can only be done by the entrepreneur who received the request
 */
export async function updateRequestStatus(data: z.infer<typeof updateRequestStatusSchema>) {
  try {
    console.log(`Starting updateRequestStatus for request ${data.requestId} to status ${data.status}`);
    
    // Validate input
    const validatedData = updateRequestStatusSchema.parse(data);
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.error("No authenticated session found");
      return { success: false, message: 'Unauthorized' };
    }
    
    console.log(`Updating request ${validatedData.requestId} status to ${validatedData.status} by user ${session.user.id}`);
    
    // Get entrepreneur profile (only entrepreneurs can update request status)
    const entrepreneurResult = await getMyEntrepreneurProfile();
    
    if (!entrepreneurResult.success || !entrepreneurResult.data) {
      console.error(`Failed to get entrepreneur profile for user ${session.user.id}:`, entrepreneurResult.message);
      return { success: false, message: 'You must have an entrepreneur profile to update request status' };
    }
    
    // Find the request
    const request = await db.query.collaborationRequests.findFirst({
      where: eq(collaborationRequests.id, validatedData.requestId),
    });
    
    if (!request) {
      console.error(`Request ${validatedData.requestId} not found`);
      return { success: false, message: 'Collaboration request not found' };
    }
    
    // Check if the user is the entrepreneur who received this request
    if (request.entrepreneurId !== entrepreneurResult.data.id) {
      console.error(`User ${session.user.id} is not authorized to update request ${validatedData.requestId}`);
      return { success: false, message: 'You are not authorized to update this request' };
    }
    
    // Update the request status
    const now = new Date();
    const [updatedRequest] = await db.update(collaborationRequests)
      .set({
        status: validatedData.status,
        updatedAt: now
      })
      .where(eq(collaborationRequests.id, validatedData.requestId))
      .returning();
    
    console.log(`Successfully updated request ${validatedData.requestId} status to ${validatedData.status}`);
    
    // Revalidate paths to reflect changes
    revalidatePath('/dashboard/entrepreneur');
    revalidatePath('/dashboard/investor');
    
    return { 
      success: true, 
      message: `Request ${validatedData.status === 'accepted' ? 'accepted' : 'rejected'} successfully`,
      data: updatedRequest
    };
  } catch (error) {
    console.error('Error updating collaboration request status:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

/**
 * DEBUG FUNCTION: Dump collaboration requests directly from database for troubleshooting
 * This can be called from any dashboard component to check database consistency
 */
export async function dumpCollaborationRequests() {
  try {
    console.log("===== DEBUG: Dumping collaboration requests =====");
    
    // Get all collaboration requests directly
    const requests = await db.select()
      .from(collaborationRequests);
    
    console.log(`Found ${requests.length} total collaboration requests in database:`);
    
    if (requests.length > 0) {
      for (const req of requests) {
        console.log(JSON.stringify(req, null, 2));
        
        // Look up investor for this request
        const investorData = await db.select()
          .from(investors)
          .where(eq(investors.id, req.investorId));
        
        if (investorData.length > 0) {
          console.log(`Investor exists: ${investorData[0].name} (${investorData[0].id})`);
        } else {
          console.log(`WARNING: Investor with ID ${req.investorId} not found!`);
        }
        
        // Look up entrepreneur for this request
        const entrepreneurData = await db.select()
          .from(entrepreneurs)
          .where(eq(entrepreneurs.id, req.entrepreneurId));
        
        if (entrepreneurData.length > 0) {
          console.log(`Entrepreneur exists: ${entrepreneurData[0].name} (${entrepreneurData[0].id})`);
        } else {
          console.log(`WARNING: Entrepreneur with ID ${req.entrepreneurId} not found!`);
        }
        
        console.log("-----");
      }
    } else {
      console.log("No collaboration requests found in database");
    }
    
    return { 
      success: true, 
      message: `Dumped ${requests.length} collaboration requests to server logs` 
    };
  } catch (error) {
    console.error('Error dumping collaboration requests:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}