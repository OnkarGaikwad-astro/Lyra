import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  email: string;
  status: 'online' | 'offline' | 'busy';
  avatar_url?: string;
  socketId?: string;
}

interface AuthState {
  user: User | null;
  onlineUsers: User[];
  login: (user: User) => void;
  logout: () => void;
  setOnlineUsers: (users: User[]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  onlineUsers: [
    { id: 'user-demo-456', username: 'Alex_Explorer', email: 'alex@lyra.network', status: 'online' },
    { id: 'user-demo-789', username: 'Elena_Nav', email: 'elena@lyra.network', status: 'online' }
  ],
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
}));
