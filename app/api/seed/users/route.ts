import { NextResponse } from 'next/server';
import { seedUsers } from '@/lib/seed-users';

export async function POST() {
  try {
    // Only allow in development mode for safety
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, message: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }
    
    const result = await seedUsers();
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to seed users' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in seed users API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 