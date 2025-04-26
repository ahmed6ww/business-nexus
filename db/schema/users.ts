import { pgTable, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Define user roles as a type
export type UserRole = 'entrepreneur' | 'investor' | 'admin';

// Create the users table schema
export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().$type<UserRole>(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Define a type for the user model based on the schema
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;