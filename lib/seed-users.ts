import { db } from '@/db';
import { users } from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcrypt';

export async function seedUsers() {
  try {
    console.log('Checking if users exist in the database...');
    
    // Check if we already have users - using a simpler approach to count
    const existingUsers = await db.select().from(users).limit(1);
    const userCount = existingUsers.length;
    
    if (userCount > 0) {
      console.log(`Database already has users. Skipping seed.`);
      return { success: true, message: `Database already has users` };
    }
    
    console.log('No users found. Seeding example users...');
    
    // Create example users
    const exampleUsers = [
      {
        id: createId(),
        name: 'John Entrepreneur',
        email: 'entrepreneur@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'entrepreneur',
      },
      {
        id: createId(),
        name: 'Sarah Investor',
        email: 'investor@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'investor',
      },
      {
        id: createId(),
        name: 'Mike Advisor',
        email: 'advisor@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'entrepreneur',
      },
      {
        id: createId(),
        name: 'Emily VC',
        email: 'vc@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'investor',
      },
    ];
    
    // Insert users into database
    await db.insert(users).values(exampleUsers);
    
    console.log(`Successfully seeded ${exampleUsers.length} example users.`);
    return { success: true, message: `Seeded ${exampleUsers.length} example users` };
  } catch (error) {
    console.error('Error seeding users:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
} 