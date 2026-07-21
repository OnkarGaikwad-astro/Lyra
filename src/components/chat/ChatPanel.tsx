import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

export const ChatPanel = () => {
  const { user } = useAuthStore();
  const { activeChatUser, messages, sendMessage } = useChatStore();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = activeChatUser ? (messages[activeChatUser.id] || []) : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  if (!user || !activeChatUser) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeChatUser.socketId) return;

    sendMessage(activeChatUser.id, activeChatUser.socketId, user.id, text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-full w-full rounded-2xl overflow-hidden liquid-panel border border-white/5 shadow-2xl relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {activeMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-3">
            <UserIcon className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium tracking-wide uppercase">You are now connected with a stranger.</p>
            <p className="text-xs text-white/30">Say hi!</p>
          </div>
        ) : (
          activeMessages.map((msg) => {
            const isMe = msg.senderId === user.id;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isMe ? 'items-end self-end ml-auto' : 'items-start mr-auto'}`}
              >
                <div className={`px-4 py-3 rounded-2xl text-[15px] ${
                  isMe 
                    ? 'bg-red-500/20 text-white border border-red-500/30 rounded-br-none shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                    : 'bg-white/10 text-white/90 border border-white/5 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-white/30 uppercase mt-1.5 px-1 tracking-widest font-bold">
                  {isMe ? 'You' : 'Stranger'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Transmit message..."
            className="w-full liquid-inset bg-black/60 pl-5 pr-14 py-4 rounded-xl text-[15px] text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className={`absolute right-3 p-2.5 rounded-lg transition-colors ${
              text.trim()
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                : 'text-white/20 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
