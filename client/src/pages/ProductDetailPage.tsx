import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShoppingCart,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  MapPin,
  Check,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { IProduct, IReview } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ProductCard } from '../components/product/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [related, setRelated] = useState<IProduct[]>([]);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [reviewsSummary, setReviewsSummary] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [pinCode, setPinCode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/products/${idOrSlug}`);
        if (res.data.success) {
          const prod: IProduct = res.data.product;
          setProduct(prod);
          setRelated(res.data.related || []);
          setSelectedImage(prod.images[0] || '');

          // Initialize default variants
          const defaults: Record<string, string> = {};
          prod.variants?.forEach(v => {
            if (v.options?.length > 0) {
              defaults[v.name] = v.options[0];
            }
          });
          setSelectedVariants(defaults);

          // Fetch reviews
          const revRes = await api.get(`/products/${prod._id}/reviews`);
          if (revRes.data.success) {
            setReviews(revRes.data.reviews || []);
            setReviewsSummary(revRes.data.summary);
          }
        }
      } catch (err: any) {
        showToast(err.message || 'Product not found', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [idOrSlug]);

  const handlePinCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode || pinCode.length < 6) {
      showToast('Please enter a valid 6-digit Indian PIN code.', 'error');
      return;
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    const dateStr = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    setDeliveryEstimate(`Guaranteed FREE Delivery by ${dateStr} to ${pinCode}`);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const ok = await addToCart(product._id, quantity, selectedVariants);
    if (ok) {
      // Toast already shown
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    const ok = await addToCart(product._id, quantity, selectedVariants);
    if (ok) {
      navigate('/checkout');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to write a customer review.', 'info');
      return;
    }
    if (!newTitle.trim() || !newComment.trim()) {
      showToast('Please provide both a headline and review comments.', 'error');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res = await api.post(`/products/${product!._id}/reviews`, {
        rating: newRating,
        title: newTitle,
        comment: newComment
      });

      if (res.data.success) {
        showToast('Review submitted successfully!', 'success');
        setReviews(prev => [res.data.review, ...prev]);
        setNewTitle('');
        setNewComment('');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-aura-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-aura-navy">Loading product details...</p>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product._id);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-aura-textSecondary">
        <Link to="/" className="hover:text-aura-navy">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/products?category=${product.categoryName.toLowerCase()}`} className="hover:text-aura-navy">
          {product.categoryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-aura-navy font-bold truncate max-w-md">{product.title}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* 1. Image Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-white border border-aura-border shadow-subtle p-2 relative">
            <img
              src={selectedImage}
              alt={product.title}
              className="w-full h-full object-contain object-center rounded-2xl"
            />
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-aura-red text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-1 bg-white shrink-0 ${
                    selectedImage === img ? 'border-aura-indigo shadow-md' : 'border-aura-border hover:border-gray-400'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain rounded-lg" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Product Information & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-aura-indigo">
                {product.brand}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-aura-navy leading-tight mb-2">
              {product.title}
            </h1>

            {/* Rating Stars & Count */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-1" />
                <span>{product.ratingsAvg.toFixed(1)}</span>
              </div>
              <span className="text-xs text-aura-textSecondary">
                ({product.ratingsCount.toLocaleString('en-IN')} verified customer ratings)
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-aura-border flex items-baseline gap-3">
            <span className="text-3xl font-black text-aura-navy">
              ₹{product.discountedPrice.toLocaleString('en-IN')}
            </span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-base text-gray-400 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-aura-green bg-green-50 px-2 py-0.5 rounded">
                  Save ₹{(product.price - product.discountedPrice).toLocaleString('en-IN')} ({product.discountPercent}%)
                </span>
              </>
            )}
          </div>

          {/* Variants Selector (e.g. Storage, Color, Size) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4 border-y border-aura-border py-4">
              {product.variants.map(v => (
                <div key={v.name}>
                  <label className="text-xs font-bold text-aura-navy uppercase tracking-wider block mb-2">
                    {v.name}: <span className="text-aura-indigo">{selectedVariants[v.name]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map(opt => {
                      const isSelected = selectedVariants[v.name] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: opt }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            isSelected
                              ? 'border-aura-indigo bg-indigo-50 text-aura-indigo shadow-sm'
                              : 'border-aura-border bg-white text-aura-navy hover:border-gray-400'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stock & Quantity */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-aura-navy">Quantity:</span>
              <div className="flex items-center border border-aura-border rounded-xl bg-white overflow-hidden shadow-sm">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold text-aura-navy">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock || isOutOfStock}
                  className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <div className="text-xs">
                {isOutOfStock ? (
                  <span className="text-aura-red font-bold">Currently Out of Stock</span>
                ) : product.stock <= 5 ? (
                  <span className="text-aura-amber font-bold">Only {product.stock} units left!</span>
                ) : (
                  <span className="text-aura-green font-semibold">In Stock ({product.stock} available)</span>
                )}
              </div>
            </div>

            {/* Action Buttons: Add to Cart, Buy Now, Wishlist */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-aura-indigo hover:bg-indigo-600 disabled:opacity-40 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-aura-navy hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Buy Now</span>
              </button>

              <button
                onClick={() => toggleWishlist(product._id)}
                className={`p-3.5 rounded-2xl border transition-colors shadow-sm ${
                  isWishlisted
                    ? 'border-red-200 bg-red-50 text-aura-red'
                    : 'border-aura-border bg-white text-gray-500 hover:text-aura-red hover:bg-gray-50'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-aura-red' : ''}`} />
              </button>
            </div>
          </div>

          {/* Delivery PIN Code Checker */}
          <div className="p-4 rounded-2xl bg-white border border-aura-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-aura-navy">
              <MapPin className="w-4 h-4 text-aura-indigo" />
              <span>Check Delivery Availability</span>
            </div>
            <form onSubmit={handlePinCheck} className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Enter 6-digit PIN code"
                value={pinCode}
                onChange={e => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-gray-50 text-xs px-3.5 py-2 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
              <button
                type="submit"
                className="bg-aura-navy hover:bg-aura-indigo text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                Check
              </button>
            </form>
            {deliveryEstimate && (
              <p className="text-xs font-semibold text-aura-green flex items-center gap-1.5 pt-1">
                <Check className="w-4 h-4" /> {deliveryEstimate}
              </p>
            )}
          </div>

          {/* Service Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-aura-border">
              <Truck className="w-4 h-4 text-aura-indigo mx-auto mb-1" />
              <p className="font-bold text-aura-navy">Free Shipping</p>
              <p className="text-[10px] text-gray-400">Orders over ₹499</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-aura-border">
              <RotateCcw className="w-4 h-4 text-aura-green mx-auto mb-1" />
              <p className="font-bold text-aura-navy">7-Day Return</p>
              <p className="text-[10px] text-gray-400">Easy pickups</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-aura-border">
              <ShieldCheck className="w-4 h-4 text-aura-violet mx-auto mb-1" />
              <p className="font-bold text-aura-navy">100% Genuine</p>
              <p className="text-[10px] text-gray-400">Direct from brand</p>
            </div>
          </div>

        </div>
      </div>

      {/* Description & Specs Tabs */}
      <div className="bg-white rounded-3xl border border-aura-border p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-aura-navy mb-3">About this Item</h2>
          <p className="text-xs sm:text-sm text-aura-textSecondary leading-relaxed whitespace-pre-line mb-6">
            {product.description}
          </p>

          {/* Bulleted Features */}
          {product.features && product.features.length > 0 && (
            <div className="space-y-2 mb-8">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-aura-navy">
                Key Highlights
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm text-aura-textPrimary">
                {product.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-aura-green shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specifications Table */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-aura-navy mb-3">
                Technical Specifications
              </h3>
              <div className="border border-aura-border rounded-2xl overflow-hidden max-w-2xl">
                <table className="w-full text-xs text-left">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-2.5 px-4 font-bold text-aura-textSecondary w-1/3 border-b border-aura-border">
                          {key}
                        </td>
                        <td className="py-2.5 px-4 text-aura-textPrimary border-b border-aura-border">
                          {String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews & Ratings */}
      <div className="bg-white rounded-3xl border border-aura-border p-6 sm:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-aura-border">
          <div>
            <h2 className="text-xl font-extrabold text-aura-navy">Customer Reviews & Ratings</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(product.ratingsAvg) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-base font-extrabold text-aura-navy">{product.ratingsAvg.toFixed(1)} out of 5</span>
              <span className="text-xs text-aura-textSecondary">({reviews.length} customer reviews)</span>
            </div>
          </div>
        </div>

        {/* Write a Review Box */}
        <div className="bg-aura-bg p-5 rounded-2xl border border-aura-border">
          <h3 className="text-sm font-bold text-aura-navy mb-1 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-aura-indigo" />
            <span>Write a Product Review</span>
          </h3>
          <p className="text-xs text-aura-textSecondary mb-4">
            Share your experience with other shoppers on AuraMart.
          </p>

          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-aura-navy block mb-1">Your Rating:</label>
              <div className="flex gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Review Headline (e.g. Excellent sound quality and battery life!)"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-white text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
            </div>

            <div>
              <textarea
                rows={3}
                placeholder="What did you like or dislike? How does it perform in daily use?"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full bg-white text-xs p-3.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="bg-aura-navy hover:bg-aura-indigo text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        {/* Review list */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-aura-textSecondary italic">No customer reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map(r => (
              <div key={r._id} className="p-4 rounded-2xl bg-white border border-aura-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-aura-indigo/20 text-aura-indigo flex items-center justify-center font-bold text-xs">
                      {r.userName[0]}
                    </div>
                    <span className="text-xs font-bold text-aura-navy">{r.userName}</span>
                    {r.verifiedPurchase && (
                      <span className="text-[10px] bg-green-50 text-aura-green font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                  <span className="text-xs font-bold text-aura-navy ml-1.5">{r.title}</span>
                </div>

                <p className="text-xs text-aura-textSecondary leading-relaxed">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-aura-navy">Customers Also Viewed</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.slice(0, 4).map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

