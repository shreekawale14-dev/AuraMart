import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleFillDemo = (type: 'customer' | 'admin') => {
    if (type === 'customer') {
      setEmail('customer@auramart.com');
      setPassword('Customer@123');
    } else {
      setEmail('admin@auramart.com');
      setPassword('Admin@AuraMart2026');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-aura-border p-6 sm:p-8 shadow-premium space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-aura-indigo to-aura-violet flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-aura-navy">
              Aura<span className="text-indigo-600">Mart</span>
            </span>
          </Link>
          <h1 className="text-xl font-extrabold text-aura-navy">Sign In to Your Account</h1>
          <p className="text-xs text-aura-textSecondary">
            Access your orders, saved addresses, cart, and personalized AURA AI assistance
          </p>
        </div>

        {/* 1-Click Evaluation Fill Buttons */}
        <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 space-y-2">
          <p className="text-[11px] font-bold text-aura-indigo text-center uppercase tracking-wider">
            Quick Evaluation Auto-Fill
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('customer')}
              className="py-1.5 px-2 bg-white hover:bg-indigo-100 text-aura-navy text-[11px] font-bold rounded-lg border border-indigo-200 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-aura-indigo" />
              <span>Customer Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="py-1.5 px-2 bg-white hover:bg-purple-100 text-purple-900 text-[11px] font-bold rounded-lg border border-purple-200 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-aura-navy block mb-1.5">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-50 text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo focus:bg-white text-aura-navy"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-aura-navy">Password</label>
              <Link to="/forgot-password" className="text-aura-indigo hover:underline text-[11px] font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50 text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo focus:bg-white text-aura-navy"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-aura-indigo hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-aura-textSecondary pt-2 border-t border-aura-border">
          New to AuraMart?{' '}
          <Link to="/register" className="text-aura-indigo font-bold hover:underline">
            Create your account
          </Link>
        </div>

      </div>
    </div>
  );
};

