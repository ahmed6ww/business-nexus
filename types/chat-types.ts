export interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

export interface Conversation {
  id: string;
  participants: User[];
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithParticipants extends Conversation {
  participants: User[];
}

export interface ConversationWithLastMessage extends Conversation {
  lastMessage?: Message;
}

export interface ConversationResponse {
  conversation: ConversationWithParticipants;
  messages: Message[];
} 