import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    street: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    addressType: 'Home' as 'Home' | 'Work' | 'Other',
    isDefaultAddress: true,
    acceptTerms: false
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (!form.acceptTerms) {
      showToast('Please accept the Terms & Privacy Policy to register.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const success = await register(form);
      if (success) {
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-aura-border p-6 sm:p-8 shadow-premium space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-aura-indigo to-aura-violet flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-aura-navy">
              Aura<span className="text-indigo-600">Mart</span>
            </span>
          </Link>
          <h1 className="text-xl font-extrabold text-aura-navy">Create Your AuraMart Account</h1>
          <p className="text-xs text-aura-textSecondary">
            Join thousands of shoppers for verified genuine products and AURA AI recommendations
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-aura-navy block mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Patel"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
            </div>

            <div>
              <label className="font-bold text-aura-navy block mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="priya@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
            </div>

            <div>
              <label className="font-bold text-aura-navy block mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
            </div>

            <div>
              <label className="font-bold text-aura-navy block mb-1">Address Label</label>
              <select
                value={form.addressType}
                onChange={e => setForm({ ...form, addressType: e.target.value as any })}
                className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-aura-navy block mb-1">Password (Min 6 chars) *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
            </div>

            <div>
              <label className="font-bold text-aura-navy block mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
            </div>
          </div>

          {/* Delivery Address Section */}
          <div className="border-t border-aura-border pt-4">
            <h3 className="font-extrabold text-aura-navy uppercase tracking-wider text-[11px] mb-3">
              Initial Delivery Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  placeholder="Street Address, House/Flat No., Road Name *"
                  value={form.street}
                  onChange={e => setForm({ ...form, street: e.target.value })}
                  className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Apartment, Landmark (Optional)"
                  value={form.addressLine2}
                  onChange={e => setForm({ ...form, addressLine2: e.target.value })}
                  className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
                />
              </div>

              <div>
                <input
                  type="text"
                  required
                  placeholder="City *"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
                />
              </div>

              <div>
                <input
                  type="text"
                  required
                  placeholder="State *"
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
                />
              </div>

              <div>
                <input
                  type="text"
                  required
                  placeholder="PIN Code *"
                  value={form.postalCode}
                  onChange={e => setForm({ ...form, postalCode: e.target.value })}
                  className="w-full bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
                />
              </div>
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-aura-navy">
              <input
                type="checkbox"
                checked={form.isDefaultAddress}
                onChange={e => setForm({ ...form, isDefaultAddress: e.target.checked })}
                className="w-4 h-4 rounded text-aura-indigo"
              />
              <span>Set this as my default delivery address</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-aura-navy">
              <input
                type="checkbox"
                required
                checked={form.acceptTerms}
                onChange={e => setForm({ ...form, acceptTerms: e.target.checked })}
                className="w-4 h-4 rounded text-aura-indigo"
              />
              <span>I accept AuraMart Terms & Conditions and Privacy Policy</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-aura-indigo hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-aura-textSecondary pt-2 border-t border-aura-border">
          Already have an account?{' '}
          <Link to="/login" className="text-aura-indigo font-bold hover:underline">
            Sign In here
          </Link>
        </div>

      </div>
    </div>
  );
};

