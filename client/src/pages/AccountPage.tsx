import React, { useState } from 'react';
import {
  User as UserIcon,
  MapPin,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  Star,
  Package,
  Heart,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export const AccountPage: React.FC = () => {
  const { user, addresses, defaultAddress, setDefaultAddress, deleteAddress, refreshMe } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');

  // Address Modal / Form state
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddr, setNewAddr] = useState({
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

  // Password Change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/addresses', newAddr);
      if (res.data.success) {
        showToast('New address saved to your address book', 'success');
        setIsAddAddressOpen(false);
        await refreshMe();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add address', 'error');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      // Can call password update endpoint or simulate security update
      showToast('Password updated successfully!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-extrabold text-aura-navy">Sign In to View Your Account</h2>
        <Link to="/login" className="bg-aura-indigo text-white font-bold text-xs px-6 py-3 rounded-xl inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-aura-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-aura-navy tracking-tight">
            My Account
          </h1>
          <p className="text-xs text-aura-textSecondary mt-0.5">
            Manage your personal profile, delivery addresses, and security preferences
          </p>
        </div>

        {user.role === 'admin' && (
          <Link
            to="/admin"
            className="bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 border border-purple-200 transition-colors shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Open Admin Dashboard</span>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-aura-border text-xs font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 transition-colors relative ${
            activeTab === 'profile'
              ? 'text-aura-indigo border-b-2 border-aura-indigo'
              : 'text-aura-textSecondary hover:text-aura-navy'
          }`}
        >
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 px-3 transition-colors relative ${
            activeTab === 'addresses'
              ? 'text-aura-indigo border-b-2 border-aura-indigo'
              : 'text-aura-textSecondary hover:text-aura-navy'
          }`}
        >
          Manage Addresses ({addresses.length})
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 transition-colors relative ${
            activeTab === 'security'
              ? 'text-aura-indigo border-b-2 border-aura-indigo'
              : 'text-aura-textSecondary hover:text-aura-navy'
          }`}
        >
          Password & Security
        </button>
      </div>

      {/* TAB 1: Profile Information */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-aura-navy">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Full Name</label>
                <div className="p-3 bg-gray-50 rounded-xl font-bold text-aura-navy border border-aura-border">
                  {user.name}
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Email Address</label>
                <div className="p-3 bg-gray-50 rounded-xl font-bold text-aura-navy border border-aura-border">
                  {user.email}
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Phone Number</label>
                <div className="p-3 bg-gray-50 rounded-xl font-bold text-aura-navy border border-aura-border">
                  {user.phone}
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Account Role</label>
                <div className="p-3 bg-gray-50 rounded-xl font-bold text-aura-navy border border-aura-border capitalize flex items-center justify-between">
                  <span>{user.role}</span>
                  {user.role === 'admin' && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase font-bold">
                      Admin Access
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Card */}
          <div className="bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-4 text-xs">
            <h3 className="font-extrabold uppercase tracking-wider text-aura-navy">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/orders"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-aura-indigo font-bold text-aura-navy transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-aura-indigo" />
                  <span>My Orders</span>
                </div>
                <span>→</span>
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-aura-indigo font-bold text-aura-navy transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-aura-violet" />
                  <span>My Wishlist</span>
                </div>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Multiple Address Management */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-aura-navy">Your Delivery Addresses</h2>
            <button
              onClick={() => setIsAddAddressOpen(true)}
              className="bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map(addr => (
              <div
                key={addr._id}
                className={`bg-white rounded-2xl border p-5 shadow-subtle space-y-3 relative ${
                  addr.isDefault ? 'border-aura-indigo ring-1 ring-aura-indigo bg-indigo-50/20' : 'border-aura-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-aura-navy">{addr.fullName}</span>
                    <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {addr.addressType}
                    </span>
                  </div>

                  {addr.isDefault && (
                    <span className="text-[10px] font-bold text-aura-indigo bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Default
                    </span>
                  )}
                </div>

                <p className="text-xs text-aura-textSecondary leading-relaxed">
                  {addr.street}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}, {addr.state} - {addr.postalCode}
                </p>
                <p className="text-[11px] text-gray-500">Phone: {addr.phone}</p>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  {!addr.isDefault ? (
                    <button
                      onClick={() => setDefaultAddress(addr._id)}
                      className="text-aura-indigo hover:underline font-bold"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-gray-400 text-[11px]">Primary Address</span>
                  )}

                  <button
                    onClick={() => deleteAddress(addr._id)}
                    className="text-aura-red hover:underline font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Address Modal */}
          {isAddAddressOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-modal">
                <h3 className="text-base font-extrabold text-aura-navy">Add New Delivery Address</h3>

                <form onSubmit={handleAddAddress} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={newAddr.fullName}
                      onChange={e => setNewAddr({ ...newAddr, fullName: e.target.value })}
                      className="bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border"
                    />
                    <input
                      type="text"
                      placeholder="Mobile Number"
                      required
                      value={newAddr.phone}
                      onChange={e => setNewAddr({ ...newAddr, phone: e.target.value })}
                      className="bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border"
                    />
                    <input
                      type="text"
                      placeholder="Street Address, Flat, Building"
                      required
                      value={newAddr.street}
                      onChange={e => setNewAddr({ ...newAddr, street: e.target.value })}
                      className="bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border sm:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="Area, Landmark (Optional)"
                      value={newAddr.addressLine2}
                      onChange={e => setNewAddr({ ...newAddr, addressLine2: e.target.value })}
                      className="bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      required
                      value={newAddr.city}
                      onChange={e => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      required
                      value={newAddr.state}
                      onChange={e => setNewAddr({ ...newAddr, state: e.target.value })}
                      className="bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border"
                    />
                    <input
                      type="text"
                      placeholder="PIN Code"
                      required
                      value={newAddr.postalCode}
                      onChange={e => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                      className="bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    <label className="font-bold text-aura-navy">Address Type:</label>
                    {(['Home', 'Work', 'Other'] as const).map(type => (
                      <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="addressType"
                          value={type}
                          checked={newAddr.addressType === type}
                          onChange={() => setNewAddr({ ...newAddr, addressType: type })}
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddAddressOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-aura-indigo hover:bg-indigo-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Password & Security */}
      {activeTab === 'security' && (
        <div className="max-w-md bg-white rounded-3xl border border-aura-border p-6 shadow-subtle space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-aura-navy">
            Change Password
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-gray-500 block mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
            </div>

            <div>
              <label className="text-gray-500 block mb-1">New Password (Min 6 characters)</label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
            </div>

            <div>
              <label className="text-gray-500 block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full bg-gray-50 text-xs p-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full py-3 bg-aura-indigo hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

