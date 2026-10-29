import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  Star
} from 'lucide-react';
import { api } from '../services/api';
import { IProduct, ICategory } from '../types';
import { ProductCard } from '../components/product/ProductCard';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [featured, setFeatured] = useState<{
    trending: IProduct[];
    bestsellers: IProduct[];
    deals: IProduct[];
    topRated: IProduct[];
  }>({
    trending: [],
    bestsellers: [],
    deals: [],
    topRated: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [catsRes, featRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products/featured')
        ]);

        if (catsRes.data.success) {
          setCategories(catsRes.data.categories);
        }
        if (featRes.data.success) {
          setFeatured(featRes.data.data);
        }
      } catch (err) {
        console.warn('[Home Data Error]:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="space-y-12 pb-12">
      
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-aura-navy via-[#1e1b4b] to-[#0f172a] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-semibold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-aura-violet" />
              <span>Next-Gen E-Commerce with AURA AI Assistance</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Everything You Love, <br />
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                All in One Place.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed">
              Discover millions of products across Electronics, Fashion, Home, Beauty, and Groceries. Experience lightning-fast delivery, secure Razorpay checkout, and personal shopping guidance by AURA AI.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/products"
                className="bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Shop All Departments</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/products?sort=discount-desc"
                className="bg-white/10 hover:bg-white/15 text-white font-bold text-sm px-6 py-3.5 rounded-2xl backdrop-blur-sm border border-white/20 transition-all flex items-center gap-2"
              >
                <Tag className="w-4 h-4 text-aura-amber" />
                <span>Today's Top Deals</span>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-left">
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">100%</p>
                <p className="text-[11px] text-gray-400">Authentic Brands</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">FREE</p>
                <p className="text-[11px] text-gray-400">Delivery over ₹499</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">7 Days</p>
                <p className="text-[11px] text-gray-400">Hassle-Free Returns</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Card Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-white/10 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/20 shadow-modal">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-aura-indigo text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Featured Launch
                </span>
                <div className="flex items-center gap-1 text-xs text-amber-300 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>4.9 / 5.0 Rating</span>
                </div>
              </div>

              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-black/20 mb-4 border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
                  alt="Sony WH-1000XM5"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Sony Electronics</p>
                <h3 className="text-base font-bold text-white mb-2 line-clamp-1">
                  Sony WH-1000XM5 Wireless ANC Headphones
                </h3>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-extrabold text-white">₹29,741</span>
                  <span className="text-xs text-gray-400 line-through">₹34,990</span>
                  <span className="text-xs font-bold text-green-400">15% OFF</span>
                </div>
                <Link
                  to="/products/sony-wh-1000xm5-wireless-noise-cancelling-headphones"
                  className="block w-full text-center bg-white hover:bg-gray-100 text-aura-navy font-bold text-xs py-3 rounded-xl transition-colors shadow-md"
                >
                  View Details & Order
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-aura-navy tracking-tight">
              Explore Popular Departments
            </h2>
            <p className="text-xs sm:text-sm text-aura-textSecondary">
              Browse top categories with handpicked genuine selections
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-bold text-aura-indigo hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {categories.slice(0, 10).map(cat => (
            <Link
              key={cat._id}
              to={`/products?category=${cat.slug}`}
              className="group bg-white rounded-2xl border border-aura-border p-3 sm:p-4 hover:border-aura-indigo/40 hover:shadow-card-hover transition-all flex flex-col items-center text-center overflow-hidden"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gray-50 mb-3 border border-aura-border group-hover:scale-105 transition-transform">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-aura-textPrimary group-hover:text-aura-indigo transition-colors line-clamp-1">
                {cat.name}
              </h3>
              <p className="text-[11px] text-aura-textSecondary mt-0.5">
                {cat.productCount ? `${cat.productCount} items` : 'Explore'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Trending Products Carousel/Grid */}
      {featured.trending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-aura-indigo flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-aura-navy tracking-tight">
                  Trending on AuraMart
                </h2>
                <p className="text-xs sm:text-sm text-aura-textSecondary">
                  Most viewed and added to carts this week
                </p>
              </div>
            </div>

            <Link
              to="/products?sort=popular"
              className="text-xs sm:text-sm font-bold text-aura-indigo hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Explore More</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.trending.slice(0, 4).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Deals of the Day (Special Discount Showcase) */}
      {featured.deals.length > 0 && (
        <section className="bg-gradient-to-r from-red-50 via-pink-50 to-amber-50 py-10 border-y border-red-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-aura-red flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-aura-navy tracking-tight">
                      Deals of the Day
                    </h2>
                    <span className="bg-aura-red text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase animate-pulse">
                      Limited Time
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-aura-textSecondary">
                    Grab up to 50% discount on top-rated electronics and fashion
                  </p>
                </div>
              </div>

              <Link
                to="/products?sort=discount-desc"
                className="text-xs sm:text-sm font-bold text-aura-red hover:underline flex items-center gap-1"
              >
                <span>See All Deals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featured.deals.slice(0, 4).map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Bestsellers Section */}
      {featured.bestsellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-aura-navy tracking-tight">
                  AuraMart Bestsellers
                </h2>
                <p className="text-xs sm:text-sm text-aura-textSecondary">
                  Consistently highest rated by verified shoppers
                </p>
              </div>
            </div>

            <Link
              to="/products?sort=rating-desc"
              className="text-xs sm:text-sm font-bold text-aura-indigo hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.bestsellers.slice(0, 4).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Why Shop on AuraMart */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-white rounded-3xl border border-aura-border p-6 sm:p-10 shadow-subtle">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-extrabold text-aura-navy">The AuraMart Standard</h2>
            <p className="text-xs sm:text-sm text-aura-textSecondary mt-1">
              Built with rigorous software engineering and dedicated customer obsession.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-aura-bg border border-aura-border text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-aura-indigo flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-aura-navy mb-1">AURA AI Intelligence</h3>
              <p className="text-xs text-aura-textSecondary leading-relaxed">
                Personalized product recommendations and real-time order tracking grounded in live catalog data.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-aura-bg border border-aura-border text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-green-100 text-aura-green flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-aura-navy mb-1">Razorpay Verified Payments</h3>
              <p className="text-xs text-aura-textSecondary leading-relaxed">
                Cryptographically signed payments with multi-mode checkout: UPI, Credit/Debit cards, NetBanking & Cash on Delivery.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-aura-bg border border-aura-border text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-aura-navy mb-1">Express Fast Delivery</h3>
              <p className="text-xs text-aura-textSecondary leading-relaxed">
                Standard delivery is completely free on all orders above ₹499 with real-time order lifecycle tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

