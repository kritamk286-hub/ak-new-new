import React, { useState, useEffect } from 'react';
import {
  Package,
  Boxes,
  TrendingUp,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  IndianRupee,
  Calendar,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  PackagePlus,
  Zap,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

interface DashboardViewProps {
  onNavigate: (view: any, data?: any) => void;
  onOpenAddStock: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenAddStock }) => {
  const { isHindi, autoTranslate } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dateRange, setDateRange] = useState<string>('TODAY');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard(dateRange, customStart || undefined, customEnd || undefined);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchStats();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {isHindi ? 'व्यापार एवं बिक्री डैशबोर्ड (Business Overview)' : 'Business Overview'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHindi
              ? 'एके एंटरप्राइजेज का लाइव डेटाबेस एवं स्टॉक स्थिति'
              : 'Real-time database metrics & inventory status for AK ENTERPRISES'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Range Filters */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            {[
              { id: 'TODAY', label: isHindi ? 'आज' : 'Today' },
              { id: 'YESTERDAY', label: isHindi ? 'कल' : 'Yesterday' },
              { id: 'LAST_7_DAYS', label: isHindi ? '7 दिन' : 'This Week' },
              { id: 'THIS_MONTH', label: isHindi ? 'इस माह' : 'This Month' },
              { id: 'CUSTOM', label: isHindi ? 'कस्टम' : 'Custom' },
            ].map(tab => (
              <button
                key={tab.id}
                id={`dash-filter-${tab.id}`}
                onClick={() => setDateRange(tab.id)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  dateRange === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchStats}
            title={isHindi ? 'डेटा ताज़ा करें' : 'Refresh database statistics'}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Actions (Main Tasks for Everyday / Rural Shopkeeper) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              {isHindi ? 'दुकान के मुख्य काम (Quick Actions)' : 'Main Store Actions (दुकान के मुख्य काम)'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {isHindi ? 'शुरू करने के लिए किसी भी कार्ड पर क्लिक करें' : 'Tap any card to start'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action 1: SELL PRODUCT - BIGGEST & HIGHLIGHTED */}
          <button
            id="dash-action-sell-btn"
            onClick={() => onNavigate('sell')}
            className="group p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/30 flex items-center gap-4 text-left transition-all active:scale-98 cursor-pointer border border-emerald-500/40 sm:col-span-2 lg:col-span-1"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black uppercase tracking-tight">
                  {isHindi ? 'सामान बेचें' : 'Sell Product'}
                </span>
                <span className="px-1.5 py-0.5 bg-white/20 text-[10px] font-bold rounded">
                  {isHindi ? 'नया बिल' : 'New Bill'}
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-semibold mt-0.5">
                {isHindi ? 'बिल बनाएं व रसीद दें' : 'सामान बेचें (बिल बनाएं)'}
              </p>
              <p className="text-[10px] text-emerald-200 font-normal mt-1 opacity-90">
                {isHindi ? 'तुरंत पीओएस बिक्री पर्ची' : '1-Click counter billing & receipt'}
              </p>
            </div>
          </button>

          {/* Action 2: ADD NEW ITEM */}
          <button
            id="dash-action-add-product-btn"
            onClick={() => onNavigate('add-product')}
            className="group p-4 bg-white hover:bg-blue-50/60 border-2 border-blue-200 hover:border-blue-400 text-slate-900 rounded-2xl flex items-center gap-3.5 text-left transition-all active:scale-98 cursor-pointer shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-black text-slate-900 block">
                {isHindi ? 'नया सामान जोड़ें' : 'Add New Item'}
              </span>
              <p className="text-xs text-slate-600 font-semibold">
                {isHindi ? 'कैटलॉग में नया आइटम' : 'नया सामान जोड़ें'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'नाम, दर एवं प्रारंभिक स्टॉक' : 'Name, price & stock'}
              </p>
            </div>
          </button>

          {/* Action 3: ADD STOCK */}
          <button
            id="dash-action-add-stock-btn"
            onClick={onOpenAddStock}
            className="group p-4 bg-white hover:bg-indigo-50/60 border-2 border-indigo-200 hover:border-indigo-400 text-slate-900 rounded-2xl flex items-center gap-3.5 text-left transition-all active:scale-98 cursor-pointer shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-black text-slate-900 block">
                {isHindi ? 'स्टॉक बढ़ाएं (माल आया)' : 'Add Stock'}
              </span>
              <p className="text-xs text-slate-600 font-semibold">
                {isHindi ? 'नया माल स्टॉक में जोड़ें' : 'नया माल आया'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'मात्रा आवक एंट्री' : 'Stock quantity inward'}
              </p>
            </div>
          </button>

          {/* Action 4: VIEW BILLS */}
          <button
            id="dash-action-view-sales-btn"
            onClick={() => onNavigate('sales-history')}
            className="group p-4 bg-white hover:bg-slate-100/80 border-2 border-slate-200 hover:border-slate-300 text-slate-900 rounded-2xl flex items-center gap-3.5 text-left transition-all active:scale-98 cursor-pointer shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-black text-slate-900 block">
                {isHindi ? 'बिक्री बहीखाता (बिल)' : 'Bills & History'}
              </span>
              <p className="text-xs text-slate-600 font-semibold">
                {isHindi ? 'पक्के बिल देखें व री-प्रिंट करें' : 'बिक्री रसीदें देखें'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'पुराने सभी चालान' : 'Reprint or review bills'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Custom Date Picker Inputs */}
      {dateRange === 'CUSTOM' && (
        <form onSubmit={handleApplyCustom} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{isHindi ? 'प्रारंभ दिनांक:' : 'From:'}</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              required
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{isHindi ? 'अंतिम दिनांक:' : 'To:'}</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              required
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
          >
            {isHindi ? 'लागू करें' : 'Apply Filter'}
          </button>
        </form>
      )}

      {/* 8 Real Database Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isHindi ? 'कुल सामान (प्रॉडक्ट्स)' : 'Total Products'}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {stats?.summary?.totalProducts ?? 0}
            </h3>
            <span className="text-[11px] text-slate-400">
              {isHindi ? 'कैटलॉग में दर्ज' : 'In system catalog'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Current Stock */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isHindi ? 'कुल वर्तमान स्टॉक' : 'Total Current Stock'}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {Number(stats?.summary?.totalStock ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[11px] text-slate-400">
              {isHindi ? 'सभी सामानों की कुल इकाइयाँ' : 'Total units across all items'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Today's Sales */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isHindi ? 'आज की कुल बिक्री कमाई' : "Today's Sales Value"}
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              ₹{Number(stats?.summary?.today?.salesAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-[11px] text-slate-400">
              {stats?.summary?.today?.transactionsCount ?? 0} {isHindi ? 'बिल आज कटे' : 'bills closed today'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Today's Sold Quantity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isHindi ? 'आज बिका हुआ कुल माल' : "Today's Quantity Sold"}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {Number(stats?.summary?.today?.quantitySold ?? 0).toFixed(2)}
            </h3>
            <span className="text-[11px] text-slate-400">
              {isHindi ? 'आज की कुल बिकी इकाई' : 'Sold volume today'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Today's Transactions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isHindi ? 'आज के कुल बिल (इनवॉइस)' : "Today's Transactions"}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {stats?.summary?.today?.transactionsCount ?? 0}
            </h3>
            <span className="text-[11px] text-slate-400">
              {isHindi ? 'पक्के चालान तैयार' : 'Invoices completed'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Card 6: Low Stock Products */}
        <div
          onClick={() => onNavigate('inventory', { filter: 'LOW_STOCK' })}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isHindi ? 'कम स्टॉक वाले सामान' : 'Low Stock Products'}
            </p>
            <h3 className={`text-2xl font-black mt-1 ${stats && (stats.summary?.lowStockCount ?? 0) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {stats?.summary?.lowStockCount ?? 0}
            </h3>
            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              {isHindi ? 'माल मंगाना जरूरी' : 'Action needed'} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 7: Range Selected Sales Value */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isHindi ? `बिक्री (${dateRange})` : `Sales (${dateRange})`}
            </p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">
              ₹{Number(stats?.summary?.selectedRange?.salesAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-[11px] text-slate-400">
              {stats?.summary?.selectedRange?.transactionsCount ?? 0} {isHindi ? 'लेन-देन' : 'transactions'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 8: Current Inventory Value */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isHindi ? 'दुकान में कुल माल की कीमत' : 'Current Inventory Value'}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              ₹{Number(stats?.summary?.inventoryValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-[11px] text-slate-400">
              {isHindi ? 'खरीद लागत के आधार पर' : 'Based on purchase cost'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="flex flex-wrap gap-3">
        <button
          id="dash-quick-sell-btn"
          onClick={() => onNavigate('sell')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs shadow-blue-600/30 transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isHindi ? 'पीओएस काउंटर (सामान बेचें)' : 'Point of Sale (Sell Product)'}</span>
        </button>
        <button
          id="dash-quick-add-stock-btn"
          onClick={onOpenAddStock}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-blue-600" />
          <span>{isHindi ? 'स्टॉक आवक जोड़ें' : 'Add Stock Inward'}</span>
        </button>
        <button
          id="dash-quick-new-product-btn"
          onClick={() => onNavigate('add-product')}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Package className="w-4 h-4 text-indigo-600" />
          <span>{isHindi ? 'नया उत्पाद पंजीकरण' : 'New Product Registration'}</span>
        </button>
      </div>

      {/* Grid: Charts & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Sales Trend (Real Database Chart) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isHindi ? 'पिछले 7 दिनों की बिक्री का ग्राफ़' : '7-Day Sales Performance'}
              </h3>
              <p className="text-xs text-slate-500">
                {isHindi ? 'दैनिक आय एवं बिलों की संख्या' : 'Daily revenue and transaction counts'}
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              {isHindi ? 'पिछले 7 दिन' : 'Last 7 Days'}
            </span>
          </div>

          {stats?.salesChart && stats.salesChart.length > 0 ? (
            <div className="space-y-4">
              <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-slate-100">
                {(() => {
                  const maxAmount = Math.max(...stats.salesChart.map(d => d.amount), 100);
                  return stats.salesChart.map((d, idx) => {
                    const heightPercent = Math.max(8, (d.amount / maxAmount) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                          ₹{d.amount.toFixed(2)} ({d.transactions} {isHindi ? 'बिल' : 'tx'})
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all ${
                            d.amount > 0 ? 'bg-blue-600 group-hover:bg-blue-500' : 'bg-slate-100'
                          }`}
                        />
                        <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center">
                          {d.date}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Day-by-day table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {stats.salesChart.slice(-4).map((d, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-xl text-center">
                    <p className="text-[10px] text-slate-400 font-medium">{d.date}</p>
                    <p className="text-xs font-bold text-slate-900">₹{d.amount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-500">
                      {d.transactions} {isHindi ? 'बिक्री' : 'orders'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              {isHindi ? 'इस अवधि के लिए कोई बिक्री दर्ज नहीं हुई।' : 'No activity recorded for this period.'}
            </div>
          )}
        </div>

        {/* Right 1 Col: Top Selling Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isHindi ? 'सर्वाधिक बिकने वाला सामान' : 'Top Selling Products'}
              </h3>
              <p className="text-xs text-slate-500">
                {isHindi ? 'बिक्री राशि के आधार पर रैंकिंग' : 'By sales revenue in selected range'}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {!stats || !stats.topSellingProducts || stats.topSellingProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {isHindi ? 'इस अवधि में कोई बिक्री नहीं हुई।' : 'No sales recorded in this period yet.'}
              </div>
            ) : (
              stats.topSellingProducts.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate('product-details', p.id)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black text-[11px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{autoTranslate(p.name)}</p>
                      <p className="text-[10px] text-slate-500">
                        SKU: <span className="font-mono">{p.sku}</span> • {isHindi ? 'बिक्री:' : 'Sold:'}{' '}
                        {p.total_sold_quantity} {autoTranslate(p.unit)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-900">₹{Number(p.total_sales_amount).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Attention List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isHindi ? 'कम स्टॉक चेतावनी केंद्र (Low Stock)' : 'Low Stock Alert Center'}
              </h3>
              <p className="text-xs text-slate-500">
                {isHindi
                  ? 'न्यूनतम सीमा से कम या ख़त्म होने वाले सामान'
                  : 'Products at or below minimum reorder threshold'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory', { filter: 'LOW_STOCK' })}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>{isHindi ? 'गोदाम में सभी देखें' : 'View All in Inventory'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!stats || !stats.lowStockProducts || stats.lowStockProducts.length === 0 ? (
          <div className="py-6 text-center text-xs text-emerald-600 font-semibold bg-emerald-50/50 rounded-xl border border-emerald-100">
            {isHindi
              ? '✓ बहुत बढ़िया! आपकी दुकान के सभी सामान पर्याप्त स्टॉक में उपलब्ध हैं।'
              : '✓ Excellent! All product inventory levels are currently above minimum stock thresholds.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.lowStockProducts.map(p => (
              <div
                key={p.id}
                className="p-3.5 border border-amber-200 bg-amber-50/40 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{autoTranslate(p.name)}</p>
                  <p className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</p>
                  <p className="text-[11px] text-amber-800 font-semibold mt-1">
                    {isHindi ? 'उपलब्ध:' : 'Available:'}{' '}
                    <span className="font-extrabold text-rose-600">
                      {p?.current_quantity ?? 0} {autoTranslate(p.unit)}
                    </span>{' '}
                    ({isHindi ? 'न्यूनतम' : 'Min'}: {p.minimum_stock})
                  </p>
                </div>
                <button
                  onClick={() => onOpenAddStock()}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer"
                >
                  {isHindi ? '+ स्टॉक' : 'Add Stock'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
