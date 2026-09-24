import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Calendar,
  IndianRupee,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Tag,
  Package,
  X,
  RotateCcw,
} from 'lucide-react';
import { Sale, Product, Category } from '../types';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

interface SalesHistoryViewProps {
  products: Product[];
  categories?: Category[];
  initialSearch?: string;
  onOpenReceipt: (sale: Sale) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  products,
  categories = [],
  initialSearch = '',
  onOpenReceipt,
}) => {
  const { isHindi, autoTranslate } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Extract unique category options
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => set.add(c.name));
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [categories, products]);

  // Product map for quick lookup
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSales({
        search: search.trim() || undefined,
        category: category || undefined,
        productId: productId || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 15,
      });

      setSales(res.sales);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, category, productId, paymentMethod, status, dateFilter, page]);

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSales();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setProductId('');
    setPaymentMethod('');
    setStatus('');
    setDateFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(category) ||
    Boolean(productId) ||
    Boolean(paymentMethod) ||
    Boolean(status) ||
    dateFilter !== 'ALL';

  // Compute stats on current page list
  const pageTotalRevenue = useMemo(() => {
    return sales
      .filter(s => s.status !== 'CANCELLED')
      .reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
  }, [sales]);

  const pageTotalQuantity = useMemo(() => {
    return sales.reduce((acc, s) => {
      const qty = s.items?.[0]?.quantity || s.quantity || 0;
      return acc + (Number(qty) || 0);
    }, 0);
  }, [sales]);

  // Export CSV
  const handleExportCSV = () => {
    if (sales.length === 0) return;

    const headers = [
      'Invoice #',
      'Date & Time',
      'Customer',
      'Location / Destination',
      'Phone',
      'Product',
      'Category',
      'SKU',
      'Quantity',
      'Unit',
      'Rate (₹)',
      'Total Amount (₹)',
      'Payment',
      'Status',
      'Billed By',
    ];

    const rows = sales.map(s => {
      const item = s.items?.[0] || {
        product_id: s.product_id || '',
        product_name: s.product_name || '',
        product_sku: s.product_sku || '',
        category: s.category || s.product_category || '',
        quantity: s.quantity || 0,
        unit: s.unit || '',
        selling_price: s.selling_price || 0,
      };

      const prod = item.product_id ? productMap.get(item.product_id) : undefined;
      const catName = item.category || prod?.category || s.category || s.product_category || 'General';

      return [
        s.transaction_number,
        new Date(s.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        s.customer_name,
        s.customer_address || '',
        s.customer_phone || '',
        item.product_name,
        catName,
        item.product_sku || prod?.sku || '',
        item.quantity,
        item.unit || prod?.unit || '',
        item.selling_price,
        s.total_amount,
        s.payment_method,
        s.status,
        s.created_by,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for concise single-line date format: "23 Sep 2026 · 11:03 AM"
  const formatDateTime = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const datePart = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
      const timePart = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(d);
      return { datePart, timePart };
    } catch {
      return { datePart: isoDate, timePart: '' };
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {isHindi ? 'बिक्री बहीखाता व कर चालान (Sales Register)' : 'Sales Register'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHindi
              ? 'ऑडिट इतिहास, ग्राहक बिलिंग बहीखाता एवं पक्के बिलों का प्रिंट'
              : 'Audit history, customer billing ledger, and invoice re-prints'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isHindi ? 'सीएसवी डाउनलोड (CSV)' : 'Export CSV'}</span>
          </button>
          <button
            onClick={() => fetchSales()}
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title={isHindi ? 'बिक्री सूची ताज़ा करें' : 'Refresh sales list'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sleek KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {isHindi ? 'पृष्ठ बिक्री कमाई' : 'Page Revenue'}
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              ₹{pageTotalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {isHindi ? 'कुल बने बिल' : 'Invoices Found'}
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {totalCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {isHindi ? 'बिकी हुई कुल मात्रा' : 'Quantity Sold'}
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {pageTotalQuantity} {isHindi ? 'इकाई' : 'Units'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Clean Management Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 text-xs">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="sales-search-input"
              type="text"
              placeholder={isHindi ? 'ग्राहक, पता, सामान या बिल # खोजें...' : 'Search customer, location, bill #...'}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden text-slate-900 text-xs placeholder:text-slate-400"
            />
          </div>

          {/* Category dropdown */}
          <div className="md:col-span-3">
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="sales-category-filter"
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden text-slate-700 text-xs cursor-pointer font-medium"
              >
                <option value="">{isHindi ? 'सभी श्रेणियां' : 'All Categories'}</option>
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>
                    {autoTranslate(cat)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product dropdown */}
          <div className="md:col-span-2">
            <select
              value={productId}
              onChange={e => {
                setProductId(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden text-slate-700 text-xs cursor-pointer font-medium"
            >
              <option value="">{isHindi ? 'सभी सामान' : 'All Items'}</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {autoTranslate(p.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Payment dropdown */}
          <div className="md:col-span-2">
            <select
              value={paymentMethod}
              onChange={e => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden text-slate-700 text-xs cursor-pointer font-medium"
            >
              <option value="">{isHindi ? 'सभी भुगतान' : 'All Payments'}</option>
              <option value="Cash">{isHindi ? 'नकद (Cash)' : 'Cash'}</option>
              <option value="UPI">{isHindi ? 'यूपीआई (UPI)' : 'UPI'}</option>
              <option value="Card">{isHindi ? 'कार्ड (Card)' : 'Card'}</option>
              <option value="Credit">{isHindi ? 'उधार खाता (Credit)' : 'Credit'}</option>
            </select>
          </div>
        </div>

        {/* Date Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL', label: isHindi ? 'सभी समय' : 'All Time' },
              { id: 'TODAY', label: isHindi ? 'आज' : 'Today' },
              { id: 'YESTERDAY', label: isHindi ? 'कल' : 'Yesterday' },
              { id: 'LAST_7_DAYS', label: isHindi ? '7 दिन' : '7 Days' },
              { id: 'THIS_MONTH', label: isHindi ? 'इस महीने' : 'This Month' },
              { id: 'CUSTOM', label: isHindi ? 'कस्टम तारीखें...' : 'Custom Range...' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setDateFilter(tab.id);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  dateFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{isHindi ? 'फ़िल्टर हटाएं' : 'Reset filters'}</span>
              </button>
            )}
            <span className="text-[11px] text-slate-400">
              {sales.length} {isHindi ? 'रिकॉर्ड (कुल' : 'of'} {totalCount} {isHindi ? 'में से)' : 'records'}
            </span>
          </div>
        </div>

        {/* Custom date range picker if active */}
        {dateFilter === 'CUSTOM' && (
          <form onSubmit={handleApplyCustomDates} className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-slate-600 text-[11px] font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
              className="px-2 py-1 border border-slate-200 rounded-md bg-white text-xs"
            />
            <span className="text-slate-600 text-[11px] font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              required
              className="px-2 py-1 border border-slate-200 rounded-md bg-white text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold cursor-pointer"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* EXECUTIVE SALES LEDGER TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">{isHindi ? 'चालान संख्या' : 'Invoice'}</th>
                <th className="py-2.5 px-3.5">{isHindi ? 'दिनांक व समय' : 'Date & Time'}</th>
                <th className="py-2.5 px-3.5">{isHindi ? 'ग्राहक एवं पता' : 'Customer & Location'}</th>
                <th className="py-2.5 px-3.5">{isHindi ? 'सामान एवं श्रेणी' : 'Item & Category'}</th>
                <th className="py-2.5 px-3 text-center">{isHindi ? 'मात्रा' : 'Qty'}</th>
                <th className="py-2.5 px-3.5 text-right">{isHindi ? 'कुल राशि' : 'Amount'}</th>
                <th className="py-2.5 px-3 text-center">{isHindi ? 'भुगतान' : 'Mode'}</th>
                <th className="py-2.5 px-3.5 text-right">{isHindi ? 'पक्का बिल' : 'Receipt'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-xs">
                      {isHindi ? 'कोई लेन-देन नहीं मिला' : 'No transactions found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isHindi
                        ? 'पुराने रिकॉर्ड देखने के लिए खोज या तारीखें बदलें'
                        : 'Adjust your search or date filter to view past records'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-2.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isHindi ? 'फ़िल्टर हटाएं' : 'Clear Filters'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                sales.map(s => {
                  const item = s.items?.[0] || {
                    product_id: s.product_id || '',
                    product_name: s.product_name || 'Item',
                    product_sku: s.product_sku || '',
                    category: s.category || s.product_category || '',
                    quantity: s.quantity || 1,
                    unit: s.unit || '',
                    selling_price: s.selling_price || 0,
                  };

                  const prod = item.product_id ? productMap.get(item.product_id) : undefined;
                  const itemCategory = item.category || prod?.category || s.category || s.product_category || 'General';
                  const isCancelled = s.status === 'CANCELLED';
                  const { datePart, timePart } = formatDateTime(s.created_at);

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isCancelled ? 'bg-rose-50/20 opacity-70' : ''
                      }`}
                    >
                      {/* Invoice # */}
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        #{s.transaction_number}
                      </td>

                      {/* Clean Single-line Date & Time */}
                      <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap text-[11px]">
                        <span className="font-medium text-slate-900">{datePart}</span>
                        <span className="text-slate-400 ml-1.5">{timePart}</span>
                      </td>

                      {/* Customer & Location (Auto-translated / Transliterated) */}
                      <td className="py-2.5 px-3.5 max-w-[240px]">
                        <div className="font-semibold text-slate-900 truncate">
                          {autoTranslate(s.customer_name) || (isHindi ? 'दुकान ग्राहक' : 'Walk-in')}
                        </div>
                        <div
                          className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5"
                          title={s.customer_address || 'Shop Counter'}
                        >
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{autoTranslate(s.customer_address) || (isHindi ? 'दुकान काउंटर' : 'Shop Counter')}</span>
                        </div>
                      </td>

                      {/* Item & Category (Auto-translated) */}
                      <td className="py-2.5 px-3.5 max-w-[200px]">
                        <div className="font-medium text-slate-900 truncate">
                          {autoTranslate(item.product_name)}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          <span>{autoTranslate(itemCategory)}</span>
                          {(item.product_sku || prod?.sku) && (
                            <span> · {item.product_sku || prod?.sku}</span>
                          )}
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap text-xs font-semibold text-slate-800">
                        {item.quantity} {autoTranslate(item.unit)}
                      </td>

                      {/* Total Amount */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          ₹{Number(s.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ₹{Number(item.selling_price).toFixed(2)}/{autoTranslate(item.unit) || 'यूनिट'}
                        </div>
                      </td>

                      {/* Payment Mode */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="text-[11px] font-medium text-slate-600">
                          {autoTranslate(s.payment_method)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => onOpenReceipt(s)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                          title={isHindi ? 'पक्का बिल देखें व प्रिंट करें' : 'View & Print Tax Invoice'}
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isHindi ? 'पक्का बिल' : 'Bill'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="py-2.5 px-3.5 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 bg-slate-50/40">
            <span>
              Page <strong className="text-slate-800">{page}</strong> of{' '}
              <strong className="text-slate-800">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded-md bg-white disabled:opacity-40 hover:bg-slate-50 font-medium flex items-center gap-1 cursor-pointer text-xs"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-200 rounded-md bg-white disabled:opacity-40 hover:bg-slate-50 font-medium flex items-center gap-1 cursor-pointer text-xs"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
