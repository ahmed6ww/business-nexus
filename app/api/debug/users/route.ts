import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';

export async function GET() {
  try {
    // Get all users
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users);
    
    // Get total count from the array length
    const userCount = allUsers.length;
    
    // Limit to first 5 for sample
    const sampleUsers = allUsers.slice(0, 5);
    
    return NextResponse.json({
      total: userCount,
      sample: sampleUsers
    });
  } catch (error) {
    console.error('Error checking users:', error);
    return NextResponse.json({ error: 'Failed to check users' }, { status: 500 });
  }
} 