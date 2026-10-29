import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUp, ShieldCheck, Truck, RotateCcw, CreditCard, Send } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    showToast('Subscribed! Check your inbox for exclusive AuraMart discounts.', 'success');
    setEmail('');
  };

  return (
    <footer className="bg-aura-navy text-white mt-16 border-t border-white/10">
      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className="w-full bg-[#1b253b] hover:bg-[#25324e] py-3 text-xs font-semibold tracking-wider uppercase text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
      >
        <ArrowUp className="w-4 h-4" /> Back to top
      </button>

      {/* Trust Badges Bar */}
      <div className="border-b border-white/10 py-8 bg-[#0d1422]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-aura-indigo shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Free & Fast Delivery</p>
              <p className="text-[11px] text-gray-400">On all orders above ₹499</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-aura-green shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">7 Days Easy Return</p>
              <p className="text-[11px] text-gray-400">Hassle-free refunds & pickups</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-aura-violet shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">100% Secure Checkout</p>
              <p className="text-[11px] text-gray-400">Verified Razorpay Payments</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Cash on Delivery</p>
              <p className="text-[11px] text-gray-400">Pay right at your doorstep</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand info & Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-aura-indigo to-aura-violet flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Aura<span className="text-indigo-400">Mart</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              AuraMart is a modern full-stack e-commerce marketplace powered by cutting-edge web architecture, database persistence, secure payments, and conversational AI assistance.
            </p>

            <div className="pt-2">
              <p className="text-xs font-bold text-white mb-2">Subscribe to our newsletter for ₹500 off your next order</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="bg-white/10 text-white placeholder:text-gray-400 text-xs px-3.5 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:border-aura-indigo flex-1"
                />
                <button
                  type="submit"
                  className="bg-aura-indigo hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Join
                </button>
              </form>
            </div>
          </div>

          {/* Links Column 1: Shop */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Shop Categories</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/products?category=electronics" className="hover:text-white transition-colors">Electronics & Audio</Link></li>
              <li><Link to="/products?category=mobiles-accessories" className="hover:text-white transition-colors">Mobiles & Tablets</Link></li>
              <li><Link to="/products?category=computers-laptops" className="hover:text-white transition-colors">Laptops & Desktops</Link></li>
              <li><Link to="/products?category=fashion" className="hover:text-white transition-colors">Men & Women Fashion</Link></li>
              <li><Link to="/products?category=home-kitchen" className="hover:text-white transition-colors">Home & Kitchen</Link></li>
              <li><Link to="/products?category=beauty-personal-care" className="hover:text-white transition-colors">Beauty & Skincare</Link></li>
            </ul>
          </div>

          {/* Links Column 2: Account & Orders */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Customer Care</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/account" className="hover:text-white transition-colors">My Profile & Addresses</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Track Orders & Invoices</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Deals of the Day</Link></li>
            </ul>
          </div>

          {/* Links Column 3: Trust & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Security & Help</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><span className="hover:text-white cursor-pointer">Razorpay Secure Online</span></li>
              <li><span className="hover:text-white cursor-pointer">7-Day Replacement Policy</span></li>
              <li><span className="hover:text-white cursor-pointer">Privacy & Terms of Service</span></li>
              <li><span className="hover:text-white cursor-pointer">AURA AI Help Assistant</span></li>
              <li><Link to="/admin" className="text-indigo-400 hover:text-indigo-300 font-semibold">Admin Portal</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400">
          <p>© {new Date().getFullYear()} AuraMart Inc. All rights reserved. Built with React, Vite, Node.js, Express & MongoDB.</p>
          <div className="flex items-center gap-4">
            <span>Powered by AURA AI</span>
            <span>•</span>
            <span>Razorpay Payment Gateway</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

