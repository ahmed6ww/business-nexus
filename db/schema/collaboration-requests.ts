import { createId } from '@paralleldrive/cuid2';
import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  pgEnum
} from 'drizzle-orm/pg-core';
import { entrepreneurs } from './entrepreneurs';
import { investors } from './investors';

// Define collaboration request status enum
export const requestStatusEnum = pgEnum('request_status', ['pending', 'accepted', 'rejected']);

// Collaboration request schema
export const collaborationRequests = pgTable('collaboration_requests', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  investorId: varchar('investor_id', { length: 128 }).notNull().references(() => investors.id, { onDelete: 'cascade' }),
  entrepreneurId: varchar('entrepreneur_id', { length: 128 }).notNull().references(() => entrepreneurs.id, { onDelete: 'cascade' }),
  status: requestStatusEnum('status').default('pending').notNull(),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export type CollaborationRequest = typeof collaborationRequests.$inferSelect;
export type InsertCollaborationRequest = typeof collaborationRequests.$inferInsert;