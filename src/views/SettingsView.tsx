import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Lock,
  Database,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { ShopSettings } from '../types';
import { api } from '../api';

interface SettingsViewProps {
  onDataReset?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataReset }) => {
  const [settings, setSettings] = useState<ShopSettings>({
    shop_name: 'AK ENTERPRISES',
    currency: '₹',
    timezone: 'Asia/Kolkata',
    phone: '+91 98765 43210',
    email: 'admin@akenterprises.com',
    address: 'Wholesale Market Complex, Main Road',
    default_min_stock: '10',
    invoice_prefix: 'SALE-',
    receipt_footer: 'Thank you for your business with AK ENTERPRISES!',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await api.getSettings();
        setSettings(s);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSuccessMsg('Shop settings saved successfully to database!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(null);
    setPwError(null);

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setPwLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPwSuccess('Administrator password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(null), 4000);
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">System & Shop Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business metadata, bill receipt details, security credentials, and cloud database connections
        </p>
      </div>

      {/* Shop Profile Form */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 md:p-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Business Profile & Invoice Details</h3>
            <p className="text-xs text-slate-500">Displayed on customer receipts, invoices, and exported reports</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business / Shop Name *</label>
              <input
                type="text"
                value={settings.shop_name}
                onChange={e => setSettings({ ...settings, shop_name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Currency Symbol *</label>
              <input
                type="text"
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={e => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Store Address (Printed on Receipts)</label>
              <input
                type="text"
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Low Stock Alert Threshold</label>
              <input
                type="number"
                value={settings.default_min_stock}
                onChange={e => setSettings({ ...settings, default_min_stock: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={settings.invoice_prefix}
                onChange={e => setSettings({ ...settings, invoice_prefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Receipt Footer Note</label>
              <input
                type="text"
                value={settings.receipt_footer}
                onChange={e => setSettings({ ...settings, receipt_footer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving Changes...' : 'Save Business Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security: Change Admin Password */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 md:p-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Administrator Security Credentials</h3>
            <p className="text-xs text-slate-500">Update encrypted password for admin access</p>
          </div>
        </div>

        {pwSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pwSuccess}</span>
          </div>
        )}

        {pwError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">New Password (Min 6 characters) *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pwLoading}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{pwLoading ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Database & Cloud Persistence Status */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 md:p-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Cloud Database & Storage</h3>
            <p className="text-xs text-slate-500">Live, persistent Google Cloud Firestore integration</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Database Engine:</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px]">
                Google Cloud Firestore (Connected & Live)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Timezone Engine:</span>
              <span className="font-mono text-slate-600">Asia/Kolkata (IST, UTC+05:30)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Data Reliability:</span>
              <span className="text-emerald-700 font-medium">Automatic cloud synchronization and persistence across sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permanent Store Ledger & Data Immutability */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 md:p-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Permanent Store Ledger & Data Protection (डेटा सुरक्षा व स्थायी लेज़र)</h3>
            <p className="text-xs text-slate-500">
              Strictly immutable inventory, stock movements, customer transactions, and audit trail
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Managed Products & Price Control</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Store items and selling rates can be updated or removed by authorized staff. Stock arrivals and sales updates are logged with audit trails.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Lock className="w-4 h-4 text-slate-600" />
              <span>Immutable Sales Invoices</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Every completed customer sale generates a permanent invoice that cannot be cancelled, altered, or wiped.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 sm:col-span-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Lock className="w-4 h-4 text-slate-600" />
              <span>Non-Deletable Audit Trail</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              All store activities, stock arrivals, sales creations, and administrative logins are stamped with timestamps and logged to an append-only audit trail that cannot be deleted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
