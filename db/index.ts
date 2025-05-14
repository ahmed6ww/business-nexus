import { config } from "dotenv";

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as schema from './schema';
config({ path: ".env" }); // or .env.local

// Initialize the SQL client with the database URL from environment variables
const sql = neon(process.env.DATABASE_URL!);

// Create a Drizzle ORM instance with our schema
// Add Drizzle ORM configuration to properly handle relations
export const db = drizzle(sql, { 
  schema,
  // Add explicit logger for debugging
  logger: {
    logQuery: (query, params) => {
      console.log('Query:', query);
      console.log('Params:', params);
    },
  }
});

// Export a function to run migrations
export async function runMigrations() {
  await migrate(db, { migrationsFolder: './db/migrations' });
}