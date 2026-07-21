import { useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { socket } from '@/lib/socket';
import { useRoomStore } from '@/store/useRoomStore';
import { useAuthStore, User } from '@/store/useAuthStore';
import { useCallStore } from '@/store/useCallStore';

export const useRoomWebRTC = () => {
  const { user } = useAuthStore();
  const { roomId, participants } = useRoomStore();
  const peersRef = useRef<{ [socketId: string]: Peer.Instance }>({});
  const setLocalStream = useCallStore(state => state.setStreams); // We can reuse setStreams or just manage local stream here
  const addParticipant = useRoomStore(state => state.addParticipant);

  // Re-using useCallStore localStream for convenience
  const localStream = useCallStore(state => state.localStream);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      useCallStore.getState().setStreams(stream, null); // Store local stream
      return stream;
    } catch (err) {
      console.error("Failed to get local stream", err);
      return null;
    }
  };

  const stopLocalStream = () => {
    const stream = useCallStore.getState().localStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      useCallStore.getState().setStreams(null, null);
    }
    // Destroy all peers
    Object.values(peersRef.current).forEach(peer => peer.destroy());
    peersRef.current = {};
  };

  // Called when joining a room and getting the list of existing users
  const joinRoomCall = useCallback((existingUsers: User[], stream: MediaStream) => {
    const mySocketId = socket.id;
    if (!mySocketId) return;
    existingUsers.forEach(existingUser => {
      if (existingUser.socketId && existingUser.socketId !== mySocketId) {
        const peer = createPeer(existingUser.socketId, mySocketId, stream);
        peersRef.current[existingUser.socketId] = peer;
      }
    });
  }, []);

  const createPeer = (userToSignal: string, callerID: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('roomSignal', {
        to: userToSignal,
        from: callerID,
        callerUser: useAuthStore.getState().user,
        signal
      });
    });

    peer.on('stream', remoteStream => {
      // Add remote stream to the participant object
      useRoomStore.setState(state => ({
        participants: state.participants.map(p => 
          p.socketId === userToSignal ? { ...p, stream: remoteStream } : p
        )
      }));
    });

    return peer;
  };

  const addPeer = (incomingSignal: any, callerID: string, stream: MediaStream, callerUser: User) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('roomSignal', {
        to: callerID,
        from: socket.id,
        callerUser: useAuthStore.getState().user,
        signal
      });
    });

    peer.on('stream', remoteStream => {
      useRoomStore.setState(state => ({
        participants: state.participants.map(p => 
          p.socketId === callerID ? { ...p, stream: remoteStream } : p
        )
      }));
    });

    peer.signal(incomingSignal);
    return peer;
  };

  useEffect(() => {
    socket.on('roomJoined', async (existingUsers: User[]) => {
      const stream = await startLocalStream();
      if (stream) {
        joinRoomCall(existingUsers, stream);
      }
    });

    socket.on('userJoinedRoom', (newUser: User) => {
      addParticipant(newUser);
      // Wait for their roomSignal to create the peer
    });

    socket.on('roomSignal', (payload) => {
      const { signal, from, callerUser } = payload;
      const peer = peersRef.current[from];
      const stream = useCallStore.getState().localStream;
      
      if (peer) {
        peer.signal(signal);
      } else {
        if (stream) {
          const newPeer = addPeer(signal, from, stream, callerUser);
          peersRef.current[from] = newPeer;
          addParticipant(callerUser);
        }
      }
    });

    socket.on('userLeftRoom', (socketId: string) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].destroy();
        delete peersRef.current[socketId];
      }
      useRoomStore.getState().removeParticipant(socketId);
    });

    return () => {
      socket.off('roomJoined');
      socket.off('userJoinedRoom');
      socket.off('roomSignal');
      socket.off('userLeftRoom');
    };
  }, [joinRoomCall, addParticipant]);

  return { startLocalStream, stopLocalStream };
};
