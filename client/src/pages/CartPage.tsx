import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-aura-indigo flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-aura-navy">Your AuraMart Cart is Waiting</h2>
        <p className="text-xs sm:text-sm text-aura-textSecondary max-w-md mx-auto">
          Sign in to your account to view your saved items, access saved delivery addresses, and proceed to checkout.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
        >
          <span>Sign In to Your Account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  if (isEmpty && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-indigo-50 text-aura-indigo flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-aura-navy">Your Cart is Currently Empty</h2>
        <p className="text-xs sm:text-sm text-aura-textSecondary max-w-md mx-auto">
          Looks like you haven't added anything to your cart yet. Explore our bestselling electronics, fashion, and daily essentials!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    );
  }

  const freeShippingThreshold = 499;
  const itemsTotal = cart?.itemsTotal || 0;
  const progressPercent = Math.min(100, Math.round((itemsTotal / freeShippingThreshold) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-aura-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-aura-navy tracking-tight">
            Shopping Cart ({cart?.totalItemsCount || 0} items)
          </h1>
          <p className="text-xs text-aura-textSecondary mt-0.5">
            Review your selected products and proceed to address confirmation
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => clearCart()}
            className="text-xs font-semibold text-aura-red hover:underline"
          >
            Clear All Items
          </button>
        )}
      </div>

      {/* Free shipping progress bar */}
      <div className="p-4 rounded-2xl bg-white border border-aura-border shadow-subtle space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-aura-navy">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-aura-indigo" />
            <span>
              {itemsTotal >= freeShippingThreshold ? (
                <strong className="text-aura-green">Congratulations! You unlocked FREE Delivery.</strong>
              ) : (
                <>Add <strong className="text-aura-indigo">₹{freeShippingThreshold - itemsTotal}</strong> more to unlock FREE Delivery</>
              )}
            </span>
          </div>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-aura-indigo to-aura-green h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Cart Layout: Items List (Left) + Order Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map(item => {
            const product = item.product;
            if (!product) return null;
            const price = product.discountedPrice || item.priceAtAddition;
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-aura-border p-4 sm:p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all"
              >
                {/* Thumbnail */}
                <Link
                  to={`/products/${product.slug}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50 border border-aura-border shrink-0 p-1"
                >
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-aura-indigo">
                      {product.brand}
                    </span>
                    <span className="text-sm font-extrabold text-aura-navy sm:hidden">
                      ₹{(price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Link
                    to={`/products/${product.slug}`}
                    className="text-xs sm:text-sm font-bold text-aura-navy hover:text-aura-indigo transition-colors line-clamp-2"
                  >
                    {product.title}
                  </Link>

                  {/* Variant info if chosen */}
                  {item.variant && Object.keys(item.variant).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {Object.entries(item.variant).map(([k, v]) => (
                        <span
                          key={k}
                          className="bg-gray-100 text-[10px] font-medium text-gray-600 px-2 py-0.5 rounded-md"
                        >
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stock notice */}
                  <div className="text-[11px] font-medium pt-1">
                    {isOutOfStock ? (
                      <span className="text-aura-red font-bold">Out of stock</span>
                    ) : product.stock <= 5 ? (
                      <span className="text-aura-amber font-bold">Only {product.stock} left in stock</span>
                    ) : (
                      <span className="text-aura-green">In Stock</span>
                    )}
                  </div>
                </div>

                {/* Stepper & Total */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-aura-border">
                  <span className="hidden sm:inline text-base font-extrabold text-aura-navy">
                    ₹{(price * item.quantity).toLocaleString('en-IN')}
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-aura-border rounded-xl bg-gray-50 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-2.5 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-aura-navy">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={item.quantity >= product.stock}
                        className="px-2.5 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="p-1.5 text-gray-400 hover:text-aura-red transition-colors"
                      title="Remove from Cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-6">
          <h2 className="text-base font-extrabold text-aura-navy border-b border-aura-border pb-3">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-aura-textSecondary">
              <span>Items Total ({cart?.totalItemsCount} items)</span>
              <span className="font-semibold text-aura-navy">₹{cart?.itemsTotal.toLocaleString('en-IN')}</span>
            </div>

            {cart && cart.totalSavings > 0 && (
              <div className="flex justify-between text-aura-green font-semibold">
                <span>Total Catalog Savings</span>
                <span>-₹{cart.totalSavings.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-aura-textSecondary">
              <span>Standard Delivery</span>
              <span className="font-semibold text-aura-navy">
                {cart?.deliveryCharge === 0 ? (
                  <span className="text-aura-green uppercase font-bold">FREE</span>
                ) : (
                  `₹${cart?.deliveryCharge}`
                )}
              </span>
            </div>

            <div className="border-t border-aura-border pt-3 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-aura-navy">Order Grand Total</span>
              <span className="text-xl font-black text-aura-indigo">
                ₹{cart?.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            disabled={isEmpty}
            className="w-full py-3.5 bg-aura-indigo hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-[11px] text-gray-400 justify-center">
            <ShieldCheck className="w-4 h-4 text-aura-green" />
            <span>Secure 256-bit SSL encrypted checkout</span>
          </div>
        </div>

      </div>

    </div>
  );
};

