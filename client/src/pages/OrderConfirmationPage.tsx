import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Printer,
  XCircle,
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { IOrder } from '../types';
import { useToast } from '../context/ToastContext';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isNewOrder = searchParams.get('success') === 'true';

  const [order, setOrder] = useState<IOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Found a better price elsewhere');
  const [isCancelling, setIsCancelling] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err: any) {
      showToast(err.message || 'Order not found', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      setIsCancelling(true);
      const res = await api.post(`/orders/${order._id}/cancel`, {
        reason: cancelReason
      });

      if (res.data.success) {
        showToast('Order cancelled successfully. Stock has been restored.', 'success');
        setIsCancelModalOpen(false);
        await fetchOrder();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReturnRequest = async () => {
    if (!order) return;
    try {
      const res = await api.post(`/orders/${order._id}/return-request`, {
        reason: 'Customer initiated return within 7-day policy'
      });
      if (res.data.success) {
        showToast('Return request submitted. Our team will arrange pickup.', 'success');
        await fetchOrder();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to request return', 'error');
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (isLoading || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-aura-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-semibold text-aura-navy">Loading order details...</p>
      </div>
    );
  }

  const cancellable = ['Pending', 'Confirmed', 'Processing'].includes(order.orderStatus);
  const returnable = order.orderStatus === 'Delivered';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Success Celebration Banner */}
      {isNewOrder && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">Thank You For Your Order!</h1>
            <p className="text-xs sm:text-sm text-green-100 mt-1">
              Your order <strong className="text-white">#{order.orderNumber}</strong> has been received and confirmed.
            </p>
          </div>
          <button
            onClick={handlePrintInvoice}
            className="bg-white text-emerald-800 hover:bg-gray-100 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      )}

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-aura-border p-6 sm:p-8 shadow-subtle space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-aura-border">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-aura-navy">Order #{order.orderNumber}</h2>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                order.orderStatus === 'Delivered'
                  ? 'bg-green-100 text-green-700'
                  : order.orderStatus === 'Cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-indigo-100 text-aura-indigo'
              }`}>
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-aura-textSecondary mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintInvoice}
              className="px-3.5 py-2 rounded-xl border border-aura-border text-xs font-bold text-aura-navy hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Invoice</span>
            </button>

            {cancellable && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-red-200 text-xs font-bold text-aura-red hover:bg-red-50 flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Order</span>
              </button>
            )}

            {returnable && (
              <button
                onClick={handleReturnRequest}
                className="px-3.5 py-2 rounded-xl border border-amber-200 text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Request Return</span>
              </button>
            )}
          </div>
        </div>

        {/* Tracking Timeline */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-aura-navy mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-aura-indigo" />
            <span>Order Status Timeline</span>
          </h3>

          <div className="relative border-l-2 border-indigo-200 ml-4 pl-6 space-y-6">
            {order.statusTimeline.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-aura-indigo border-2 border-white ring-2 ring-indigo-200" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-aura-navy">{step.status}</span>
                  <span className="text-gray-400 text-[11px]">
                    {new Date(step.timestamp).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {step.note && <p className="text-[11px] text-aura-textSecondary mt-0.5">{step.note}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Items List Snapshot */}
        <div className="border-t border-aura-border pt-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-aura-navy mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-aura-indigo" />
            <span>Items Purchased</span>
          </h3>

          <div className="divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center gap-4">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                  alt={item.title}
                  className="w-14 h-14 object-contain rounded-xl border bg-gray-50 p-1 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.product}`}
                    className="text-xs font-bold text-aura-navy hover:text-aura-indigo truncate block"
                  >
                    {item.title}
                  </Link>
                  <p className="text-[11px] text-gray-500">
                    Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="text-xs font-extrabold text-aura-navy">
                  ₹{item.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Address Snapshot & Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-aura-border pt-6">
          
          {/* Immutable Address Snapshot */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-aura-border">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-aura-navy mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-aura-indigo" />
              <span>Delivery Address Snapshot</span>
            </h4>
            <p className="text-xs font-bold text-aura-navy">{order.deliveryAddressSnapshot.fullName}</p>
            <p className="text-xs text-aura-textSecondary leading-relaxed mt-0.5">
              {order.deliveryAddressSnapshot.street}, {order.deliveryAddressSnapshot.addressLine2 ? `${order.deliveryAddressSnapshot.addressLine2}, ` : ''}
              {order.deliveryAddressSnapshot.city}, {order.deliveryAddressSnapshot.state} - {order.deliveryAddressSnapshot.postalCode}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Phone: {order.deliveryAddressSnapshot.phone}</p>
          </div>

          {/* Payment & Pricing */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-aura-border space-y-2 text-xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-aura-navy mb-2 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-aura-indigo" />
              <span>Payment Details</span>
            </h4>

            <div className="flex justify-between">
              <span className="text-aura-textSecondary">Method</span>
              <span className="font-bold text-aura-navy uppercase">
                {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Razorpay Online'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-aura-textSecondary">Payment Status</span>
              <span className={`font-bold uppercase ${
                order.paymentStatus === 'paid' ? 'text-aura-green' : 'text-amber-600'
              }`}>
                {order.paymentStatus}
              </span>
            </div>

            {order.paymentDetails?.razorpayPaymentId && (
              <div className="flex justify-between">
                <span className="text-aura-textSecondary">Transaction ID</span>
                <span className="font-mono text-gray-500">{order.paymentDetails.razorpayPaymentId}</span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-aura-navy">
              <span>Grand Total</span>
              <span className="text-aura-indigo font-black">₹{order.pricing.grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-modal">
            <h3 className="text-base font-extrabold text-aura-navy">Cancel Order #{order.orderNumber}</h3>
            <p className="text-xs text-aura-textSecondary">
              Are you sure you want to cancel this order? Product inventory will be restored immediately.
            </p>

            <div>
              <label className="text-xs font-bold text-aura-navy block mb-1">Reason for cancellation:</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border"
              >
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery time is too long">Delivery time is too long</option>
                <option value="Change of delivery address">Change of delivery address</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="bg-aura-red hover:bg-red-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-colors"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

