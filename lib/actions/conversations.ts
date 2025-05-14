'use server';

import { createId } from '@paralleldrive/cuid2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { 
  conversations, 
  conversationParticipants, 
  messages,
  users
} from '@/db/schema';
import { eq, and, inArray, desc, sql, like, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { redirect } from 'next/navigation';

// Schema for creating a new conversation
export const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1, 'At least one participant is required')
});

// Schema for sending a message
export const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1, 'Message cannot be empty')
});

/**
 * Get all conversations for the current user
 */
export async function getMyConversations() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;

    // First get all conversation IDs this user is part of
    const userConversations = await db
      .select({
        conversationId: conversationParticipants.conversationId
      })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId));

    if (userConversations.length === 0) {
      return { success: true, data: [] };
    }

    const conversationIds = userConversations.map(c => c.conversationId);

    // Get all conversations with participants and last message
    const results = await db.select({
      conversation: conversations,
      participants: sql<string[]>`
        json_agg(
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email
          )
        )
      `,
      lastMessage: sql<{
        id: string;
        content: string;
        senderId: string;
        createdAt: Date;
      } | null>`
        (
          SELECT json_build_object(
            'id', m.id,
            'content', m.content,
            'senderId', m.sender_id,
            'createdAt', m.created_at
          )
          FROM ${messages} m
          WHERE m.conversation_id = ${conversations.id}
          ORDER BY m.created_at DESC
          LIMIT 1
        )
      `,
      unreadCount: sql<number>`
        (
          SELECT COUNT(*)
          FROM ${messages} m
          LEFT JOIN message_read_receipts mrr ON m.id = mrr.message_id AND mrr.user_id = ${userId}
          WHERE m.conversation_id = ${conversations.id}
          AND m.sender_id != ${userId}
          AND mrr.id IS NULL
        )::int
      `
    })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .innerJoin('users as u', eq(conversationParticipants.userId, sql.raw('u.id')))
      .where(inArray(conversations.id, conversationIds))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.updatedAt));

    const conversationsWithDetails = results.map(result => ({
      id: result.conversation.id,
      createdAt: result.conversation.createdAt,
      updatedAt: result.conversation.updatedAt,
      participants: result.participants.filter(p => p.id !== userId),
      lastMessage: result.lastMessage,
      unreadCount: result.unreadCount
    }));

    return { success: true, data: conversationsWithDetails };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(participantIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  
  // Ensure current user is included in participants
  if (!participantIds.includes(userId)) {
    participantIds.push(userId);
  }
  
  // Need at least 2 participants (including current user)
  if (participantIds.length < 2) {
    throw new Error('At least one other participant is required');
  }
  
  // Create a new conversation
  const conversationId = createId();
  
  try {
    // Insert the conversation
    await db.insert(conversations).values({
      id: conversationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Add all participants
    const participantValues = participantIds.map(participantId => ({
      id: createId(),
      conversationId,
      userId: participantId,
    }));
    
    await db.insert(conversationParticipants).values(participantValues);
    
    // Revalidate the chat path
    revalidatePath('/chat');
    
    return { success: true, conversationId };
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw new Error('Failed to create conversation');
  }
}

export async function sendMessage({ conversationId, content }: { conversationId: string, content: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  
  try {
    // Check if user is a participant in the conversation
    const participant = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ),
    });
    
    if (!participant) {
      throw new Error('Not a participant in this conversation');
    }
    
    // Create the message
    const messageId = createId();
    
    await db.insert(messages).values({
      id: messageId,
      conversationId,
      senderId: userId,
      content,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Update the conversation's last updated time
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
    
    // Revalidate the chat paths
    revalidatePath(`/chat/${conversationId}`);
    revalidatePath('/chat');
    
    return { success: true, messageId };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

export async function getConversations() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const userId = session.user.id;
  
  try {
    // Get all conversations where the user is a participant
    const userConversations = await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, userId),
      with: {
        conversation: true,
      },
    });
    
    const conversationIds = userConversations.map(c => c.conversationId);
    
    if (conversationIds.length === 0) {
      return [];
    }
    
    // Get all participants for these conversations
    const allParticipants = await db.query.conversationParticipants.findMany({
      where: inArray(conversationParticipants.conversationId, conversationIds),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    
    // Get the last message for each conversation
    const lastMessages = await Promise.all(
      conversationIds.map(async (convId) => {
        const msgs = await db.query.messages.findMany({
          where: eq(messages.conversationId, convId),
          orderBy: (messages, { desc }) => [desc(messages.createdAt)],
          limit: 1,
        });
        return msgs[0] || null;
      })
    );
    
    // Build the conversation objects with participants and last message
    const conversationsWithDetails = userConversations.map((uc) => {
      const participants = allParticipants
        .filter(p => p.conversationId === uc.conversationId)
        .map(p => ({
          id: p.user.id,
          name: p.user.name,
          email: p.user.email,
          image: p.user.image,
        }));
      
      const lastMessage = lastMessages.find(m => m?.conversationId === uc.conversationId);
      
      return {
        id: uc.conversation.id,
        participants,
        createdAt: uc.conversation.createdAt.toISOString(),
        updatedAt: uc.conversation.updatedAt.toISOString(),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          conversationId: lastMessage.conversationId,
          senderId: lastMessage.senderId,
          content: lastMessage.content,
          read: lastMessage.read,
          createdAt: lastMessage.createdAt.toISOString(),
          updatedAt: lastMessage.updatedAt.toISOString(),
        } : undefined,
      };
    });
    
    // Sort by the most recently updated conversations
    return conversationsWithDetails.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw new Error('Failed to fetch conversations');
  }
}

export async function getConversation(conversationId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const userId = session.user.id;
  
  try {
    // Check if user is a participant
    const participant = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ),
    });
    
    if (!participant) {
      throw new Error('Not a participant in this conversation');
    }
    
    // Get the conversation
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Get all participants
    const participants = await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.conversationId, conversationId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    
    // Get all messages in the conversation
    const conversationMessages = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });
    
    return {
      conversation: {
        id: conversation.id,
        participants: participants.map(p => ({
          id: p.user.id,
          name: p.user.name,
          email: p.user.email,
          image: p.user.image,
        })),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages: conversationMessages.map(m => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        read: m.read,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw new Error('Failed to fetch conversation');
  }
}

export async function markMessagesAsRead(conversationId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  
  try {
    // Check if user is a participant
    const participant = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ),
    });
    
    if (!participant) {
      throw new Error('Not a participant in this conversation');
    }
    
    // Mark all unread messages from other users as read
    await db.update(messages)
      .set({ read: true, updatedAt: new Date() })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.read, false),
        or(
          eq(messages.senderId, userId),
          not(eq(messages.senderId, userId))
        )
      ));
    
    // Revalidate paths
    revalidatePath(`/chat/${conversationId}`);
    revalidatePath('/chat');
    
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new Error('Failed to mark messages as read');
  }
} 