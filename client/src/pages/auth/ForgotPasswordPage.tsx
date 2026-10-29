import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        if (res.data.devToken) {
          setDevToken(res.data.devToken);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to process request', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-aura-border p-6 sm:p-8 shadow-premium space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-extrabold text-aura-navy">Forgot Password</h1>
          <p className="text-xs text-aura-textSecondary">
            Enter your registered email address and we'll send you instructions to reset your password.
          </p>
        </div>

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
                className="w-full bg-gray-50 text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-aura-indigo hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Development reset link helper */}
        {devToken && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <p className="font-bold">Development Environment Token:</p>
            <p className="text-[11px] text-amber-800 break-all">Token: {devToken}</p>
            <Link
              to={`/reset-password?token=${devToken}`}
              className="inline-block bg-amber-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Click Here to Reset Password Now
            </Link>
          </div>
        )}

        <div className="text-center text-xs">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-aura-indigo hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

