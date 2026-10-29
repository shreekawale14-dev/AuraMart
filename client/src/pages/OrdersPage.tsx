import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, ChevronRight, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { IOrder } from '../types';
import { useAuth } from '../context/AuthContext';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/orders');
        if (res.data.success) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.warn('[Fetch Orders Error]:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.orderStatus === statusFilter;
    const matchesSearch = !searchQuery.trim() || o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesStatus && matchesSearch;
  });

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-extrabold text-aura-navy">Sign in to view your orders</h2>
        <Link to="/login" className="bg-aura-indigo text-white font-bold text-xs px-6 py-3 rounded-xl inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-aura-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-aura-navy tracking-tight">
            My Orders ({orders.length})
          </h1>
          <p className="text-xs text-aura-textSecondary mt-0.5">
            Track shipments, review past purchases, and download official invoices
          </p>
        </div>

        {/* Search orders */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white text-xs pl-8 pr-3 py-2 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
        {['all', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-full capitalize whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-aura-navy text-white shadow-sm'
                : 'bg-white text-aura-textSecondary border border-aura-border hover:bg-gray-50'
            }`}
          >
            {st === 'all' ? 'All Orders' : st}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-aura-indigo border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-aura-navy">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-aura-border p-12 text-center space-y-3 shadow-subtle">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-aura-indigo flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-aura-navy">No orders found</h3>
          <p className="text-xs text-aura-textSecondary max-w-sm mx-auto">
            {searchQuery ? `No orders matched "${searchQuery}".` : 'You have not placed any orders matching this filter yet.'}
          </p>
          <Link
            to="/products"
            className="inline-block bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-aura-border p-5 shadow-subtle hover:border-aura-indigo/30 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-aura-navy">#{order.orderNumber}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
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
              </div>

              {/* Items Preview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-x-auto">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <img
                      key={idx}
                      src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                      alt={item.title}
                      className="w-14 h-14 object-contain rounded-xl border bg-gray-50 p-1 shrink-0"
                    />
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-14 h-14 rounded-xl border bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] text-gray-400">Total Amount</p>
                    <p className="text-sm font-black text-aura-indigo">
                      ₹{order.pricing.grandTotal.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <Link
                    to={`/orders/${order._id}`}
                    className="bg-aura-navy hover:bg-aura-indigo text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>View & Track</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

