import { createId } from '@paralleldrive/cuid2';
import { pgTable, varchar, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

// Create the conversations table schema
export const conversations = pgTable('conversations', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Define participants in conversations (many-to-many relationship)
export const conversationParticipants = pgTable('conversation_participants', {
  conversationId: varchar('conversation_id', { length: 128 })
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.conversationId, table.userId] })
  };
});

// Define types for the conversation models
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = typeof conversationParticipants.$inferInsert; 