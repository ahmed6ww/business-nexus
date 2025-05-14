import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcrypt';

export async function POST() {
  try {
    // Only allow in development mode for safety
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, message: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }
    
    // Create example users directly without checking if users exist
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
    
    // Insert users into database - use a try/catch to handle duplicate emails
    try {
      await db.insert(users).values(exampleUsers);
      return NextResponse.json({ 
        success: true, 
        message: `Successfully seeded ${exampleUsers.length} example users` 
      });
    } catch (insertError) {
      // If insertion fails due to duplicate emails, try each user individually
      console.log('Batch insert failed, trying individual inserts:', insertError);
      
      let insertedCount = 0;
      for (const user of exampleUsers) {
        try {
          // Try to insert a single user, ignoring errors from duplicates
          await db.insert(users).values({
            ...user,
            // Create a unique email in case of duplicates
            email: `${user.email.split('@')[0]}_${Date.now()}@example.com`
          });
          insertedCount++;
        } catch (singleInsertError) {
          console.log(`Failed to insert user ${user.name}:`, singleInsertError);
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Seeded ${insertedCount} example users with fallback method` 
      });
    }
  } catch (error) {
    console.error('Error in simple seed users API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 