"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallStore } from '@/store/useCallStore';
import { Phone, Clock, Search, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { motion } from 'framer-motion';
import { CallScreen } from '@/components/call/CallScreen';

export default function DashboardPage() {
  const { user, onlineUsers } = useAuthStore();
  const { startCallAction, callHistory } = useCallStore();
  const [searchQuery, setSearchQuery] = useState('');

  const displayContacts = onlineUsers.filter(
    (contact) => 
      contact.id !== user?.id && 
      (contact.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <CallScreen />
      
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar (Command Center) */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          
          {/* User Profile Panel */}
          <div className="p-6 liquid-panel flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-light mb-1 text-white">
                Welcome, <span className="font-bold text-red-500 drop-shadow-md">{user?.username}</span>
              </h1>
              <p className="text-white/50 font-medium tracking-wide uppercase text-xs">Secure Network</p>
            </div>
            
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Search network..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm liquid-inset"
              />
            </div>
          </div>

          {/* Recent Log Panel */}
          <div className="liquid-panel flex-1 p-6 flex flex-col">
            <h2 className="text-xs font-bold tracking-widest text-white/70 uppercase flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4" />
              Recent Log
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {callHistory.length === 0 ? (
                <div className="text-white/40 text-xs text-center py-4 border border-dashed border-white/10 rounded-xl">
                  No recent signals
                </div>
              ) : (
                callHistory.map((log) => (
                  <div key={log.id} className="p-3 liquid-button border border-white/10 hover:border-white/15 !bg-white/5 hover:!bg-white/10 flex items-center justify-between transition-all shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full liquid-inset bg-transparent border flex items-center justify-center shadow-inner ${log.type === 'incoming' ? 'border-emerald-500/30' : 'border-blue-500/30'}`}>
                        {log.type === 'incoming' 
                          ? <PhoneIncoming className="w-4 h-4 text-emerald-400 drop-shadow-md" />
                          : <PhoneOutgoing className="w-4 h-4 text-blue-400 drop-shadow-md" />
                        }
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white drop-shadow-sm">{log.username}</h4>
                        <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-0.5 flex gap-2">
                          <span className={log.type === 'incoming' ? 'text-emerald-400' : 'text-blue-400'}>
                            {log.type.substring(0, 3)}
                          </span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span>{Math.floor(log.duration / 60)}:{(log.duration % 60).toString().padStart(2, '0')}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 liquid-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-bold tracking-widest text-white/70 uppercase flex items-center gap-3">
              <span className="w-2.5 h-2.5 indicator-primary"></span>
              Active Friends ({displayContacts.length})
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayContacts.length === 0 ? (
              <div className="col-span-full text-white/50 py-20 text-center liquid-inset border-dashed flex flex-col items-center gap-4">
                <Search className="w-8 h-8 opacity-50" />
                No active signals detected.
              </div>
            ) : (
              displayContacts.map((contact) => (
                <div key={contact.id} className="p-5 liquid-button group cursor-default flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 liquid-inset flex items-center justify-center font-bold text-2xl text-white">
                        {contact.username ? contact.username.charAt(0).toUpperCase() : '?'}
                      </div>
                      {contact.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black indicator-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">{contact.username}</h3>
                      <p className="text-xs text-red-400 uppercase tracking-widest mt-1 font-medium">{contact.status}</p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startCallAction?.(contact)}
                    disabled={contact.status !== 'online'}
                    className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      contact.status === 'online' 
                        ? 'liquid-button-primary' 
                        : 'liquid-button cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-bold tracking-wide uppercase">Connect</span>
                  </motion.button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
