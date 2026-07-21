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

  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const [isMuted, setIsMuted] = useState(false);
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
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    // Fetch available audio output devices and default to earpiece if available
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setAudioOutputs(outputs);
        
        if (outputs.length > 0 && remoteAudioRef.current && typeof (remoteAudioRef.current as any).setSinkId === 'function') {
          const earpiece = outputs.find(d => d.label.toLowerCase().includes('earpiece') || d.label.toLowerCase().includes('phone'));
          if (earpiece) {
            (remoteAudioRef.current as any).setSinkId(earpiece.deviceId).catch(console.error);
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
    if (remoteAudioRef.current && typeof (remoteAudioRef.current as any).setSinkId === 'function' && audioOutputs.length > 0) {
      const targetMode = !isLoudspeaker;
      const targetDevice = audioOutputs.find(d => {
         const label = d.label.toLowerCase();
         return targetMode ? (label.includes('speaker') || label.includes('loud')) : (label.includes('earpiece') || label.includes('phone'));
      });

      if (targetDevice) {
         try {
           await (remoteAudioRef.current as any).setSinkId(targetDevice.deviceId);
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-12"
      >
        <audio ref={remoteAudioRef} autoPlay />

        {/* The Calling Window - Perfect Border & Mobile Responsive */}
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl aspect-[3/4] sm:aspect-square md:aspect-[4/3] rounded-[2rem] overflow-hidden flex flex-col p-6 md:p-10 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('/call_bg.png?v=${bgCacheBuster}')`,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.15), 0 30px 60px rgba(0,0,0,0.8)'
          }}
        >
          {/* Dark overlay inside the window for contrast against the image */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />

          {isActive && (
            <button 
              onClick={() => setMinimized(true)}
              className="absolute top-4 right-4 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all z-20 backdrop-blur-sm border border-white/5 hover:border-white/20"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          )}

          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Top Section: Avatar & Details */}
            <div className="flex flex-col items-center mt-4 md:mt-10">
              
              {/* Avatar Wrapper */}
              <div className="relative flex items-center justify-center mb-6 w-28 h-28 md:w-32 md:h-32">
                <VoiceVisualizer stream={isActive ? remoteStream : null} isActive={isActive} />
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="relative z-10 w-full h-full rounded-full overflow-hidden bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl"
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
                <h2 className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-red-400 uppercase mb-2 drop-shadow-md text-center">
                  {isIncoming ? 'Incoming Signal' : 'Establishing Connection...'}
                </h2>
              )}
              <h1 className="text-3xl md:text-4xl font-light text-white mb-2 tracking-wide drop-shadow-lg text-center break-all px-4">{otherUser?.username}</h1>
              
              {isActive && (
                <div className="flex flex-col items-center gap-2 mt-4">
                  <div className="text-sm md:text-base font-light text-white/80 tracking-[0.2em] font-mono drop-shadow-md">
                    {formatTime(callDuration)}
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full indicator-primary shadow-[0_0_10px_red]"></span>
                    <p className="text-red-400 font-mono tracking-widest uppercase text-[10px] md:text-xs font-bold">Secure Connection</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Section: Controls */}
            <div className="w-full flex justify-center gap-6 md:gap-8 pb-4 md:pb-0">
              {isIncoming ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => declineCallAction?.()}
                    className="w-16 h-16 flex items-center justify-center backdrop-blur-md bg-red-500/20 border border-red-500 hover:bg-red-600 rounded-full text-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => answerCallAction?.()}
                    className="w-16 h-16 flex items-center justify-center backdrop-blur-md bg-emerald-500/20 border border-emerald-500 hover:bg-emerald-600 rounded-full text-emerald-500 hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    <Phone className="w-6 h-6" />
                  </motion.button>
                </>
              ) : (
                <>
                  <ControlBtn 
                    icon={isMuted ? MicOff : Mic} 
                    active={!isMuted} 
                    onClick={toggleMute} 
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => leaveCallAction?.()}
                    className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] text-white mx-1 md:mx-2 transition-colors self-center"
                  >
                    <PhoneOff className="w-7 h-7 md:w-8 md:h-8" />
                  </motion.button>
                  <ControlBtn 
                    icon={isLoudspeaker ? Volume2 : Volume1} 
                    active={isLoudspeaker} 
                    onClick={toggleSpeaker} 
                  />
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ControlBtn = ({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick?: () => void }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className={`w-14 h-14 rounded-full flex items-center justify-center self-center transition-all ${
      active 
        ? 'liquid-button !bg-white/10 hover:!bg-white/20 text-white border-white/20' 
        : 'liquid-button !bg-black/60 border-red-500/50 text-red-500'
    }`}
  >
    <Icon className="w-5 h-5" />
  </motion.button>
);
