import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  Filter,
  X,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  PackageOpen
} from 'lucide-react';
import { api } from '../services/api';
import { IProduct, ICategory } from '../types';
import { ProductCard } from '../components/product/ProductCard';

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // URL search state
  const currentCategory = searchParams.get('category') || 'all';
  const currentBrand = searchParams.get('brand') || 'all';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentRating = searchParams.get('minRating') || '';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('q') || '';

  // Local state for price inputs
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams(searchParams);
        if (!params.has('limit')) params.set('limit', '12');

        const res = await api.get(`/products?${params.toString()}`);
        if (res.data.success) {
          setProducts(res.data.products);
          setTotalPages(res.data.pagination.totalPages);
          setTotalCount(res.data.pagination.total);
          setAvailableBrands(res.data.facets?.brands || []);
        }
      } catch (err) {
        console.warn('[Fetch Products Error]:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(next);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (minPriceInput) next.set('minPrice', minPriceInput);
    else next.delete('minPrice');

    if (maxPriceInput) next.set('maxPrice', maxPriceInput);
    else next.delete('maxPrice');

    next.set('page', '1');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    if (searchQuery) next.set('q', searchQuery);
    setSearchParams(next);
    setMinPriceInput('');
    setMaxPriceInput('');
  };

  const hasActiveFilters =
    currentCategory !== 'all' ||
    currentBrand !== 'all' ||
    Boolean(currentMinPrice) ||
    Boolean(currentMaxPrice) ||
    Boolean(currentRating) ||
    currentInStock;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Page Title & Search context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-aura-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-aura-navy tracking-tight">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products Catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-aura-textSecondary mt-1">
            Showing <strong className="text-aura-navy">{totalCount}</strong> items available across all categories
          </p>
        </div>

        {/* Sorting Dropdown & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-white border border-aura-border px-3.5 py-2 rounded-xl text-xs font-bold text-aura-navy shadow-sm"
          >
            <Filter className="w-4 h-4 text-aura-indigo" />
            <span>Filters ({hasActiveFilters ? 'Active' : 'All'})</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-aura-textSecondary hidden sm:inline">Sort by:</span>
            <select
              value={currentSort}
              onChange={e => updateParam('sort', e.target.value)}
              className="bg-white text-aura-navy text-xs font-semibold py-2 px-3 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo cursor-pointer shadow-sm"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Customer Rating</option>
              <option value="popular">Popularity / Bestsellers</option>
              <option value="discount-desc">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <span className="text-xs font-bold text-aura-textSecondary">Active Filters:</span>
          {currentCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-aura-indigo text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
              Category: {categories.find(c => c.slug === currentCategory)?.name || currentCategory}
              <button onClick={() => updateParam('category', null)}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {currentBrand !== 'all' && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-aura-indigo text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
              Brand: {currentBrand}
              <button onClick={() => updateParam('brand', null)}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {(currentMinPrice || currentMaxPrice) && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-aura-indigo text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
              Price: ₹{currentMinPrice || '0'} - ₹{currentMaxPrice || 'Max'}
              <button onClick={() => { updateParam('minPrice', null); updateParam('maxPrice', null); setMinPriceInput(''); setMaxPriceInput(''); }}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {currentRating && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-aura-indigo text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
              {currentRating}★ & Above
              <button onClick={() => updateParam('minRating', null)}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {currentInStock && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-aura-indigo text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
              In Stock Only
              <button onClick={() => updateParam('inStock', null)}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-aura-red hover:underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid & Filters layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-aura-border shadow-subtle space-y-6">
            
            {/* Category Filter */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-aura-navy mb-3">
                Department
              </h3>
              <ul className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar text-xs">
                <li>
                  <button
                    onClick={() => updateParam('category', 'all')}
                    className={`w-full text-left py-1 px-2 rounded-lg transition-colors ${
                      currentCategory === 'all'
                        ? 'font-bold text-aura-indigo bg-indigo-50'
                        : 'text-aura-textSecondary hover:text-aura-navy hover:bg-gray-50'
                    }`}
                  >
                    All Departments
                  </button>
                </li>
                {categories.map(c => (
                  <li key={c._id}>
                    <button
                      onClick={() => updateParam('category', c.slug)}
                      className={`w-full text-left py-1 px-2 rounded-lg transition-colors flex items-center justify-between ${
                        currentCategory === c.slug
                          ? 'font-bold text-aura-indigo bg-indigo-50'
                          : 'text-aura-textSecondary hover:text-aura-navy hover:bg-gray-50'
                      }`}
                    >
                      <span>{c.name}</span>
                      {c.productCount !== undefined && (
                        <span className="text-[11px] text-gray-400">({c.productCount})</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Filter */}
            <div className="border-t border-aura-border pt-5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-aura-navy mb-3">
                Price (₹)
              </h3>
              <form onSubmit={handlePriceApply} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={e => setMinPriceInput(e.target.value)}
                    className="w-full bg-gray-50 text-xs px-2.5 py-1.5 rounded-lg border border-aura-border focus:outline-none focus:border-aura-indigo"
                  />
                  <span className="text-xs text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={e => setMaxPriceInput(e.target.value)}
                    className="w-full bg-gray-50 text-xs px-2.5 py-1.5 rounded-lg border border-aura-border focus:outline-none focus:border-aura-indigo"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-aura-navy hover:bg-aura-indigo text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Apply Price
                </button>
              </form>
            </div>

            {/* Rating Filter */}
            <div className="border-t border-aura-border pt-5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-aura-navy mb-3">
                Customer Rating
              </h3>
              <div className="space-y-1.5 text-xs">
                {[4, 3, 2, 1].map(stars => (
                  <button
                    key={stars}
                    onClick={() => updateParam('minRating', currentRating === String(stars) ? null : String(stars))}
                    className={`w-full flex items-center gap-2 py-1 px-2 rounded-lg transition-colors ${
                      currentRating === String(stars) ? 'bg-amber-50 font-bold' : 'hover:bg-gray-50 text-aura-textSecondary'
                    }`}
                  >
                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span>& Up</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In-Stock Filter */}
            <div className="border-t border-aura-border pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-aura-navy">
                <input
                  type="checkbox"
                  checked={currentInStock}
                  onChange={e => updateParam('inStock', e.target.checked ? 'true' : null)}
                  className="w-4 h-4 rounded text-aura-indigo focus:ring-aura-indigo"
                />
                <span>Include In-Stock Only</span>
              </label>
            </div>

            {/* Brand Filter */}
            {availableBrands.length > 0 && (
              <div className="border-t border-aura-border pt-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-aura-navy mb-3">
                  Brand
                </h3>
                <ul className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar text-xs">
                  {availableBrands.map(b => (
                    <li key={b}>
                      <button
                        onClick={() => updateParam('brand', currentBrand === b ? null : b)}
                        className={`w-full text-left py-1 px-2 rounded-lg transition-colors flex items-center justify-between ${
                          currentBrand === b
                            ? 'font-bold text-aura-indigo bg-indigo-50'
                            : 'text-aura-textSecondary hover:text-aura-navy hover:bg-gray-50'
                        }`}
                      >
                        <span>{b}</span>
                        {currentBrand === b && <Check className="w-3.5 h-3.5 text-aura-indigo" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-aura-border animate-pulse h-80 flex flex-col justify-between">
                  <div className="bg-gray-200 aspect-square rounded-xl mb-4" />
                  <div className="space-y-2">
                    <div className="bg-gray-200 h-4 rounded w-3/4" />
                    <div className="bg-gray-200 h-4 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-aura-border p-12 text-center space-y-4 shadow-subtle">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-aura-indigo flex items-center justify-center mx-auto">
                <PackageOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-aura-navy">No products matched your criteria</h3>
              <p className="text-xs sm:text-sm text-aura-textSecondary max-w-md mx-auto">
                Try widening your price range, clearing some filters, or asking AURA AI for recommendations!
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8">
                  <button
                    onClick={() => updateParam('page', String(currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-xl border border-aura-border bg-white text-aura-navy disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => updateParam('page', String(p))}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                          currentPage === p
                            ? 'bg-aura-indigo text-white shadow-md'
                            : 'bg-white border border-aura-border text-aura-navy hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => updateParam('page', String(currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-xl border border-aura-border bg-white text-aura-navy disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>

      </div>

      {/* Mobile Filters Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-aura-border">
              <h2 className="font-extrabold text-base text-aura-navy">Filters</h2>
              <button onClick={() => setIsMobileFiltersOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Mobile category selection */}
            <div>
              <h3 className="text-xs font-bold uppercase text-aura-navy mb-2">Category</h3>
              <select
                value={currentCategory}
                onChange={e => updateParam('category', e.target.value)}
                className="w-full bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border"
              >
                <option value="all">All Departments</option>
                {categories.map(c => (
                  <option key={c._id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full bg-aura-indigo text-white font-bold py-3 rounded-xl text-xs"
            >
              Show Results
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

