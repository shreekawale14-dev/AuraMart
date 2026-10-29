import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { IProduct } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: IProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isWishlisted = isInWishlist(product._id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product._id, 1);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  return (
    <div className="group bg-white rounded-2xl border border-aura-border shadow-subtle hover:shadow-card-hover hover:border-aura-indigo/30 transition-all duration-300 flex flex-col overflow-hidden relative">
      
      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
          isWishlisted
            ? 'bg-red-50 text-aura-red'
            : 'bg-white/90 text-gray-400 hover:text-aura-red hover:bg-white'
        }`}
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-aura-red' : ''}`} />
      </button>

      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        {product.discountPercent > 0 && (
          <span className="bg-aura-red text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            {product.discountPercent}% OFF
          </span>
        )}
        {product.isBestseller && (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            Bestseller
          </span>
        )}
        {product.isTrending && !product.isBestseller && (
          <span className="bg-aura-indigo text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            Trending
          </span>
        )}
      </div>

      {/* Product Image Link */}
      <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-aura-textSecondary font-semibold uppercase tracking-wider mb-1">
            <span>{product.brand}</span>
            <span className="text-[10px] lowercase text-gray-400">{product.categoryName}</span>
          </div>

          {/* Title */}
          <Link
            to={`/products/${product.slug}`}
            className="block text-sm font-semibold text-aura-textPrimary group-hover:text-aura-indigo transition-colors line-clamp-2 leading-snug mb-2"
            title={product.title}
          >
            {product.title}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="flex items-center bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[11px] font-bold">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-1" />
              <span>{product.ratingsAvg.toFixed(1)}</span>
            </div>
            <span className="text-[11px] text-aura-textSecondary">
              ({product.ratingsCount.toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        <div>
          {/* Price & Savings */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-extrabold text-aura-navy">
              ₹{product.discountedPrice.toLocaleString('en-IN')}
            </span>
            {product.discountPercent > 0 && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Stock info */}
          <div className="text-[11px] font-medium mb-3">
            {isOutOfStock ? (
              <span className="text-aura-red font-semibold">Currently Out of Stock</span>
            ) : isLowStock ? (
              <span className="text-aura-amber font-semibold">Only {product.stock} left in stock!</span>
            ) : (
              <span className="text-aura-green">In Stock • Eligible for FREE Delivery</span>
            )}
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-aura-navy hover:bg-aura-indigo text-white shadow-sm active:scale-98'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

