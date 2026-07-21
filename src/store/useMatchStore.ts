import { create } from 'zustand';
import { User } from './useAuthStore';
import { socket } from '@/lib/socket';
import { useChatStore } from './useChatStore';

type MatchStatus = 'idle' | 'searching' | 'matched';

interface MatchState {
  status: MatchStatus;
  currentStranger: User | null;
  startMatchmaking: (user: User) => void;
  stopMatchmaking: () => void;
  handleMatchFound: (stranger: User) => void;
  skipStranger: () => void;
  handleStrangerLeft: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  status: 'idle',
  currentStranger: null,
  
  startMatchmaking: (user) => {
    set({ status: 'searching', currentStranger: null });
    useChatStore.getState().setActiveChatUser(null);
    socket.emit('joinMatchmaking', user);
  },
  
  stopMatchmaking: () => {
    set({ status: 'idle', currentStranger: null });
    useChatStore.getState().setActiveChatUser(null);
    socket.emit('leaveMatchmaking');
  },
  
  handleMatchFound: (stranger) => {
    set({ status: 'matched', currentStranger: stranger });
    useChatStore.getState().setActiveChatUser(stranger);
  },
  
  skipStranger: () => {
    const { currentStranger } = get();
    if (currentStranger) {
      socket.emit('skipMatch', currentStranger.socketId);
    }
    set({ status: 'idle', currentStranger: null });
    useChatStore.getState().setActiveChatUser(null);
  },
  
  handleStrangerLeft: () => {
    set({ status: 'idle', currentStranger: null });
    useChatStore.getState().setActiveChatUser(null);
  }
}));
