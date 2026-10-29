import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  Clock,
  Tag,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { IProduct, ICategory, IOrder, ICoupon } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'coupons' | 'users'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & filter states
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Add Product Modal
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    title: '',
    description: '',
    price: 0,
    discountPercent: 0,
    brand: '',
    categoryId: '',
    sku: '',
    stock: 20,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
    isFeatured: false,
    isTrending: false,
    isBestseller: false
  });

  // Add Coupon Form
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discountPercent: 15,
    maxDiscountAmount: 500,
    minOrderAmount: 999,
    validUntil: '2028-12-31'
  });

  // Guard: Admin role only
  useEffect(() => {
    if (user && user.role !== 'admin') {
      showToast('Access denied: Administrator privileges required.', 'error');
      navigate('/');
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashRes, catsRes, prodsRes, ordsRes, coupRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/categories'),
        api.get('/admin/products?limit=50'),
        api.get('/admin/orders?limit=50'),
        api.get('/admin/coupons'),
        api.get('/admin/users')
      ]);

      if (dashRes.data.success) {
        setStats(dashRes.data.stats);
        setLowStock(dashRes.data.lowStockProducts);
        setRecentOrders(dashRes.data.recentOrders);
      }
      if (catsRes.data.success) setCategories(catsRes.data.categories);
      if (prodsRes.data.success) setProducts(prodsRes.data.products);
      if (ordsRes.data.success) setOrders(ordsRes.data.orders);
      if (coupRes.data.success) setCoupons(coupRes.data.coupons);
      if (usersRes.data.success) setCustomers(usersRes.data.users);
    } catch (err: any) {
      showToast(err.message || 'Failed to load admin data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  // Order status update
  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status`, {
        orderStatus: newStatus,
        note: `Status updated to ${newStatus} by admin`
      });

      if (res.data.success) {
        showToast(`Order status updated to ${newStatus}`, 'success');
        setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, orderStatus: newStatus as any } : o)));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/admin/products/${productId}`);
      if (res.data.success) {
        showToast('Product deleted successfully', 'success');
        setProducts(prev => prev.filter(p => p._id !== productId));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  // Add Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/products', newProductForm);
      if (res.data.success) {
        showToast('Product created successfully!', 'success');
        setIsAddProductOpen(false);
        fetchDashboardData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create product', 'error');
    }
  };

  // Add Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/coupons', newCouponForm);
      if (res.data.success) {
        showToast('Coupon created successfully', 'success');
        setIsAddCouponOpen(false);
        setCoupons(prev => [res.data.coupon, ...prev]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create coupon', 'error');
    }
  };

  // Toggle Coupon Active
  const handleToggleCoupon = async (couponId: string) => {
    try {
      const res = await api.patch(`/admin/coupons/${couponId}/toggle`);
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setCoupons(prev => prev.map(c => (c._id === couponId ? res.data.coupon : c)));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle coupon', 'error');
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-aura-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-aura-navy tracking-tight">
              AuraMart Admin Portal
            </h1>
            <p className="text-xs text-aura-textSecondary mt-0.5">
              Store operations, catalog management, inventory control, and order fulfillment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-aura-border text-xs font-bold overflow-x-auto no-scrollbar">
        {[
          { tab: 'overview', title: 'Store Metrics & Overview' },
          { tab: 'products', title: `Products (${products.length})` },
          { tab: 'orders', title: `Fulfillment & Orders (${orders.length})` },
          { tab: 'coupons', title: `Coupons (${coupons.length})` },
          { tab: 'users', title: `Customers (${customers.length})` }
        ].map(t => (
          <button
            key={t.tab}
            onClick={() => setActiveTab(t.tab as any)}
            className={`pb-3 px-3.5 transition-colors whitespace-nowrap relative ${
              activeTab === t.tab
                ? 'text-aura-indigo border-b-2 border-aura-indigo'
                : 'text-aura-textSecondary hover:text-aura-navy'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-3xl border border-aura-border shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider text-aura-navy">Revenue</span>
                <DollarSign className="w-5 h-5 text-aura-green" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-aura-navy">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-aura-green font-semibold mt-0.5">Verified Paid & Delivered COD</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-aura-border shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider text-aura-navy">Total Orders</span>
                <Package className="w-5 h-5 text-aura-indigo" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-aura-navy">{stats.totalOrders}</p>
                <p className="text-[11px] text-aura-textSecondary mt-0.5">Across all fulfillment stages</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-aura-border shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider text-aura-navy">Total Products</span>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-aura-navy">{stats.totalProducts}</p>
                <p className="text-[11px] text-aura-textSecondary mt-0.5">Across 15 departments</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-aura-border shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider text-aura-navy">Active Customers</span>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-aura-navy">{stats.totalUsers}</p>
                <p className="text-[11px] text-aura-textSecondary mt-0.5">Registered customer accounts</p>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts Table */}
          {lowStock.length > 0 && (
            <div className="bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-4">
              <div className="flex items-center gap-2 text-aura-amber font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Low Inventory Alerts ({lowStock.length} items &le; 10 units)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase border-b border-aura-border">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Price</th>
                      <th className="py-2.5 px-3">Stock Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lowStock.map(item => (
                      <tr key={item._id}>
                        <td className="py-3 px-3 font-bold text-aura-navy flex items-center gap-2">
                          <img src={item.images?.[0]} alt="" className="w-8 h-8 rounded-lg object-contain border" />
                          <span className="truncate max-w-xs">{item.title}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-gray-500">{item.sku}</td>
                        <td className="py-3 px-3 font-bold">₹{item.discountedPrice.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3">
                          <span className="bg-red-100 text-aura-red font-bold px-2 py-0.5 rounded-full">
                            {item.stock} left
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCTS TABLE */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-aura-navy">Product Catalog</h2>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search products by title or brand..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full bg-gray-50 text-xs pl-8 pr-3 py-2 rounded-xl border border-aura-border"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase border-b border-aura-border">
                <tr>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products
                  .filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase()))
                  .map(p => (
                    <tr key={p._id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3 font-bold text-aura-navy flex items-center gap-3">
                        <img src={p.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-contain border p-0.5" />
                        <div>
                          <p className="line-clamp-1">{p.title}</p>
                          <p className="text-[10px] text-gray-400 font-normal">{p.brand} • SKU: {p.sku}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{p.categoryName}</td>
                      <td className="py-3 px-3 font-bold text-aura-navy">₹{p.discountedPrice.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          p.stock <= 5 ? 'bg-red-100 text-aura-red' : 'bg-green-100 text-aura-green'
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="p-1.5 text-aura-red hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS FULFILLMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-aura-navy">All Customer Orders</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">Filter:</span>
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="bg-gray-50 text-xs font-semibold p-2 rounded-xl border border-aura-border"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase border-b border-aura-border">
                <tr>
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Change Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders
                  .filter(o => orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter)
                  .map(o => (
                    <tr key={o._id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3 font-extrabold text-aura-navy">
                        <Link to={`/orders/${o._id}`} className="hover:text-aura-indigo hover:underline">
                          #{o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-aura-navy">{o.deliveryAddressSnapshot?.fullName || 'Customer'}</p>
                        <p className="text-[10px] text-gray-400">{o.deliveryAddressSnapshot?.city}</p>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{o.items?.length || 0} items</td>
                      <td className="py-3 px-3 font-black text-aura-navy">₹{o.pricing.grandTotal.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {o.paymentMethod.toUpperCase()} ({o.paymentStatus})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={o.orderStatus}
                          onChange={e => handleOrderStatusUpdate(o._id, e.target.value)}
                          className="bg-white border border-aura-border rounded-lg p-1.5 text-xs font-bold focus:outline-none focus:border-aura-indigo cursor-pointer shadow-xs"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Return Requested">Return Requested</option>
                          <option value="Returned">Returned</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-aura-navy">Promotional Coupons</h2>
            <button
              onClick={() => setIsAddCouponOpen(true)}
              className="bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map(c => (
              <div key={c._id} className="p-4 rounded-2xl border border-aura-border bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-aura-indigo bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {c.code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-aura-navy font-bold">
                  {c.discountPercent}% OFF (Max ₹{c.maxDiscountAmount})
                </p>
                <p className="text-[11px] text-gray-500">Min Order: ₹{c.minOrderAmount}</p>
                <div className="pt-2 flex justify-between items-center text-xs">
                  <button
                    onClick={() => handleToggleCoupon(c._id)}
                    className="text-aura-indigo hover:underline font-semibold"
                  >
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Coupon Modal */}
          {isAddCouponOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-3 shadow-modal">
                <h3 className="text-sm font-extrabold text-aura-navy">New Promo Coupon</h3>
                <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-aura-navy block mb-1">Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SUMMER20"
                      value={newCouponForm.code}
                      onChange={e => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                      className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border uppercase font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-aura-navy block mb-1">Discount %</label>
                      <input
                        type="number"
                        required
                        value={newCouponForm.discountPercent}
                        onChange={e => setNewCouponForm({ ...newCouponForm, discountPercent: Number(e.target.value) })}
                        className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-aura-navy block mb-1">Max Discount (₹)</label>
                      <input
                        type="number"
                        required
                        value={newCouponForm.maxDiscountAmount}
                        onChange={e => setNewCouponForm({ ...newCouponForm, maxDiscountAmount: Number(e.target.value) })}
                        className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-aura-navy block mb-1">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      value={newCouponForm.minOrderAmount}
                      onChange={e => setNewCouponForm({ ...newCouponForm, minOrderAmount: Number(e.target.value) })}
                      className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddCouponOpen(false)}
                      className="px-4 py-2 font-semibold text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-aura-indigo text-white font-bold px-4 py-2 rounded-xl"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CUSTOMERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-4">
          <h2 className="text-base font-extrabold text-aura-navy">Registered Customers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase border-b border-aura-border">
                <tr>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Orders Placed</th>
                  <th className="py-3 px-3">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map(c => (
                  <tr key={c._id}>
                    <td className="py-3 px-3 font-bold text-aura-navy">{c.name}</td>
                    <td className="py-3 px-3 text-gray-600">{c.email}</td>
                    <td className="py-3 px-3 text-gray-600">{c.phone}</td>
                    <td className="py-3 px-3 font-bold">{c.ordersCount}</td>
                    <td className="py-3 px-3 font-extrabold text-aura-navy">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-modal max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-aura-navy">Add New Catalog Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-aura-navy block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple AirPods Pro (2nd Gen)"
                  value={newProductForm.title}
                  onChange={e => setNewProductForm({ ...newProductForm, title: e.target.value })}
                  className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                />
              </div>

              <div>
                <label className="font-bold text-aura-navy block mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed product features, specifications, and warranty..."
                  value={newProductForm.description}
                  onChange={e => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-aura-navy block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newProductForm.price}
                    onChange={e => setNewProductForm({ ...newProductForm, price: Number(e.target.value) })}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                  />
                </div>
                <div>
                  <label className="font-bold text-aura-navy block mb-1">Discount %</label>
                  <input
                    type="number"
                    value={newProductForm.discountPercent}
                    onChange={e => setNewProductForm({ ...newProductForm, discountPercent: Number(e.target.value) })}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                  />
                </div>
                <div>
                  <label className="font-bold text-aura-navy block mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    value={newProductForm.stock}
                    onChange={e => setNewProductForm({ ...newProductForm, stock: Number(e.target.value) })}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                  />
                </div>
                <div>
                  <label className="font-bold text-aura-navy block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="APL-APP2"
                    value={newProductForm.sku}
                    onChange={e => setNewProductForm({ ...newProductForm, sku: e.target.value.toUpperCase() })}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-aura-navy block mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="Apple, Sony, Nike..."
                    value={newProductForm.brand}
                    onChange={e => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                  />
                </div>
                <div>
                  <label className="font-bold text-aura-navy block mb-1">Department / Category *</label>
                  <select
                    required
                    value={newProductForm.categoryId}
                    onChange={e => setNewProductForm({ ...newProductForm, categoryId: e.target.value })}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-aura-navy block mb-1">Image URL (Unsplash or CDN) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newProductForm.images[0]}
                  onChange={e => setNewProductForm({ ...newProductForm, images: [e.target.value] })}
                  className="w-full bg-gray-50 p-2.5 rounded-xl border border-aura-border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-aura-border">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
                >
                  Publish Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

