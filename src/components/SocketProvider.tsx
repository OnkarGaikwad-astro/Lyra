"use client";

import React, { useEffect } from 'react';
import { socket } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useCallStore } from '@/store/useCallStore';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, setOnlineUsers } = useAuthStore();
  const { startCall, answerCall, declineCall, leaveCall } = useWebRTC();
  const setCallActions = useCallStore(state => state.setCallActions);

  useEffect(() => {
    setCallActions({
      start: startCall,
      answer: answerCall,
      decline: declineCall,
      leave: leaveCall
    });
  }, [startCall, answerCall, declineCall, leaveCall, setCallActions]);

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('register', user);

      socket.on('onlineUsers', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        socket.off('onlineUsers');
        socket.disconnect();
      };
    }
  }, [user, setOnlineUsers]);

  return <>{children}</>;
};
