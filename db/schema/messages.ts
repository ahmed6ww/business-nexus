import { createId } from '@paralleldrive/cuid2';
import { pgTable, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { conversations } from './conversations';

// Create the messages table schema
export const messages = pgTable('messages', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  conversationId: varchar('conversation_id', { length: 128 })
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: varchar('sender_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isEdited: boolean('is_edited').default(false).notNull()
});

// Message read receipts
export const messageReadReceipts = pgTable('message_read_receipts', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  messageId: varchar('message_id', { length: 128 })
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at').defaultNow().notNull()
});

// Define types for the message models
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type MessageReadReceipt = typeof messageReadReceipts.$inferSelect;
export type InsertMessageReadReceipt = typeof messageReadReceipts.$inferInsert; 