import { useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { socket } from '@/lib/socket';
import { useCallStore } from '@/store/useCallStore';
import { useAuthStore } from '@/store/useAuthStore';
import { User } from '@/store/useAuthStore';

export const useWebRTC = () => {
  const { user } = useAuthStore();
  const setCallStatus = useCallStore(state => state.setCallStatus);
  const setParticipants = useCallStore(state => state.setParticipants);
  const setStreams = useCallStore(state => state.setStreams);
  const endCall = useCallStore(state => state.endCall);
  
  const peerRef = useRef<Peer.Instance | null>(null);

  useEffect(() => {
    socket.on('callUser', async ({ from, signal, callerUser }) => {
      if (callerUser) {
        setParticipants(callerUser, user);
        setCallStatus('incoming');
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setStreams(stream, null);
          // Store their signal to accept later
          (window as any).incomingSignal = signal;
        } catch (err) {
          console.error("Failed to get local audio/video", err);
        }
      }
    });

    socket.on('callAccepted', (signal) => {
      setCallStatus('connected');
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });

    socket.on('callDeclined', () => {
      handleEndCall();
    });

    socket.on('callEnded', () => {
      handleEndCall();
    });

    return () => {
      socket.off('callUser');
      socket.off('callAccepted');
      socket.off('callDeclined');
      socket.off('callEnded');
    };
  }, [user, setCallStatus, setParticipants, setStreams]);

  const handleEndCall = useCallback(() => {
    const localStream = useCallStore.getState().localStream;
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    endCall();
  }, [endCall]);

  const startCall = useCallback(async (userToCall: User) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStreams(stream, null);
      setParticipants(user, userToCall);
      setCallStatus('outgoing');

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on('signal', (data) => {
        socket.emit('callUser', {
          userToCall: (userToCall as any).socketId,
          signalData: data,
          from: socket.id,
          callerUser: user,
        });
      });

      peer.on('stream', (remoteStream) => {
        setStreams(stream, remoteStream);
      });

      peerRef.current = peer;
    } catch (err) {
      console.error("Failed to get local audio", err);
    }
  }, [user, setStreams, setParticipants, setCallStatus]);

  const answerCall = useCallback(() => {
    setCallStatus('connected');
    
    const localStream = useCallStore.getState().localStream;
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream || undefined,
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { 
        signal: data, 
        to: (useCallStore.getState().caller as any)?.socketId 
      });
    });

    peer.on('stream', (remoteStream) => {
      const currentLocal = useCallStore.getState().localStream;
      setStreams(currentLocal, remoteStream);
    });

    peer.signal((window as any).incomingSignal);
    peerRef.current = peer;
  }, [setCallStatus, setStreams]);

  const declineCall = useCallback(() => {
    socket.emit('declineCall', { to: (useCallStore.getState().caller as any)?.socketId });
    handleEndCall();
  }, [handleEndCall]);

  const leaveCall = useCallback(() => {
    socket.emit('leaveCall', { 
      to: (useCallStore.getState().status === 'outgoing' || useCallStore.getState().status === 'connected') 
        ? (useCallStore.getState().receiver as any)?.socketId || (useCallStore.getState().caller as any)?.socketId
        : undefined 
    });
    handleEndCall();
  }, [handleEndCall]);

  return { startCall, answerCall, declineCall, leaveCall };
};
