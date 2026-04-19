import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const [showPassword, setShowPassword] = useState(false);

  const [shakeKey, setShakeKey] = useState(0);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    setError('');

    const res = await login(username, password);
    if (!res.success) {
      setError(res.error);
      setShakeKey(prev => prev + 1);
    }

    setIsLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password || !displayName.trim() || !confirmPassword) {
      setError('Please fill in all fields');
      setShakeKey(prev => prev + 1);
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      setShakeKey(prev => prev + 1);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setShakeKey(prev => prev + 1);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    setError('');

    const res = await signup(username, displayName, password);
    if (!res.success) {
      setError(res.error);
      if (res.suggestions) setSuggestions(res.suggestions);
      else setSuggestions([]);
      setShakeKey(prev => prev + 1);
    }

    setIsLoading(false);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
    setSuggestions([]);
    setUsername('');
    setPassword('');
    setDisplayName('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const pwdStrength = mode === 'signup' ? getPasswordStrength(password) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        key={shakeKey}
        animate={shakeKey > 0 ? { x: [0, -8, 8, -8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden"
        >
          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-blue-300 to-pink-300 mb-2">
              StudySync
            </h1>
            <p className="text-white/60 text-sm">Your personal study planner</p>
          </div>

          {/* Form Content */}
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      placeholder="Enter your username"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all pr-10"
                        placeholder="Enter your password"
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
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-300 text-sm text-center">
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-6 bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white font-semibold py-3 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 size={18} className="animate-spin" />}
                    {isLoading ? 'Logging in...' : 'Login'}
                  </button>

                  <p className="text-center text-sm text-white/50 mt-4">
                    Don't have an account?{' '}
                    <button type="button" onClick={toggleMode} className="text-violet-300 hover:text-violet-200 font-medium transition-colors" disabled={isLoading}>
                      Sign up
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignup}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      placeholder="Your full name"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => {
                        setUsername(e.target.value);
                        setSuggestions([]);
                        if (error === 'Username already taken') setError('');
                      }}
                      className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      placeholder="Choose a username (min 3 chars)"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all pr-10"
                        placeholder="Create a password (min 6 chars)"
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
                    {password.length > 0 && pwdStrength && (
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
                    <label className="block text-xs font-medium text-white/60 mb-1">Confirm Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-300 text-sm text-center">
                      {error}
                    </motion.p>
                  )}

                  {suggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center gap-2 mt-2">
                      <p className="text-xs text-white/50">Try one of these instead:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {suggestions.map(sug => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => {
                              setUsername(sug);
                              setError('');
                              setSuggestions([]);
                            }}
                            className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-violet-300 hover:text-violet-200 transition-colors"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-6 bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white font-semibold py-3 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 size={18} className="animate-spin" />}
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <p className="text-center text-sm text-white/50 mt-4">
                    Already have an account?{' '}
                    <button type="button" onClick={toggleMode} className="text-violet-300 hover:text-violet-200 font-medium transition-colors" disabled={isLoading}>
                      Log in
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
