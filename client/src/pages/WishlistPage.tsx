import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

export const WishlistPage: React.FC = () => {
  const { wishlist, moveToCart, toggleWishlist, isLoading } = useWishlist();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-aura-red flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-aura-navy">Sign In to View Your Wishlist</h2>
        <p className="text-xs sm:text-sm text-aura-textSecondary max-w-md mx-auto">
          Save your favorite products across devices and get notified about price drops and discounts.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
        >
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (wishlist.length === 0 && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-50 text-aura-red flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-aura-navy">Your Wishlist is Empty</h2>
        <p className="text-xs sm:text-sm text-aura-textSecondary max-w-md mx-auto">
          Explore our trending catalog and tap the heart icon on any product to save it here for later.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
        >
          <span>Explore Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-aura-border">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-aura-navy tracking-tight">
          My Wishlist ({wishlist.length} items)
        </h1>
        <p className="text-xs text-aura-textSecondary mt-0.5">
          Saved products ready to move into your cart whenever you're ready
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {wishlist.map(product => {
          const isOutOfStock = product.stock <= 0;
          return (
            <div
              key={product._id}
              className="bg-white rounded-2xl border border-aura-border shadow-subtle hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden p-4 relative"
            >
              <button
                onClick={() => toggleWishlist(product._id)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-red-50 hover:text-aura-red text-gray-400 transition-colors"
                title="Remove from Wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <Link to={`/products/${product.slug}`} className="block aspect-square mb-3 bg-gray-50 rounded-xl overflow-hidden p-2">
                <img
                  src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </Link>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-aura-indigo">
                    {product.brand}
                  </span>
                  <Link
                    to={`/products/${product.slug}`}
                    className="block text-xs font-bold text-aura-navy hover:text-aura-indigo transition-colors line-clamp-2"
                  >
                    {product.title}
                  </Link>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-extrabold text-aura-navy">
                    ₹{product.discountedPrice.toLocaleString('en-IN')}
                  </span>
                  {product.discountPercent > 0 && (
                    <span className="text-[11px] text-gray-400 line-through">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="text-[11px]">
                  {isOutOfStock ? (
                    <span className="text-aura-red font-semibold">Out of Stock</span>
                  ) : (
                    <span className="text-aura-green font-semibold">In Stock</span>
                  )}
                </div>

                <button
                  onClick={() => moveToCart(product._id)}
                  disabled={isOutOfStock}
                  className="w-full py-2 bg-aura-indigo hover:bg-indigo-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

