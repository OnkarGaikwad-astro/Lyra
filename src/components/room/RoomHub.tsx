import React, { useEffect, useRef, useState } from 'react';
import { useRoomStore, RoomParticipant } from '@/store/useRoomStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallStore } from '@/store/useCallStore';
import { socket } from '@/lib/socket';
import { LogOut, Send, Copy, Users } from 'lucide-react';

export const RoomHub = () => {
  const { user } = useAuthStore();
  const { roomId, participants, messages, clearRoom, addMessage, stopLocalStreamAction } = useRoomStore();
  const localStream = useCallStore(state => state.localStream);
  const [msgText, setMsgText] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleRoomMessage = (msg: any) => {
      addMessage(msg);
    };
    socket.on('roomMessage', handleRoomMessage);
    return () => {
      socket.off('roomMessage', handleRoomMessage);
    };
  }, [addMessage]);

  const handleLeave = () => {
    socket.emit('leaveRoom', roomId);
    stopLocalStreamAction?.();
    clearRoom();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (msgText.trim()) {
      socket.emit('roomMessage', {
        roomId,
        from: user?.id,
        text: msgText.trim(),
        timestamp: Date.now()
      });
      setMsgText('');
    }
  };

  if (!roomId) return null;

  // Grid classes based on participant count (including local)
  const totalUsers = participants.length + 1;
  const gridClass = totalUsers <= 1 ? "grid-cols-1" :
                    totalUsers <= 2 ? "grid-cols-1 sm:grid-cols-2" :
                    totalUsers <= 4 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3";

  return (
    <div className="w-full h-[600px] liquid-panel flex flex-col md:flex-row relative overflow-hidden bg-black/40">
      
      {/* LEFT: Video Grid */}
      <div className="flex-1 flex flex-col p-4 border-b md:border-b-0 md:border-r border-white/10 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-widest uppercase">Secure Room</h2>
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigator.clipboard.writeText(roomId)}>
                <p className="text-[10px] text-white/50 tracking-widest font-mono">ID: {roomId}</p>
                <Copy className="w-3 h-3 text-white/30 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
          <button 
            onClick={handleLeave}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        <div className={`flex-1 grid ${gridClass} gap-4 overflow-y-auto p-2 min-h-0`}>
          {/* Local Video */}
          <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-xl min-h-[150px]">
            <video 
              ref={(ref) => { if (ref && localStream) ref.srcObject = localStream; }} 
              autoPlay playsInline muted 
              className="absolute inset-0 w-full h-full object-cover" 
            />
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs text-white font-medium">
              You
            </div>
          </div>

          {/* Remote Videos */}
          {participants.map(p => (
            <div key={p.socketId} className="relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-xl min-h-[150px]">
              {p.stream ? (
                <video 
                  ref={(ref) => { if (ref && p.stream) ref.srcObject = p.stream; }} 
                  autoPlay playsInline 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/50">
                  <div className="w-12 h-12 rounded-full liquid-inset flex items-center justify-center font-bold text-xl text-white/50 mb-2">
                    {p.username?.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-white/30 text-xs font-medium uppercase tracking-widest animate-pulse">Connecting...</p>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs text-white font-medium">
                {p.username}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Chat Room */}
      <div className="w-full md:w-80 flex flex-col bg-white/5 h-64 md:h-auto min-h-0">
        <div className="p-4 border-b border-white/10 bg-black/20">
          <h3 className="text-white text-sm font-bold tracking-widest uppercase">Room Chat</h3>
          <p className="text-[10px] text-white/40 tracking-wider mt-1">{totalUsers} Connected</p>
        </div>
        
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            const sender = isMe ? user : participants.find(p => p.id === msg.senderId);
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-white/40 mb-1 ml-1 font-medium tracking-wide">
                  {isMe ? 'You' : sender?.username || 'Unknown'}
                </span>
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-md ${
                  isMe ? 'bg-red-500/20 border border-red-500/30 text-white rounded-br-none' 
                       : 'bg-white/10 border border-white/10 text-white/90 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>
        
        <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/20 flex gap-2">
          <input 
            type="text" 
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            placeholder="Broadcast message..."
            className="flex-1 liquid-inset px-4 py-2 text-sm text-white placeholder-white/30 rounded-xl"
          />
          <button type="submit" className="p-2 liquid-button-primary rounded-xl text-white">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
