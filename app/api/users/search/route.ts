import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, not, like, or, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameter
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || '';

    // Search for users excluding the current user
    let searchResult;
    
    if (query) {
      // Search by name or email if query is provided
      searchResult = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          not(eq(users.id, session.user.id)),
          or(
            like(users.name, `%${query}%`),
            like(users.email, `%${query}%`)
          )
        )
      )
      .limit(20);
    } else {
      // Get all users if no query is provided
      searchResult = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(
        not(eq(users.id, session.user.id))
      )
      .limit(20);
    }

    return NextResponse.json(searchResult);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
} 