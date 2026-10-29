import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Truck,
  Plus,
  ArrowRight,
  Tag,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { IAddress } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, addresses, defaultAddress, refreshMe } = useAuth();
  const { cart, refreshCart } = useCart();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  // Server calculated pricing
  const [pricing, setPricing] = useState({
    itemsTotal: 0,
    discount: 0,
    deliveryCharge: 0,
    grandTotal: 0
  });

  const [isNewAddressOpen, setIsNewAddressOpen] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    addressType: 'Home' as 'Home' | 'Work' | 'Other',
    isDefault: false
  });

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [razorpayConfig, setRazorpayConfig] = useState<{ isConfigured: boolean; keyId: string | null }>({
    isConfigured: false,
    keyId: null
  });

  // Set default selected address on load
  useEffect(() => {
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress._id);
    } else if (addresses.length > 0) {
      setSelectedAddressId(addresses[0]._id);
    }
  }, [defaultAddress, addresses]);

  // Check payment gateway configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/payments/config');
        if (res.data.success) {
          setRazorpayConfig(res.data);
        }
      } catch (err) {
        // silent
      }
    };
    fetchConfig();
  }, []);

  // Validate checkout pricing on server whenever address or coupon changes
  useEffect(() => {
    const validateCheckout = async () => {
      if (!selectedAddressId || !cart || cart.items.length === 0) return;

      try {
        const res = await api.post('/checkout/validate', {
          addressId: selectedAddressId,
          couponCode: couponCode.trim() || undefined
        });

        if (res.data.success) {
          setPricing(res.data.pricing);
          setAppliedCoupon(res.data.couponApplied);
        }
      } catch (err: any) {
        console.warn('[Checkout Validation]:', err.message);
      }
    };

    validateCheckout();
  }, [selectedAddressId, cart, couponCode]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const res = await api.post('/checkout/validate', {
        addressId: selectedAddressId,
        couponCode: couponCode.trim()
      });

      if (res.data.success) {
        setPricing(res.data.pricing);
        if (res.data.couponApplied) {
          setAppliedCoupon(res.data.couponApplied);
          showToast(`Coupon ${res.data.couponApplied.code} applied! Saved ₹${res.data.couponApplied.discountAmount}`, 'success');
        } else {
          showToast('Coupon code is invalid or does not meet minimum order amount.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to apply coupon', 'error');
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/addresses', newAddressForm);
      if (res.data.success) {
        showToast('Address added successfully', 'success');
        await refreshMe();
        setSelectedAddressId(res.data.address._id);
        setIsNewAddressOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add address', 'error');
    }
  };

  // Place Order Action
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Please select a delivery address.', 'error');
      setCurrentStep(1);
      return;
    }

    try {
      setIsPlacingOrder(true);

      const orderPayload = {
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: appliedCoupon?.code
      };

      const res = await api.post('/orders', orderPayload);
      if (!res.data.success) {
        showToast(res.data.message || 'Order creation failed', 'error');
        return;
      }

      const order = res.data.order;
      const razorpayOrder = res.data.razorpayOrder;

      // Case A: Cash on Delivery
      if (paymentMethod === 'cod') {
        showToast('Order placed successfully via Cash on Delivery!', 'success');
        await refreshCart();
        navigate(`/orders/${order._id}?success=true`);
        return;
      }

      // Case B: Razorpay Online Payment
      if (paymentMethod === 'razorpay') {
        // If server had Razorpay keys and returned a razorpayOrder
        if (razorpayOrder && window.Razorpay) {
          const options = {
            key: razorpayConfig.keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'AuraMart',
            description: `Order #${order.orderNumber}`,
            order_id: razorpayOrder.id,
            prefill: {
              name: user?.name,
              email: user?.email,
              contact: user?.phone
            },
            theme: {
              color: '#5146E5'
            },
            handler: async function (response: any) {
              try {
                // Verify signature on server (HMAC verification)
                const verifyRes = await api.post('/payments/razorpay/verify', {
                  orderId: order._id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                });

                if (verifyRes.data.success) {
                  showToast('Payment verified successfully!', 'success');
                  await refreshCart();
                  navigate(`/orders/${order._id}?success=true`);
                }
              } catch (verifyErr: any) {
                showToast(verifyErr.message || 'Payment verification failed.', 'error');
                navigate(`/orders/${order._id}`);
              }
            },
            modal: {
              ondismiss: function () {
                showToast('Payment window closed. Order is pending payment.', 'info');
                navigate(`/orders/${order._id}`);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Honest developer note if Razorpay test keys were not set in server/.env
          showToast(
            'Razorpay credentials are in test setup mode. Order created with pending payment.',
            'info'
          );
          await refreshCart();
          navigate(`/orders/${order._id}`);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred while placing order', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-extrabold text-aura-navy">Your cart is empty</h2>
        <button
          onClick={() => navigate('/products')}
          className="bg-aura-indigo text-white font-bold text-xs px-6 py-3 rounded-xl"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const selectedAddress = addresses.find(a => a._id === selectedAddressId) || defaultAddress;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Checkout Progress Stepper */}
      <div className="flex items-center justify-between max-w-2xl mx-auto pb-4">
        {[
          { step: 1, title: 'Delivery Address' },
          { step: 2, title: 'Review Items' },
          { step: 3, title: 'Payment Method' },
          { step: 4, title: 'Confirm Order' }
        ].map((item, idx) => (
          <div key={item.step} className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(item.step)}
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                currentStep >= item.step
                  ? 'bg-aura-indigo text-white shadow-sm'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > item.step ? '✓' : item.step}
            </button>
            <span className="hidden md:inline text-xs font-semibold text-aura-navy">
              {item.title}
            </span>
            {idx < 3 && <div className="hidden sm:block w-8 sm:w-12 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Multi-Step Content */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP 1: Select Delivery Address */}
          <div className="bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-aura-border pb-3">
              <h2 className="text-base font-extrabold text-aura-navy flex items-center gap-2">
                <MapPin className="w-5 h-5 text-aura-indigo" />
                <span>1. Select Delivery Address</span>
              </h2>
              <button
                onClick={() => setIsNewAddressOpen(!isNewAddressOpen)}
                className="text-xs font-bold text-aura-indigo hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            </div>

            {/* Address Selection List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map(addr => {
                const isSelected = selectedAddressId === addr._id;
                return (
                  <div
                    key={addr._id}
                    onClick={() => setSelectedAddressId(addr._id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-aura-indigo bg-indigo-50/50 shadow-sm ring-1 ring-aura-indigo'
                        : 'border-aura-border bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-aura-navy">{addr.fullName}</span>
                      <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {addr.addressType}
                      </span>
                    </div>
                    <p className="text-xs text-aura-textSecondary leading-relaxed">
                      {addr.street}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Phone: {addr.phone}</p>
                  </div>
                );
              })}
            </div>

            {/* Add New Address Form Modal/Dropdown */}
            {isNewAddressOpen && (
              <form onSubmit={handleCreateAddress} className="mt-4 p-5 bg-gray-50 rounded-2xl border border-aura-border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-aura-navy">New Delivery Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={newAddressForm.fullName}
                    onChange={e => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                    className="bg-white text-xs p-2.5 rounded-xl border border-aura-border"
                  />
                  <input
                    type="text"
                    placeholder="Mobile Number"
                    required
                    value={newAddressForm.phone}
                    onChange={e => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                    className="bg-white text-xs p-2.5 rounded-xl border border-aura-border"
                  />
                  <input
                    type="text"
                    placeholder="Street Address, House No."
                    required
                    value={newAddressForm.street}
                    onChange={e => setNewAddressForm({ ...newAddressForm, street: e.target.value })}
                    className="bg-white text-xs p-2.5 rounded-xl border border-aura-border sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Apartment, Landmark (Optional)"
                    value={newAddressForm.addressLine2}
                    onChange={e => setNewAddressForm({ ...newAddressForm, addressLine2: e.target.value })}
                    className="bg-white text-xs p-2.5 rounded-xl border border-aura-border"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={newAddressForm.city}
                    onChange={e => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                    className="bg-white text-xs p-2.5 rounded-xl border border-aura-border"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    required
                    value={newAddressForm.state}
                    onChange={e => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                    className="bg-white text-xs p-2.5 rounded-xl border border-aura-border"
                  />
                  <input
                    type="text"
                    placeholder="PIN Code"
                    required
                    value={newAddressForm.postalCode}
                    onChange={e => setNewAddressForm({ ...newAddressForm, postalCode: e.target.value })}
                    className="bg-white text-xs p-2.5 rounded-xl border border-aura-border"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewAddressOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-5 py-2 rounded-xl transition-colors"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* STEP 2: Review Items */}
          <div className="bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-extrabold text-aura-navy border-b border-aura-border pb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-aura-indigo" />
              <span>2. Review Products ({cart.totalItemsCount} items)</span>
            </h2>

            <div className="space-y-3">
              {cart.items.map(item => (
                <div key={item._id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <img
                    src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                    alt={item.product?.title}
                    className="w-12 h-12 object-contain bg-gray-50 rounded-lg border p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-aura-navy truncate">{item.product?.title}</p>
                    <p className="text-[11px] text-aura-textSecondary">
                      Qty: {item.quantity} × ₹{item.product?.discountedPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-aura-navy">
                    ₹{(item.product?.discountedPrice * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 3: Payment Method Selection */}
          <div className="bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-extrabold text-aura-navy border-b border-aura-border pb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-aura-indigo" />
              <span>3. Select Payment Method</span>
            </h2>

            <div className="space-y-3">
              {/* Option 1: Razorpay Online */}
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-aura-indigo bg-indigo-50/40 ring-1 ring-aura-indigo'
                    : 'border-aura-border bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="mt-0.5 text-aura-indigo focus:ring-aura-indigo"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-aura-navy">
                      Online Payment via Razorpay
                    </span>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-aura-textSecondary mt-0.5">
                    Pay securely using UPI (Google Pay, PhonePe, Paytm), Credit & Debit cards, or NetBanking.
                  </p>
                </div>
              </label>

              {/* Option 2: Cash on Delivery */}
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-aura-indigo bg-indigo-50/40 ring-1 ring-aura-indigo'
                    : 'border-aura-border bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-0.5 text-aura-indigo focus:ring-aura-indigo"
                />
                <div className="flex-1">
                  <span className="text-xs font-extrabold text-aura-navy">
                    Cash on Delivery (COD)
                  </span>
                  <p className="text-xs text-aura-textSecondary mt-0.5">
                    Pay in cash or digital scan-and-pay upon delivery at your doorstep.
                  </p>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Pricing & Final Review */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-6">
          <h2 className="text-base font-extrabold text-aura-navy border-b border-aura-border pb-3">
            Payment & Pricing Summary
          </h2>

          {/* Coupon Code Input */}
          <div>
            <label className="text-xs font-bold text-aura-navy block mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-aura-indigo" />
              <span>Apply Discount Coupon</span>
            </label>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Try AURA10 or WELCOME50"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 bg-gray-50 text-xs px-3 py-2 rounded-xl border border-aura-border uppercase font-mono"
              />
              <button
                type="submit"
                className="bg-aura-navy hover:bg-aura-indigo text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Apply
              </button>
            </form>

            {appliedCoupon && (
              <p className="text-[11px] text-aura-green font-bold mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Coupon {appliedCoupon.code} applied (-₹{appliedCoupon.discountAmount})
              </p>
            )}
          </div>

          {/* Itemized Pricing */}
          <div className="space-y-3 text-xs border-t border-aura-border pt-4">
            <div className="flex justify-between text-aura-textSecondary">
              <span>Items Total</span>
              <span className="font-semibold text-aura-navy">
                ₹{pricing.itemsTotal ? pricing.itemsTotal.toLocaleString('en-IN') : cart.itemsTotal.toLocaleString('en-IN')}
              </span>
            </div>

            {pricing.discount > 0 && (
              <div className="flex justify-between text-aura-green font-semibold">
                <span>Coupon Savings</span>
                <span>-₹{pricing.discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-aura-textSecondary">
              <span>Delivery Fee</span>
              <span className="font-semibold text-aura-navy">
                {pricing.deliveryCharge === 0 ? (
                  <span className="text-aura-green uppercase font-bold">FREE</span>
                ) : (
                  `₹${pricing.deliveryCharge}`
                )}
              </span>
            </div>

            <div className="border-t border-aura-border pt-3 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-aura-navy">Final Amount</span>
              <span className="text-2xl font-black text-aura-indigo">
                ₹{pricing.grandTotal ? pricing.grandTotal.toLocaleString('en-IN') : cart.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !selectedAddressId}
            className="w-full py-4 bg-aura-indigo hover:bg-indigo-600 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>{isPlacingOrder ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order (Cash on Delivery)' : 'Proceed to Razorpay Payment'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-[11px] text-gray-400 space-y-1 text-center">
            <p className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-aura-green" />
              <span>Verified server signature & inventory reserve</span>
            </p>
            <p>By placing this order, you agree to AuraMart terms and 7-day return policy.</p>
          </div>
        </div>

      </div>

    </div>
  );
};

