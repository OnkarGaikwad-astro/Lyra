"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Orbit, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function LandingPage() {
  const [name, setName] = useState('');
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleJoin = () => {
    if (name.trim()) {
      let deviceId = localStorage.getItem('lyra-device-id');
      if (!deviceId) {
        deviceId = `user-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('lyra-device-id', deviceId);
      }
      
      login({
        id: deviceId,
        username: name.trim(),
        email: `${name.trim().toLowerCase().replace(/\\s+/g, '')}@lyra.network`,
        status: 'online'
      });
      router.push('/dashboard');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[20%] w-64 h-64 rounded-3xl liquid-panel rotate-12 opacity-40"
        />
        <motion.div 
          animate={{ y: [0, 30, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 right-[15%] w-80 h-48 rounded-3xl liquid-panel -rotate-6 opacity-40"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="z-10 flex flex-col items-center"
      >
        {/* Logo */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-red-500/30 rounded-full border-dashed shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border border-red-500/20 rounded-full shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]"
          />
          
          {/* Central Logo Core */}
          <div className="w-16 h-16 rounded-full indicator-primary flex items-center justify-center text-white z-10">
            <Mic className="w-8 h-8 drop-shadow-md" />
          </div>
          
          {/* Orbital Stars */}
          <div className="absolute top-0 left-1/2 w-2.5 h-2.5 bg-zinc-800 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />
          <div className="absolute bottom-4 right-4 w-2 h-2 bg-red-500 rounded-full shadow-md" />
          <div className="absolute bottom-4 left-4 w-2.5 h-2.5 bg-red-400 rounded-full shadow-lg" />
        </div>

        {/* Text */}
        <h1 className="text-5xl sm:text-6xl font-light text-white tracking-[0.3em] mb-4">LYRA</h1>
        <p className="text-xs sm:text-lg text-white/70 tracking-widest uppercase mb-16 text-center px-4">Connect voices beyond distance.</p>

        {/* Actions */}
        <div className="flex flex-col gap-6 w-full max-w-[280px] sm:max-w-sm mt-4 sm:mt-8">
          <input
            type="text"
            placeholder="Enter your signal name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            className="w-full py-4 px-6 rounded-2xl text-center liquid-inset focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
          />
          
          <button 
            onClick={handleJoin}
            disabled={!name.trim()}
            className="w-full py-4 liquid-button-primary text-sm uppercase tracking-widest flex justify-center items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect to Network
            <motion.span className="group-hover:translate-x-1 transition-transform">→</motion.span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
