import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function ProfileModal({ isOpen, onClose }) {
  const { currentUser, updatePassword } = useAuth();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  if (!currentUser) return null;

  const getPasswordStrength = (pwd) => {
    if (pwd.length === 0) return { label: '', color: 'bg-transparent' };
    if (pwd.length < 6) return { label: 'Weak', color: 'bg-red-500' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    if (strength < 2) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      setShakeKey(prev => prev + 1);
      return;
    }
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setShakeKey(prev => prev + 1);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setShakeKey(prev => prev + 1);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    const res = await updatePassword(oldPassword, newPassword);
    
    if (!res.success) {
      setError(res.error);
      setShakeKey(prev => prev + 1);
    } else {
      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }
    
    setIsLoading(false);
  };

  const pwdStrength = getPasswordStrength(newPassword);
  
  const joinedDate = new Date(currentUser.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            key={shakeKey}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={shakeKey > 0 ? { x: [0, -8, 8, -8, 0], opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <User size={24} className="text-violet-400" />
                Profile Settings
              </h2>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Details */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{currentUser.displayName}</h3>
                    <p className="text-sm text-white/60">@{currentUser.username}</p>
                    <p className="text-xs text-white/40 mt-1">Joined {joinedDate}</p>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div>
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
                  <Key size={16} />
                  Change Password
                </h3>
                
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      placeholder="Enter current password"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all pr-10"
                        placeholder="Create new password (min 6 chars)"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {newPassword.length > 0 && pwdStrength && (
                      <div className="flex items-center gap-2 mt-2 px-1">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${pwdStrength.color} transition-all duration-300`} 
                            style={{ width: pwdStrength.label === 'Weak' ? '33%' : pwdStrength.label === 'Medium' ? '66%' : '100%' }}
                          />
                        </div>
                        <span className="text-[10px] text-white/50 w-10">{pwdStrength.label}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Confirm New Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      placeholder="Confirm new password"
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-300 text-sm text-center">
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 size={16} className="animate-spin" />}
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
