import { create } from 'zustand';
import { socket } from '@/lib/socket';
import { User } from './useAuthStore';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

interface ChatState {
  activeChatUser: User | null;
  messages: Record<string, ChatMessage[]>;
  unreadCounts: Record<string, number>;
  setActiveChatUser: (user: User | null) => void;
  addMessage: (userId: string, message: ChatMessage) => void;
  sendMessage: (recipientId: string, recipientSocketId: string, senderId: string, text: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeChatUser: null,
  messages: {},
  unreadCounts: {},
  setActiveChatUser: (user) => set((state) => {
    if (user) {
      return { 
        activeChatUser: user,
        unreadCounts: { ...state.unreadCounts, [user.id]: 0 }
      };
    }
    return { activeChatUser: null };
  }),
  addMessage: (userId, message) => set((state) => {
    const userMessages = state.messages[userId] || [];
    const isCurrentlyActive = state.activeChatUser?.id === userId;
    const isFromMe = message.senderId !== userId;
    
    // Only increment unread if the chat is not open AND the message is not from ourselves
    const currentUnread = state.unreadCounts[userId] || 0;
    const newUnreadCount = (!isCurrentlyActive && !isFromMe) ? currentUnread + 1 : currentUnread;
    
    return {
      messages: {
        ...state.messages,
        [userId]: [...userMessages, message],
      },
      unreadCounts: {
        ...state.unreadCounts,
        [userId]: newUnreadCount,
      }
    };
  }),
  sendMessage: (recipientId, recipientSocketId, senderId, text) => {
    const timestamp = Date.now();
    const message: ChatMessage = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      text,
      timestamp,
    };
    
    // Add locally to sender's view (using recipient's ID as the conversation key)
    get().addMessage(recipientId, message);
    
    // Emit to server
    socket.emit('sendMessage', {
      to: recipientSocketId,
      from: senderId,
      text,
      timestamp
    });
  }
}));
