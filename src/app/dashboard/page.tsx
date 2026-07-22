"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallStore } from '@/store/useCallStore';
import { useChatStore } from '@/store/useChatStore';
import { Settings, Users, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { MatchHub } from '@/components/match/MatchHub';
import { useRoomStore } from '@/store/useRoomStore';
import { socket } from '@/lib/socket';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { setRoomId } = useRoomStore();
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [targetId, setTargetId] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center relative">
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar (Command Center) */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <img src="/icon.png" alt="Orion" className="w-8 h-8 rounded-[25%] object-cover shadow-lg" />
            <span className="text-xl font-light tracking-[0.2em] text-white">ORION</span>
          </div>

          {/* User Profile Panel */}
          <div className="p-6 liquid-panel flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-light mb-1 text-white flex items-center gap-2">
                  Welcome, {mounted && <span className="font-bold text-red-500 drop-shadow-md">{user?.username}</span>}
                </h1>
                <p className="text-white/50 font-medium tracking-wide uppercase text-xs">Secure Network</p>
              </div>
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            
          </div>

          {/* Call a Friend Panel */}
          <div className="p-6 liquid-panel flex flex-col gap-2">
            <h2 className="text-sm font-bold tracking-widest text-white/70 uppercase">Call a Friend</h2>
            <p className="text-[10px] text-white/40 tracking-wider leading-relaxed">Connect directly to someone using their unique Network ID.</p>
            <div className="relative flex items-center mt-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="w-4 h-4 text-white/40" />
              </div>
              <input
                type="text"
                placeholder="Friend's Network ID..."
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && targetId.trim()) {
                    socket.emit('directConnect', { targetId: targetId.trim(), user });
                    setTargetId('');
                  }
                }}
                className="w-full liquid-inset bg-black/40 pl-9 pr-3 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all font-mono"
              />
            </div>
          </div>

          {/* Room Controls Panel */}
          <div className="p-6 liquid-panel flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-widest text-white/70 uppercase">Group Rooms</h2>
            
            <button
              onClick={() => socket.emit('createRoom', user)}
              className="w-full py-3 liquid-button rounded-xl text-sm uppercase tracking-widest font-bold hover:text-white text-white/70 transition-all border border-white/10"
            >
              Create Room
            </button>
            
            <div className="relative flex items-center mt-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="w-4 h-4 text-white/40" />
              </div>
              <input
                type="text"
                placeholder="Join Room ID..."
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && joinRoomId.trim()) {
                    socket.emit('joinRoom', { roomId: joinRoomId.trim(), user });
                    setRoomId(joinRoomId.trim());
                    setJoinRoomId('');
                  }
                }}
                className="w-full liquid-inset bg-black/40 pl-9 pr-3 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all font-mono"
              />
            </div>
          </div>

        </div>

        {/* Main Content Area - MatchHub */}
        <div className="lg:col-span-3">
          <MatchHub />
        </div>

      </div>
    </div>
  );
}
