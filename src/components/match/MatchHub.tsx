import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Phone, XCircle, Link as LinkIcon } from 'lucide-react';
import { useMatchStore } from '@/store/useMatchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ChatPanel } from '../chat/ChatPanel';
import { CallScreen } from '../call/CallScreen';
import { useCallStore } from '@/store/useCallStore';
import { socket } from '@/lib/socket';
import { useRoomStore } from '@/store/useRoomStore';
import { RoomHub } from '../room/RoomHub';

export const MatchHub = () => {
  const { user } = useAuthStore();
  const { roomId, setRoomId } = useRoomStore();
  const { status, currentStranger, startMatchmaking, stopMatchmaking, skipStranger } = useMatchStore();
  const { startCallAction } = useCallStore();
  const callStatus = useCallStore(state => state.status);
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleConnectError = (msg: string) => alert(msg);
    const handleRoomError = (msg: string) => alert(msg);
    const handleRoomCreated = (id: string) => setRoomId(id);
    const handleRoomJoined = () => {
      // RoomJoined is handled by useRoomWebRTC, but we also need to set UI state if not already set
    };
    
    socket.on('connectError', handleConnectError);
    socket.on('roomError', handleRoomError);
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomJoined', (data) => {
      // Data is either user array or participants
      // If we joined, we need a way to know the room id. Wait, we emitted joinRoom with joinRoomId.
      // We will setRoomId when we successfully join.
    });

    return () => {
      socket.off('connectError', handleConnectError);
      socket.off('roomError', handleRoomError);
      socket.off('roomCreated', handleRoomCreated);
      socket.off('roomJoined');
    };
  }, [setRoomId]);

  if (!mounted || !user) return null;

  if (roomId) {
    return <RoomHub />;
  }

  return (
    <div className="w-full h-[600px] liquid-panel p-6 flex flex-col relative overflow-hidden">
      
      {/* --- IDLE STATE --- */}
      {status === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center max-w-sm text-center space-y-8"
          >
            <div className="w-24 h-24 rounded-full indicator-primary flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <Search className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-light text-white tracking-widest uppercase mb-2">Find Signal</h2>
              <p className="text-sm text-white/50 tracking-wide">Connect anonymously with a random stranger on the network.</p>
            </div>
            
            <div className="w-full space-y-4">
              <button
                onClick={() => startMatchmaking(user)}
                className="w-full py-4 liquid-button-primary rounded-xl text-lg uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all"
              >
                Start Matching
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- SEARCHING STATE --- */}
      {status === 'searching' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-red-500/50"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1.8], opacity: [0.8, 0.2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
              className="absolute inset-0 rounded-full border border-red-500/50"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t border-red-500"
            />
            <Search className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          
          <h2 className="text-xl font-light text-white tracking-widest uppercase mb-2 animate-pulse">Scanning Frequencies...</h2>
          <p className="text-sm text-white/40 tracking-wide mb-8">Looking for anomalous signals</p>
          
          <button
            onClick={stopMatchmaking}
            className="px-8 py-3 rounded-xl border border-white/10 hover:border-white/30 text-white/50 hover:text-white uppercase tracking-widest text-sm font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      )}

      {/* --- MATCHED STATE --- */}
      {status === 'matched' && currentStranger && (
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full liquid-inset flex items-center justify-center font-bold text-lg text-white">
                {currentStranger.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{currentStranger.username}</h3>
                <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Encrypted Connection</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => startCallAction?.(currentStranger)}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg flex items-center gap-2 transition-colors border border-emerald-500/30"
              >
                <Phone className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide hidden sm:block">Video Call</span>
              </button>
              <button
                onClick={skipStranger}
                className="px-4 py-2 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2 transition-colors border border-white/10"
              >
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide hidden sm:block">Skip</span>
              </button>
            </div>
          </div>

          {/* Chat and Video Area */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
            {callStatus !== 'idle' && (
              <div className="flex-[2] h-full">
                <CallScreen />
              </div>
            )}
            <div className="flex-1 h-full lg:min-w-[320px]">
              <ChatPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
