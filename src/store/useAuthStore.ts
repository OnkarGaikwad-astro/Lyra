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

const loadUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lyra-user');
    if (saved) return JSON.parse(saved);
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  onlineUsers: [],
  login: (user) => set(() => {
    if (typeof window !== 'undefined') localStorage.setItem('lyra-user', JSON.stringify(user));
    return { user };
  }),
  logout: () => set(() => {
    if (typeof window !== 'undefined') localStorage.removeItem('lyra-user');
    return { user: null };
  }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
}));
