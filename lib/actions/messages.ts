'use server';

import { createId } from '@paralleldrive/cuid2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { messages, conversations, messageReadReceipts, conversationParticipants } from '@/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema for sending a message
export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message is too long')
});

// Schema for marking messages as read
export const markAsReadSchema = z.object({
  messageIds: z.array(z.string()).min(1, 'At least one message ID is required')
});

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Check if user is a participant in this conversation
    const participant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return { success: false, message: 'You are not a participant in this conversation' };
    }

    // Get all messages for this conversation
    const conversationMessages = await db
      .select({
        message: messages,
        isRead: sql<boolean>`
          EXISTS (
            SELECT 1 FROM ${messageReadReceipts}
            WHERE ${messageReadReceipts.messageId} = ${messages.id}
            AND ${messageReadReceipts.userId} = ${userId}
          )
        `
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(100); // Limit to last 100 messages

    const formattedMessages = conversationMessages.map(({ message, isRead }) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isEdited: message.isEdited,
      isRead
    }));

    return { success: true, data: formattedMessages.reverse() }; // Reverse to get oldest first
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

/**
 * Send a new message in a conversation
 */
export async function sendMessage(data: z.infer<typeof sendMessageSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;
    const validatedData = sendMessageSchema.parse(data);

    // Check if user is a participant in this conversation
    const participant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, validatedData.conversationId),
          eq(conversationParticipants.userId, userId)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return { success: false, message: 'You are not a participant in this conversation' };
    }

    // Create the message
    const messageId = createId();
    const messageData = {
      id: messageId,
      conversationId: validatedData.conversationId,
      senderId: userId,
      content: validatedData.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false
    };

    await db.insert(messages).values(messageData);

    // Update the conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, validatedData.conversationId));

    // The sender automatically marks their own message as read
    await db.insert(messageReadReceipts).values({
      id: createId(),
      messageId,
      userId,
      readAt: new Date()
    });

    revalidatePath(`/chat/${validatedData.conversationId}`);
    
    return { 
      success: true, 
      message: 'Message sent successfully',
      data: messageData
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(data: z.infer<typeof markAsReadSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;
    const validatedData = markAsReadSchema.parse(data);

    // Get messages that are not already marked as read by this user
    const unreadMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .leftJoin(
        messageReadReceipts,
        and(
          eq(messageReadReceipts.messageId, messages.id),
          eq(messageReadReceipts.userId, userId)
        )
      )
      .where(
        and(
          inArray(messages.id, validatedData.messageIds),
          eq(messageReadReceipts.id, null)
        )
      );

    if (unreadMessages.length === 0) {
      return { success: true, message: 'No new messages to mark as read' };
    }

    // Mark messages as read
    await db.insert(messageReadReceipts).values(
      unreadMessages.map(message => ({
        id: createId(),
        messageId: message.id,
        userId,
        readAt: new Date()
      }))
    );

    // Get the conversationId to revalidate the path
    const messageData = await db
      .select({ conversationId: messages.conversationId })
      .from(messages)
      .where(eq(messages.id, unreadMessages[0].id))
      .limit(1);

    if (messageData.length > 0) {
      revalidatePath(`/chat/${messageData[0].conversationId}`);
      revalidatePath('/chat');
    }

    return { 
      success: true, 
      message: `Marked ${unreadMessages.length} messages as read` 
    };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
} 