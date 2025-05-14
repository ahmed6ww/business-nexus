import { NextResponse } from 'next/server';
import { getMyConversations, createConversation } from '@/lib/actions/conversations';

export async function GET() {
  try {
    const result = await getMyConversations();
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to load conversations' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in conversations API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { participantIds } = body;
    
    if (!participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json(
        { success: false, message: 'participantIds is required and must be an array' },
        { status: 400 }
      );
    }
    
    const result = await createConversation({ participantIds });
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to create conversation' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in conversations API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 