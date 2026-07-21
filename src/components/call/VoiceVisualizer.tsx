import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const VoiceVisualizer = ({ stream, isActive }: { stream: MediaStream | null, isActive: boolean }) => {
  const [volume, setVolume] = useState(0);
  
  useEffect(() => {
    if (!isActive || !stream) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let animationId: number;
    
    const analyze = () => {
      animationId = requestAnimationFrame(analyze);
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for(let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      
      // Normalize avg to a scale between 1 and 1.3
      const normalizedVolume = 1 + (avg / 255) * 0.3;
      setVolume(normalizedVolume);
    };
    
    analyze();
    
    return () => {
      cancelAnimationFrame(animationId);
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [stream, isActive]);

  if (!isActive) return null;

  return (
    <motion.div 
      animate={{ scale: volume, opacity: volume > 1.05 ? 0.6 : 0 }}
      transition={{ type: 'tween', duration: 0.1 }}
      className="absolute inset-[-10px] md:inset-[-15px] rounded-full border border-red-500 bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.4)] pointer-events-none"
    />
  );
};
