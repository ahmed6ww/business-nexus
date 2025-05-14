import { createId } from '@paralleldrive/cuid2';
import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  json,
  foreignKey
} from 'drizzle-orm/pg-core';
import { users } from './users';

// Entrepreneur profile schema
export const entrepreneurs = pgTable('entrepreneurs', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 255 }),
  role: varchar('role', { length: 100 }),
  companyName: varchar('company_name', { length: 255 }),
  location: varchar('location', { length: 255 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  linkedin: varchar('linkedin', { length: 255 }),
  twitter: varchar('twitter', { length: 100 }),
  bio: text('bio'),
  startupDescription: text('startup_description'),
  fundingNeed: json('funding_need').$type<{
    amount: string;
    stage: string;
    use: string;
  }>(),
  pitchDeck: varchar('pitch_deck', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export type Entrepreneur = typeof entrepreneurs.$inferSelect;
export type InsertEntrepreneur = typeof entrepreneurs.$inferInsert;