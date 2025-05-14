import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Direct SQL query to check if users table exists and has records
    const result = await db.execute(sql`
      SELECT 
        table_name, 
        (SELECT COUNT(*) FROM users) as user_count 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema = 'public' 
        AND table_name = 'users'
    `);
    
    return NextResponse.json({
      result,
      message: 'Raw database query result'
    });
  } catch (error) {
    console.error('Error running raw SQL query:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error', 
      stack: error instanceof Error ? error.stack : null 
    }, { status: 500 });
  }
} 