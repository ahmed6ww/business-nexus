import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as schema from './schema';

// Initialize the SQL client with the database URL from environment variables
const sql = neon(process.env.DATABASE_URL!);

// Create a Drizzle ORM instance with our schema
export const db = drizzle(sql, { schema });

// Export a function to run migrations
export async function runMigrations() {
  await migrate(db, { migrationsFolder: './db/migrations' });
}