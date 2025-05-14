import { createId } from '@paralleldrive/cuid2';
import { 
  pgTable, 
  varchar, 
  text, 
  timestamp,
  boolean,
  primaryKey
} from 'drizzle-orm/pg-core';
import { entrepreneurs } from './entrepreneurs';
import { investors } from './investors';

// Profile group schema
export const profileGroups = pgTable('profile_groups', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(true).notNull(),
  createdById: varchar('created_by_id', { length: 128 }).notNull(),
  createdByType: varchar('created_by_type', { length: 20 }).notNull(), // 'investor' or 'entrepreneur'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Profile group members - entrepreneurs
export const profileGroupEntrepreneurs = pgTable('profile_group_entrepreneurs', {
  groupId: varchar('group_id', { length: 128 }).notNull().references(() => profileGroups.id, { onDelete: 'cascade' }),
  entrepreneurId: varchar('entrepreneur_id', { length: 128 }).notNull().references(() => entrepreneurs.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.groupId, table.entrepreneurId] })
  };
});

// Profile group members - investors
export const profileGroupInvestors = pgTable('profile_group_investors', {
  groupId: varchar('group_id', { length: 128 }).notNull().references(() => profileGroups.id, { onDelete: 'cascade' }),
  investorId: varchar('investor_id', { length: 128 }).notNull().references(() => investors.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.groupId, table.investorId] })
  };
});

// Export types
export type ProfileGroup = typeof profileGroups.$inferSelect;
export type InsertProfileGroup = typeof profileGroups.$inferInsert;

export type ProfileGroupEntrepreneur = typeof profileGroupEntrepreneurs.$inferSelect;
export type InsertProfileGroupEntrepreneur = typeof profileGroupEntrepreneurs.$inferInsert;

export type ProfileGroupInvestor = typeof profileGroupInvestors.$inferSelect;
export type InsertProfileGroupInvestor = typeof profileGroupInvestors.$inferInsert;