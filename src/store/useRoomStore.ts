import { create } from 'zustand';
import { User } from './useAuthStore';

interface RoomMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface RoomParticipant extends User {
  stream?: MediaStream;
}

interface RoomState {
  roomId: string | null;
  participants: RoomParticipant[];
  messages: RoomMessage[];
  setRoomId: (id: string | null) => void;
  setParticipants: (users: RoomParticipant[]) => void;
  addParticipant: (user: RoomParticipant) => void;
  removeParticipant: (socketId: string) => void;
  addMessage: (msg: RoomMessage) => void;
  clearRoom: () => void;
  stopLocalStreamAction?: () => void;
  setStopLocalStreamAction: (action: () => void) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  participants: [],
  messages: [],
  setRoomId: (roomId) => set({ roomId }),
  setParticipants: (participants) => set({ participants }),
  addParticipant: (user) => set((state) => ({ 
    participants: [...state.participants.filter(p => p.socketId !== user.socketId), user] 
  })),
  removeParticipant: (socketId) => set((state) => ({
    participants: state.participants.filter(p => p.socketId !== socketId)
  })),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearRoom: () => set({ roomId: null, participants: [], messages: [] }),
  setStopLocalStreamAction: (action) => set({ stopLocalStreamAction: action }),
}));
