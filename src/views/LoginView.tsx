import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('kritamk286@gmail.com');
  const [password, setPassword] = useState('kritam@098only');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setEmail('kritamk286@gmail.com');
    setPassword('kritam@098only');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden py-12">
      {/* Background subtle accent */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl shadow-xl shadow-blue-600/30 tracking-tight">
            AK
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">AK ENTERPRISES</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
              Shop & Inventory Management System
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
          <div className="mb-5 flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">व्यवस्थापक प्रवेश (Admin Sign In)</h2>
              <p className="text-xs text-slate-400">अधिकृत व्यवस्थापक ईमेल एवं पासवर्ड द्वारा लॉगिन</p>
            </div>
            <ShieldCheck className="w-6 h-6 text-blue-500" />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-700/80 text-rose-200 rounded-xl text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-rose-300">प्रवेश अस्वीकृत (Access Denied)</p>
                <p className="leading-relaxed text-rose-200/90">{error}</p>
              </div>
            </div>
          )}

          {/* Regular Fast Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">ईमेल पता (Email Address)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email-input"
                  type="email"
                  required
                  placeholder="kritamk286@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-xs transition-colors font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">पासवर्ड (Password)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-xs transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-6 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>प्रमाणीकरण जारी है...</span>
              ) : (
                <>
                  <span>कंसोल में प्रवेश करें (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Fill Official Admin Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-2">
            <p className="text-[11px] text-slate-400">अधिकृत एडमिन क्रेडेंशियल (Official Admin Access):</p>
            <button
              type="button"
              onClick={handleFillAdmin}
              className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/60 rounded-xl text-[11px] font-mono text-blue-300 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Click to autofill: <strong>kritamk286@gmail.com</strong> / <strong>kritam@098only</strong></span>
            </button>
          </div>
        </div>

        {/* Security watermark */}
        <p className="text-center text-[11px] text-slate-600">
          AK ENTERPRISES • Real-Time Database • Session Encrypted • IST (UTC+05:30)
        </p>
      </div>
    </div>
  );
};
