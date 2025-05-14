import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessages, sendMessage, markMessagesAsRead } from '@/lib/actions/messages';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'conversationId is required' },
        { status: 400 }
      );
    }
    
    const result = await getConversationMessages(conversationId);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to load messages' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in messages API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, content } = body;
    
    if (!conversationId || !content) {
      return NextResponse.json(
        { success: false, message: 'conversationId and content are required' },
        { status: 400 }
      );
    }
    
    const result = await sendMessage({ conversationId, content });
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to send message' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in messages API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// For marking messages as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageIds } = body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'messageIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }
    
    const result = await markMessagesAsRead({ messageIds });
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to mark messages as read' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in messages API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 