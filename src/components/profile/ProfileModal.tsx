import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Save, Check } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { socket } from '@/lib/socket';

export const ProfileModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user, updateUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.trim() === user.username) {
      onClose();
      return;
    }

    const updatedUser = { ...user, username: username.trim() };
    updateUser(updatedUser);
    
    // Broadcast change to server
    socket.emit('updateProfile', updatedUser);
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md liquid-panel p-6 z-10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-light text-white tracking-widest uppercase">Profile Settings</h2>
              <button 
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Static ID Field */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">
                  Permanent Network ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={user.id}
                    disabled
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 font-mono cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-white/30 mt-2">This ID is permanently bound to your device.</p>
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">
                  Display Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full liquid-inset bg-black/50 px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                  placeholder="Enter your name"
                />
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-4 liquid-button-primary text-sm uppercase tracking-widest flex justify-center items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
