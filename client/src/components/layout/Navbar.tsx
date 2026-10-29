import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  MapPin,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Package,
  LogOut,
  SlidersHorizontal,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { api } from '../../services/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, defaultAddress, logout } = useAuth();
  const { cartCount, cart } = useCart();
  const { wishlistCount } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Fetch categories for search dropdown
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        // silent
      }
    };
    fetchCats();
  }, []);

  // Live search suggestions debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/products/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (res.data.success) {
          setSuggestions(res.data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    navigate(`/products?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-aura-navy text-white shadow-premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          
          {/* 1. Mobile Menu Toggle & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-aura-indigo to-aura-violet flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white leading-none">
                  Aura<span className="text-indigo-400">Mart</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                  Everything You Love
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Delivery Location Selector (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-left transition-colors">
            <MapPin className="w-4 h-4 text-aura-indigo shrink-0" />
            <div className="text-xs">
              <p className="text-gray-400 text-[10px] uppercase font-semibold">Deliver to</p>
              <p className="font-semibold text-white max-w-[130px] truncate">
                {defaultAddress ? `${defaultAddress.city} ${defaultAddress.postalCode}` : 'India (Select PIN)'}
              </p>
            </div>
          </div>

          {/* 3. Search Bar with Category Selector & Typeahead Suggestions */}
          <div ref={searchRef} className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full">
              <div className="hidden md:flex relative shrink-0">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-gray-100 text-aura-navy text-xs font-semibold py-2.5 pl-3 pr-7 rounded-l-xl border-r border-gray-300 focus:outline-none cursor-pointer appearance-none hover:bg-gray-200 transition-colors"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c._id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-3 pointer-events-none" />
              </div>

              <input
                type="text"
                placeholder="Search products, brands, gadgets, apparel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="w-full bg-white text-aura-navy text-sm py-2.5 px-4 rounded-l-xl md:rounded-l-none focus:outline-none placeholder:text-gray-400"
              />

              <button
                type="submit"
                className="bg-aura-indigo hover:bg-indigo-600 text-white px-4 sm:px-5 py-2.5 rounded-r-xl transition-colors flex items-center justify-center shrink-0 shadow-sm"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-modal border border-aura-border overflow-hidden z-50 text-aura-navy py-2">
                <div className="text-[11px] font-bold text-aura-textSecondary px-4 py-1 uppercase tracking-wider">
                  Suggestions
                </div>
                {suggestions.map(s => (
                  <Link
                    key={s.id}
                    to={`/products/${s.slug}`}
                    onClick={() => setShowSuggestions(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-aura-hoverBg transition-colors"
                  >
                    <img src={s.image} alt={s.title} className="w-9 h-9 object-cover rounded-md border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-aura-textPrimary truncate">{s.title}</p>
                      <p className="text-[11px] text-aura-textSecondary">{s.categoryName}</p>
                    </div>
                    <span className="text-xs font-bold text-aura-indigo">
                      ₹{s.price.toLocaleString('en-IN')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 4. Action Icons: Wishlist, Account, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-aura-violet text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-aura-navy">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-colors group"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-aura-indigo text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-aura-navy animate-pulse">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[10px] text-gray-400 font-medium uppercase leading-tight">Cart</span>
                <span className="text-xs font-bold text-white leading-tight">
                  ₹{cart ? cart.grandTotal.toLocaleString('en-IN') : '0'}
                </span>
              </div>
            </Link>

            {/* Account Menu Dropdown */}
            <div ref={accountRef} className="relative">
              <button
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-aura-indigo/30 flex items-center justify-center text-aura-indigo font-bold text-xs">
                  {user ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4 text-white" />}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-[10px] text-gray-400 font-medium leading-tight">
                    {user ? `Hello, ${user.name.split(' ')[0]}` : 'Sign In'}
                  </span>
                  <span className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                    Account <ChevronDown className="w-3 h-3 text-gray-400" />
                  </span>
                </div>
              </button>

              {isAccountOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-modal border border-aura-border z-50 text-aura-navy py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs font-semibold text-aura-textPrimary truncate">{user.name}</p>
                        <p className="text-[11px] text-aura-textSecondary truncate">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>

                      <div className="py-1">
                        <Link
                          to="/account"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-aura-hoverBg hover:text-aura-indigo"
                        >
                          <UserIcon className="w-4 h-4 text-gray-400" /> My Profile & Addresses
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-aura-hoverBg hover:text-aura-indigo"
                        >
                          <Package className="w-4 h-4 text-gray-400" /> My Orders & Tracking
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-aura-hoverBg hover:text-aura-indigo"
                        >
                          <Heart className="w-4 h-4 text-gray-400" /> My Wishlist
                        </Link>

                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsAccountOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-aura-violet hover:bg-purple-50"
                          >
                            <ShieldCheck className="w-4 h-4 text-aura-violet" /> Admin Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => {
                            setIsAccountOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-aura-red hover:bg-red-50 text-left"
                        >
                          <LogOut className="w-4 h-4 text-aura-red" /> Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3">
                      <Link
                        to="/login"
                        onClick={() => setIsAccountOpen(false)}
                        className="block w-full py-2 bg-aura-indigo hover:bg-indigo-600 text-white text-center text-xs font-bold rounded-xl transition-colors shadow-sm"
                      >
                        Sign In
                      </Link>
                      <div className="mt-2.5 text-center text-xs text-gray-500">
                        New customer?{' '}
                        <Link
                          to="/register"
                          onClick={() => setIsAccountOpen(false)}
                          className="text-aura-indigo font-bold hover:underline"
                        >
                          Start here.
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-aura-navy px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10"
            >
              <Home className="w-4 h-4 text-aura-indigo" /> Home
            </Link>
            <Link
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10"
            >
              <SlidersHorizontal className="w-4 h-4 text-aura-indigo" /> All Products
            </Link>
            <Link
              to="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10"
            >
              <Package className="w-4 h-4 text-aura-indigo" /> My Orders
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10"
            >
              <Heart className="w-4 h-4 text-aura-violet" /> Wishlist ({wishlistCount})
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold text-indigo-300 hover:bg-white/10"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-300" /> Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

