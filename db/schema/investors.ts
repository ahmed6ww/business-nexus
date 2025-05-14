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

// Investor profile schema
export const investors = pgTable('investors', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 255 }),
  role: varchar('role', { length: 100 }),
  firmName: varchar('firm_name', { length: 255 }),
  location: varchar('location', { length: 255 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  linkedin: varchar('linkedin', { length: 255 }),
  twitter: varchar('twitter', { length: 100 }),
  bio: text('bio'),
  interests: json('interests').$type<string[]>(),
  checkSize: varchar('check_size', { length: 100 }),
  investmentStage: varchar('investment_stage', { length: 100 }),
  portfolioCompanies: json('portfolio_companies').$type<{
    name: string;
    description: string;
    role: string;
    year: number;
  }[]>(),
  portfolioCount: varchar('portfolio_count', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export type Investor = typeof investors.$inferSelect;
export type InsertInvestor = typeof investors.$inferInsert;