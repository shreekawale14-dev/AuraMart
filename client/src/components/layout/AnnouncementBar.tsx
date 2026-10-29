import React from 'react';
import { Truck, Sparkles, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-aura-navy text-white text-xs font-medium py-2 px-4 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Truck className="w-3.5 h-3.5 text-aura-indigo shrink-0" />
          <span>
            FREE Delivery on all orders above <strong className="text-white">₹499</strong> across India!
          </span>
          <span className="hidden md:inline text-white/30">|</span>
          <span className="hidden md:inline text-indigo-200">
            Use code <span className="bg-aura-indigo/30 px-1.5 py-0.5 rounded font-mono font-bold text-white">AURA10</span> for 10% off
          </span>
        </div>

        <div className="flex items-center gap-4 text-white/80 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-aura-violet" />
            <span>24/7 AURA AI Assistant Active</span>
          </div>
          <span className="text-white/30">|</span>
          <Link to="/products" className="hover:text-white transition-colors underline underline-offset-2">
            Explore Deals
          </Link>
        </div>
      </div>
    </div>
  );
};

