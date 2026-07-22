"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function LandingPage() {
  const [name, setName] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleJoin = () => {
    if (name.trim()) {
      let deviceId = localStorage.getItem('orion-device-id');
      if (!deviceId) {
        deviceId = `user-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('orion-device-id', deviceId);
      }

      login({
        id: deviceId,
        username: name.trim(),
        email: `${name.trim().toLowerCase().replace(/\\s+/g, '')}@orion.network`,
        status: 'online'
      });
      router.push('/dashboard');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent">
      {/* Subtle Dynamic Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-red-600/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-rose-700/15 rounded-full blur-[150px]"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 mx-4"
      >
        <motion.div 
          initial={{ backdropFilter: "blur(2px)", backgroundColor: "rgba(0,0,0,0)" }}
          animate={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.4)" }}
          transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
          className="liquid-panel w-full p-10 sm:p-14 flex flex-col items-center text-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          
          {/* Top highlight line for the card */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

          {/* 3D App Icon */}
          <div className="w-32 h-32 mb-10 relative z-10 drop-shadow-[0_0_30px_rgba(220,38,38,0.3)] rounded-[25%] overflow-hidden">
            <img src="/icon.png" alt="Orion Logo" className="w-full h-full object-cover scale-[1.02]" />
          </div>

          {/* Typography */}
          <h1 className="text-5xl sm:text-6xl font-light text-white tracking-[0.25em] mb-3 ml-2">
            ORION
          </h1>
          <p className="text-xs sm:text-sm text-white/50 tracking-widest uppercase mb-12 font-medium">
            Next-Gen Voice Protocol
          </p>

          {/* Form */}
          <div className="w-full max-w-[320px] flex flex-col gap-5 relative z-10">
            <div className="relative group">
              <input
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="w-full py-4 px-6 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 focus:bg-black/60 transition-all font-light tracking-widest text-center shadow-inner"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!name.trim()}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm uppercase tracking-widest flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] border border-red-400/30 group"
            >
              <span>Connect</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
