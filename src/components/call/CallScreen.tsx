"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallStore } from '@/store/useCallStore';
import { useAuthStore } from '@/store/useAuthStore';
import { VoiceVisualizer } from './VoiceVisualizer';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Volume1, Minimize2 } from 'lucide-react';

export const CallScreen = () => {
  const { user } = useAuthStore();
  const { status, caller, receiver, localStream, remoteStream, answerCallAction, declineCallAction, leaveCallAction, isMinimized, setMinimized, addCallLog } = useCallStore();
  
  const isIncoming = status === 'incoming';
  const isActive = status === 'connected';
  const otherUser = caller?.id === user?.id ? receiver : caller;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLoudspeaker, setIsLoudspeaker] = useState(false);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [bgCacheBuster] = useState(() => new Date().getTime());

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const durationRef = useRef(0);
  useEffect(() => {
    durationRef.current = callDuration;
  }, [callDuration]);

  // Track call end to save log
  useEffect(() => {
    if (status === 'idle' && durationRef.current > 0 && otherUser) {
      addCallLog({
        type: isIncoming ? 'incoming' : 'outgoing',
        username: otherUser.username,
        avatar_url: otherUser.avatar_url,
        duration: durationRef.current
      });
      durationRef.current = 0;
    }
  }, [status, otherUser, isIncoming, addCallLog]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, status]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, status]);

  useEffect(() => {
    // Fetch available audio output devices and default to earpiece if available
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setAudioOutputs(outputs);
        
        if (outputs.length > 0 && remoteVideoRef.current && typeof (remoteVideoRef.current as any).setSinkId === 'function') {
          const earpiece = outputs.find(d => d.label.toLowerCase().includes('earpiece') || d.label.toLowerCase().includes('phone'));
          if (earpiece) {
            (remoteVideoRef.current as any).setSinkId(earpiece.deviceId).catch(console.error);
            setIsLoudspeaker(false);
          } else {
            setIsLoudspeaker(true);
          }
        } else {
          setIsLoudspeaker(true); // Default to speaker if unsupported
        }
      }).catch(console.error);
    } else {
      setIsLoudspeaker(true);
    }
  }, []);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStream.getAudioTracks()[0]?.enabled);
    }
  };

  const toggleSpeaker = async () => {
    if (remoteVideoRef.current && typeof (remoteVideoRef.current as any).setSinkId === 'function' && audioOutputs.length > 0) {
      const targetMode = !isLoudspeaker;
      const targetDevice = audioOutputs.find(d => {
         const label = d.label.toLowerCase();
         return targetMode ? (label.includes('speaker') || label.includes('loud')) : (label.includes('earpiece') || label.includes('phone'));
      });

      if (targetDevice) {
         try {
           await (remoteVideoRef.current as any).setSinkId(targetDevice.deviceId);
           setIsLoudspeaker(targetMode);
           return;
         } catch (e) {
           console.error("Failed to set sink id", e);
         }
      }
    }
    
    // Fallback UI toggle if setSinkId is not supported (e.g. iOS or missing labels)
    setIsLoudspeaker(!isLoudspeaker);
  };

  if (status === 'idle') return null;

  if (isMinimized && isActive) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 liquid-panel p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors shadow-2xl"
          onClick={() => setMinimized(false)}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-black/40 border border-white/10">
            {otherUser?.avatar_url ? (
              <img src={otherUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-light text-xl text-white">
                {otherUser?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col pr-4">
            <h4 className="text-white font-medium text-sm tracking-wide">{otherUser?.username}</h4>
            <p className="text-red-400 font-mono text-xs mt-0.5">{formatTime(callDuration)}</p>
          </div>
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className={`p-3 rounded-full transition-colors ${!isMuted ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            >
              {!isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); leaveCallAction?.(); }}
              className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full flex flex-col relative rounded-none lg:rounded-2xl overflow-hidden bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_10px_40px_rgba(0,0,0,0.5)]"
      >


        {/* FULL BG: Remote Video or fallback */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/call_bg.png?v=${bgCacheBuster}')` }} />
        {remoteStream && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
          />
        )}

        {/* Overlay when no remote video */}
        <div className={`absolute inset-0 pointer-events-none transition-all ${(!isActive || !remoteStream) ? 'bg-black/60 backdrop-blur-md' : 'bg-black/10'}`} />

        {/* Avatar when no video */}
        {(!isActive || !remoteStream) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 pb-36">
            <div className="relative flex items-center justify-center mb-4 w-28 h-28 md:w-36 md:h-36">
              <VoiceVisualizer stream={isActive ? remoteStream : null} isActive={isActive} />
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="relative z-10 w-full h-full rounded-full overflow-hidden bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl"
              >
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <h2 className="text-4xl md:text-5xl font-light text-white drop-shadow-md">
                    {otherUser?.username ? otherUser.username.charAt(0).toUpperCase() : '?'}
                  </h2>
                )}
              </motion.div>
            </div>
            {!isActive && (
              <p className="text-xs font-bold tracking-[0.2em] text-red-400 uppercase drop-shadow-md text-center">
                {isIncoming ? 'Incoming Signal' : 'Establishing Connection...'}
              </p>
            )}
          </div>
        )}

        {/* Local PiP — top right corner */}
        {localStream && (
          <div className="absolute top-3 right-3 z-20 w-24 md:w-28 aspect-[9/16] bg-black rounded-xl overflow-hidden border border-white/20 shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}

        {/* FLOATING BOTTOM CONTROL BAR */}
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 py-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          {/* Name & Status */}
          <div className="mb-3 flex items-center gap-2">
            <h1 className="text-white font-semibold text-base truncate">{otherUser?.username}</h1>
            {isActive && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_red] shrink-0"></span>
                <span className="text-[10px] text-red-400 font-mono tracking-widest font-bold">SECURE</span>
                <span className="text-[10px] text-white/40 font-mono ml-1">{formatTime(callDuration)}</span>
              </>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {isIncoming ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => declineCallAction?.()}
                  className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-black/60 backdrop-blur-md border border-red-500/60 hover:bg-red-600 text-red-400 hover:text-white transition-all text-sm font-semibold"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Decline</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => answerCallAction?.()}
                  className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-black/60 backdrop-blur-md border border-emerald-500/60 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all text-sm font-semibold"
                >
                  <Phone className="w-4 h-4" />
                  <span>Answer</span>
                </motion.button>
              </>
            ) : (
              <>
                <ControlBtn icon={isMuted ? MicOff : Mic} active={!isMuted} onClick={toggleMute} label={isMuted ? 'Unmute' : 'Mute'} />
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => leaveCallAction?.()}
                  className="flex-[1.4] h-12 flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-colors"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </motion.button>
                <ControlBtn icon={isLoudspeaker ? Volume2 : Volume1} active={isLoudspeaker} onClick={toggleSpeaker} label={isLoudspeaker ? 'Speaker' : 'Earpiece'} />
              </>
            )}
          </div>
        </div>
        </motion.div>
    </AnimatePresence>
  );
};

const ControlBtn = ({ icon: Icon, active, onClick, label }: { icon: any, active: boolean, onClick?: () => void, label?: string }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold tracking-wide transition-all ${
      active 
        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15' 
        : 'bg-black/60 border border-red-500/40 text-red-400 hover:bg-red-500/10'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label && <span className="hidden sm:inline text-xs">{label}</span>}
  </motion.button>
);
