"use client";

import React, { useEffect } from 'react';
import { socket } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useCallStore } from '@/store/useCallStore';
import { useChatStore } from '@/store/useChatStore';
import { useMatchStore } from '@/store/useMatchStore';
import { useRoomWebRTC } from '@/hooks/useRoomWebRTC';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, setOnlineUsers } = useAuthStore();
  const { startCall, answerCall, declineCall, leaveCall } = useWebRTC();
  const setCallActions = useCallStore(state => state.setCallActions);
  
  // Initialize Room WebRTC Mesh logic globally
  useRoomWebRTC();

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

      socket.on('receiveMessage', (data: { from: string, text: string, timestamp: number }) => {
        const message = {
          id: `${data.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          senderId: data.from,
          text: data.text,
          timestamp: data.timestamp
        };
        useChatStore.getState().addMessage(data.from, message);
      });

      socket.on('matchFound', (stranger) => {
        useMatchStore.getState().handleMatchFound(stranger);
      });

      socket.on('strangerLeft', () => {
        useMatchStore.getState().handleStrangerLeft();
      });

      return () => {
        socket.off('onlineUsers');
        socket.off('receiveMessage');
        socket.off('matchFound');
        socket.off('strangerLeft');
        socket.disconnect();
      };
    }
  }, [user, setOnlineUsers]);

  return <>{children}</>;
};
