import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, ArrowLeft, Shield, Sparkles, UserCheck, ArrowRight } from 'lucide-react';
import { useUser } from '../../stores/user.store';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, quickLogin } = useUser();

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      name: 'Alex',
      role: 'Tech Lead',
      email: 'alex@meetdraw.io',
      color: '#4f46e5',
      badge: 'Host / Architecture',
    },
  ];

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(demoEmail);
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 font-sans">
      <div className="w-full max-w-lg glass-panel border border-navy-800 p-8 rounded-3xl shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-accent to-indigo-light flex items-center justify-center font-black text-white shadow-lg shadow-indigo-accent/30">
              MD
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">MeetDraw Sign In</h2>
              <div className="text-[11px] text-emerald-active flex items-center space-x-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-active animate-pulse" />
                <span>Docker MySQL</span>
              </div>
            </div>
          </div>

          <span className="text-[11px] bg-navy-900 text-slate-400 px-2.5 py-1 rounded-lg border border-navy-800">
            Auth Required
          </span>
        </div>

        {/* Notice for required login */}
        {searchParams.get('redirect') && (
          <div className="p-3 bg-indigo-accent/15 border border-indigo-accent/30 rounded-xl text-xs text-indigo-glow flex items-start space-x-2">
            <Shield size={16} className="flex-shrink-0 mt-0.5 text-indigo-light" />
            <span>
              <strong>Authentication Required:</strong> Please identify yourself with an account before entering this meeting room.
            </span>
          </div>
        )}

        {/* 1-Click Quick Demo Accounts (Multi-tab testing friendly!) */}
        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick 1-Click Login (Docker Seed Accounts)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin(acc.email)}
                className="p-3 rounded-xl bg-navy-900/90 hover:bg-navy-850 border border-navy-700 hover:border-indigo-light text-left transition-all duration-150 hover:-translate-y-0.5 group shadow-md"
              >
                <div className="flex items-center space-x-2 mb-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: acc.color }}
                  >
                    {acc.name.charAt(0)}
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-light transition">
                    {acc.name}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{acc.role}</div>
                <div className="text-[9px] text-indigo-glow font-mono mt-1 font-semibold flex items-center justify-between">
                  <span>Login &rarr;</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center my-3">
          <div className="flex-1 h-[1px] bg-navy-800" />
          <span className="px-3 text-[11px] text-slate-500 uppercase tracking-wider">or sign in with credentials</span>
          <div className="flex-1 h-[1px] bg-navy-800" />
        </div>

        {error && (
          <div className="p-3 bg-rose-alert/15 border border-rose-alert/30 rounded-xl text-xs text-rose-alert font-medium">
            {error}
          </div>
        )}

        {/* Custom Login Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@meetdraw.io"
              className="w-full bg-navy-900 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-navy-700 focus:outline-none focus:border-indigo-light"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-navy-900 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-navy-700 focus:outline-none focus:border-indigo-light"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-accent hover:bg-indigo-light font-bold text-white text-xs py-3 rounded-xl transition shadow-xl shadow-indigo-accent/30 flex items-center justify-center space-x-2"
          >
            <LogIn size={15} />
            <span>{loading ? 'Authenticating via MySQL...' : 'Sign In & Enter'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-1">
          Need a new workspace account?{' '}
          <Link to="/register" className="text-indigo-light hover:underline font-semibold">
            Register to Docker MySQL
          </Link>
        </div>
      </div>
    </div>
  );
};
