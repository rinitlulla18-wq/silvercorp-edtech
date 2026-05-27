import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Globe } from './Globe';
import { SilverCorpLogo } from './SilverCorpLogo';

interface LoginPageProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => Promise<boolean> | boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    // Simulate authentication
    setTimeout(async () => {
      const success = await onLogin(email, password, rememberMe);
      if (success) {
        setIsSuccess(true);
      } else {
        setError(`Invalid credentials. Please check your email and password.`);
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e8edf3] font-['DM_Sans',_sans-serif] flex overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        
        :root {
          --silver: #94a3b8;
          --silver-light: #cbd5e1;
          --silver-dark: #64748b;
          --accent: #f97316;
          --accent-glow: rgba(249,115,22,0.35);
          --bg-dark: #050505;
          --bg-mid: #0f172a;
          --bg-card: rgba(15, 23, 42, 0.7);
          --border: rgba(148,163,184,0.15);
          --text-main: #f8fafc;
          --text-muted: #94a3b8;
        }

        .glass-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          backdrop-filter: blur(20px);
        }

        .input-group:focus-within .input-icon {
          color: var(--accent);
        }

        .bebas {
          font-family: 'Bebas Neue', cursive;
        }

        .globe-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100vw;
          height: 100vh;
          z-index: 0;
          opacity: 0.4;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
      `}</style>

      {/* 3D Globe Background */}
      <div className="globe-container">
        <Globe size={1000} className="opacity-60" />
      </div>

      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10 bg-black/20 border-r border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center p-2 border border-white/10">
              <SilverCorpLogo className="w-full h-full" />
            </div>
            <span className="bebas text-3xl tracking-wider text-white">SILVERCORP <span className="text-orange-500">EDTECH</span></span>
          </div>

          <div className="max-w-md">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold leading-tight mb-6"
            >
              Empowering <br />
              <span className="text-orange-500">Education</span> <br />
              Globally
            </motion.h1>
            <p className="text-slate-400 text-lg">
              The next generation of educational management.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-card rounded-3xl p-8 sm:p-12"
        >
          <div className="text-center mb-10">
            <div className="lg:hidden flex justify-center mb-6">
              <SilverCorpLogo className="w-16 h-16" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Welcome</h2>
            <p className="text-slate-400">Enter your credentials to access the portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative input-group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 input-icon transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@silvercorp.com"
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative input-group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 input-icon transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-between items-center pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border border-white/10 rounded-lg bg-slate-900 peer-checked:bg-orange-600 peer-checked:border-orange-600 transition-all" />
                    <CheckCircle2 className="absolute inset-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity p-1" />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Remember me</span>
                </label>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-3 px-4 rounded-xl flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  isSuccess 
                    ? 'bg-green-500 text-white' 
                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Success!
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-slate-500">
                  Having trouble? Contact IT Support at <br />
                  <a href="mailto:Info@silvercorpedtech.com" className="text-orange-500 hover:underline">Info@silvercorpedtech.com</a>
                </p>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
