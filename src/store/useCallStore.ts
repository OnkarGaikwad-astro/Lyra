import { create } from 'zustand';
import { User } from './useAuthStore';

type CallStatus = 'idle' | 'incoming' | 'outgoing' | 'connected';

export interface CallLog {
  id: string;
  type: 'incoming' | 'outgoing';
  username: string;
  avatar_url?: string;
  duration: number; // in seconds
  timestamp: number;
}

interface CallState {
  status: CallStatus;
  caller: User | null;
  receiver: User | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMinimized: boolean;
  callHistory: CallLog[];
  setCallStatus: (status: CallStatus) => void;
  setParticipants: (caller: User | null, receiver: User | null) => void;
  setStreams: (local: MediaStream | null, remote: MediaStream | null) => void;
  setMinimized: (minimized: boolean) => void;
  addCallLog: (log: Omit<CallLog, 'id' | 'timestamp'>) => void;
  endCall: () => void;
  startCallAction?: (userToCall: User) => void;
  answerCallAction?: () => void;
  declineCallAction?: () => void;
  leaveCallAction?: () => void;
  setCallActions: (actions: { start: any, answer: any, decline: any, leave: any }) => void;
}

const loadHistory = (): CallLog[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lyra-call-history');
    if (saved) return JSON.parse(saved);
  }
  return [];
};

export const useCallStore = create<CallState>((set) => ({
  status: 'idle',
  caller: null,
  receiver: null,
  localStream: null,
  remoteStream: null,
  isMinimized: false,
  callHistory: loadHistory(),
  setCallStatus: (status) => set({ status }),
  setParticipants: (caller, receiver) => set({ caller, receiver }),
  setStreams: (localStream, remoteStream) => set({ localStream, remoteStream }),
  setMinimized: (isMinimized) => set({ isMinimized }),
  addCallLog: (log) => set((state) => {
    const newLog: CallLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    const updatedHistory = [newLog, ...state.callHistory].slice(0, 50); // Keep last 50
    if (typeof window !== 'undefined') {
      localStorage.setItem('lyra-call-history', JSON.stringify(updatedHistory));
    }
    return { callHistory: updatedHistory };
  }),
  endCall: () => set({ status: 'idle', caller: null, receiver: null, localStream: null, remoteStream: null, isMinimized: false }),
  setCallActions: (actions) => set({ 
    startCallAction: actions.start, 
    answerCallAction: actions.answer, 
    declineCallAction: actions.decline, 
    leaveCallAction: actions.leave 
  }),
}));
