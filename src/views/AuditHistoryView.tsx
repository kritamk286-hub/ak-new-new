import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  RefreshCw,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  PlusCircle,
  Edit3,
  Trash2,
  PackageCheck,
  Boxes,
  ShoppingCart,
  Settings,
  UserCheck,
  X,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  User,
  Hash,
} from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../api';

export const AuditHistoryView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({
        action: action || undefined,
        search: search.trim() || undefined,
        page,
        limit: 25,
      });
      setLogs(res.logs || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [action, search, page]);

  // Parse JSON helper
  const tryParseJson = (str?: string | null): any => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  // Get action styling and icon
  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'PRODUCT_CREATED':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Product Added (सामान जोड़ा)',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'PRODUCT_UPDATED':
        return {
          icon: <Edit3 className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Product Edited (सामान बदलाव)',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'PRODUCT_DELETED':
        return {
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Product Deleted (सामान हटाया)',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'STOCK_ADDED':
        return {
          icon: <Boxes className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Stock Added (माल आया)',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'STOCK_ADJUSTED':
        return {
          icon: <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Stock Adjusted (स्टॉक एडजस्ट)',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'SALE_CREATED':
        return {
          icon: <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Sale Billed (बिक्री बिल)',
          badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
        };
      case 'SALE_CANCELLED':
        return {
          icon: <X className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Sale Cancelled (बिल रद्द)',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'SETTINGS_UPDATED':
        return {
          icon: <Settings className="w-3.5 h-3.5 text-purple-600" />,
          label: 'Settings Updated (सेटिंग्स)',
          badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      case 'CATEGORY_CREATED':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5 text-cyan-600" />,
          label: 'Category Added (श्रेणी जोड़ी)',
          badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        };
      case 'LOGIN':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-slate-600" />,
          label: 'Admin Login',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      default:
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />,
          label: actionType.replace(/_/g, ' '),
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  // Render Diff in modal
  const renderDetailDiff = (log: AuditLog) => {
    const oldObj = tryParseJson(log.old_value);
    const newObj = tryParseJson(log.new_value);

    // If it's a product update with before & after objects
    if (log.action === 'PRODUCT_UPDATED' && oldObj && newObj && typeof oldObj === 'object' && typeof newObj === 'object') {
      const keys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
      const changedKeys = keys.filter(k => oldObj[k] !== newObj[k]);

      return (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Changes Applied (क्या बदला गया)
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
            <div className="grid grid-cols-12 bg-slate-50 py-2 px-3 font-bold text-slate-600">
              <div className="col-span-4">Field (फ़ील्ड)</div>
              <div className="col-span-4 text-rose-700">Previous Value (पुराना)</div>
              <div className="col-span-4 text-emerald-700">Updated Value (नया)</div>
            </div>
            {changedKeys.map(k => {
              const formatKey = k.replace(/_/g, ' ');
              const oldVal = oldObj[k] !== undefined && oldObj[k] !== null ? String(oldObj[k]) : 'None';
              const newVal = newObj[k] !== undefined && newObj[k] !== null ? String(newObj[k]) : 'None';
              return (
                <div key={k} className="grid grid-cols-12 py-2.5 px-3 items-center hover:bg-slate-50/50">
                  <div className="col-span-4 font-bold text-slate-800 capitalize">{formatKey}</div>
                  <div className="col-span-4 text-rose-600 bg-rose-50/70 px-2 py-0.5 rounded font-mono break-all inline-block self-start">
                    {oldVal}
                  </div>
                  <div className="col-span-4 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold font-mono break-all inline-block self-start">
                    {newVal}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // If it's a product created
    if (log.action === 'PRODUCT_CREATED' && newObj && typeof newObj === 'object') {
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Initial Product Information (शुरुआती जानकारी)
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(newObj).map(([k, v]) => (
              <div key={k} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px] capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="font-bold text-slate-900 font-mono">{String(v ?? 'None')}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // If it's a product deleted
    if (log.action === 'PRODUCT_DELETED' && oldObj && typeof oldObj === 'object') {
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Deleted Item Snapshot (हटाए गए सामान का विवरण)
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(oldObj).map(([k, v]) => (
              <div key={k} className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-200/60">
                <span className="text-rose-700/70 block text-[11px] capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="font-bold text-slate-900 font-mono">{String(v ?? 'None')}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Fallback display
    return (
      <div className="space-y-3">
        {log.old_value && (
          <div>
            <h5 className="text-[11px] font-bold text-slate-500 mb-1">Previous Data:</h5>
            <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono overflow-x-auto text-slate-800">
              {typeof oldObj === 'object' ? JSON.stringify(oldObj, null, 2) : String(log.old_value)}
            </pre>
          </div>
        )}
        {log.new_value && (
          <div>
            <h5 className="text-[11px] font-bold text-slate-500 mb-1">New / Registered Data:</h5>
            <pre className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-mono overflow-x-auto text-slate-800">
              {typeof newObj === 'object' ? JSON.stringify(newObj, null, 2) : String(log.new_value)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">History & Audit Trail (इतिहास व रिकॉर्ड)</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1 border border-blue-200">
              <Lock className="w-3 h-3 text-blue-600" /> Automatic Logging
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Every product add, edit, price change, deletion, stock arrival, sales bill, and setting adjustment is automatically recorded with full audit details.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors self-start sm:self-auto cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
          title="Refresh audit history"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filter and Quick Action Pills */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Search & Action selector */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="audit-search-input"
              type="text"
              placeholder="Search product, SKU, changes, staff, invoice..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
            />
          </div>

          <div className="sm:col-span-5">
            <select
              value={action}
              onChange={e => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-semibold text-slate-800"
            >
              <option value="">All Action Types (सभी गतिविधियाँ)</option>
              <option value="PRODUCT_CREATED">➕ Product Added (नया सामान जोड़ा)</option>
              <option value="PRODUCT_UPDATED">✏️ Product Edited (सामान में बदलाव)</option>
              <option value="PRODUCT_DELETED">🗑️ Product Deleted (सामान हटाया)</option>
              <option value="STOCK_ADDED">📦 Inward Stock Added (माल आया)</option>
              <option value="STOCK_ADJUSTED">⚖️ Stock Adjusted (स्टॉक सुधार)</option>
              <option value="SALE_CREATED">🛒 Sale Billed (बिक्री बिल)</option>
              <option value="SALE_CANCELLED">❌ Sale Cancelled (बिल रद्द)</option>
              <option value="CATEGORY_CREATED">🏷️ Category Created (श्रेणी जोड़ी)</option>
              <option value="SETTINGS_UPDATED">⚙️ Settings Updated (दुकान सेटिंग्स)</option>
              <option value="LOGIN">🔐 Admin Login</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400 font-medium mr-1">Quick:</span>
          {[
            { id: '', label: 'All Events' },
            { id: 'PRODUCT_UPDATED', label: '✏️ Product Edits' },
            { id: 'PRODUCT_CREATED', label: '➕ Products Added' },
            { id: 'PRODUCT_DELETED', label: '🗑️ Deletions' },
            { id: 'STOCK_ADDED', label: '📦 Stock Arrivals' },
            { id: 'SALE_CREATED', label: '🛒 Sales' },
            { id: 'SETTINGS_UPDATED', label: '⚙️ Settings' },
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => {
                setAction(pill.id);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                action === pill.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Total logged events: <strong className="text-slate-900">{total}</strong>
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Permanent ledger & time-stamped history
          </span>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Date & Time (IST)</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Item / Entity</th>
                <th className="py-3 px-4">Details & What Changed</th>
                <th className="py-3 px-4 text-right">Quantity Delta</th>
                <th className="py-3 px-4 text-right">Stock Impact</th>
                <th className="py-3 px-4">Staff</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <History className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No history events found.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try clearing search or filters to see all recorded activities.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const badge = getActionBadge(log.action);
                  const hasDetails = Boolean(log.old_value || log.new_value);

                  return (
                    <tr
                      key={log.id}
                      onClick={() => hasDetails && setSelectedLog(log)}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasDetails ? 'cursor-pointer' : ''
                      }`}
                    >
                      {/* IST Date/Time */}
                      <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {new Intl.DateTimeFormat('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }).format(new Date(log.created_at))}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Intl.DateTimeFormat('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          }).format(new Date(log.created_at))}
                        </div>
                      </td>

                      {/* Action badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.badgeClass}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Entity / Product Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 max-w-[160px] truncate" title={log.product_name || log.entity_type}>
                          {log.product_name || log.entity_type}
                        </div>
                        {log.transaction_id && (
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-0.5 mt-0.5">
                            <Hash className="w-2.5 h-2.5" />
                            <span>{log.transaction_id}</span>
                          </div>
                        )}
                      </td>

                      {/* Reason & What Changed */}
                      <td className="py-3 px-4 text-slate-700">
                        <div className="max-w-md font-medium text-slate-800 leading-snug">
                          {log.reason || 'Operation logged'}
                        </div>
                        {log.action === 'PRODUCT_UPDATED' && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Click to view before & after comparison</span>
                          </div>
                        )}
                      </td>

                      {/* Quantity Delta */}
                      <td className="py-3 px-4 text-right font-bold">
                        {log.quantity_difference !== null && log.quantity_difference !== undefined ? (
                          <span
                            className={
                              log.quantity_difference > 0
                                ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono'
                                : log.quantity_difference < 0
                                ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono'
                                : 'text-slate-500'
                            }
                          >
                            {log.quantity_difference > 0 ? `+${log.quantity_difference}` : log.quantity_difference}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Stock Impact */}
                      <td className="py-3 px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                        {log.previous_stock !== null && log.new_stock !== null ? (
                          <span className="font-mono text-xs">
                            <span className="text-slate-500">{log.previous_stock}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <strong className="text-slate-900 font-extrabold">{log.new_stock}</strong>
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Staff */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="max-w-[120px] truncate" title={log.performed_by}>
                            {log.performed_by.split('@')[0]}
                          </span>
                        </div>
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 text-center">
                        {hasDetails ? (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Inspect full recorded details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total entries)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Recorded Event Details (ऑडिट विवरण)</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Event Metadata Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Action</span>
                  <span className="font-bold text-slate-900">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Target</span>
                  <span className="font-bold text-slate-900">{selectedLog.product_name || selectedLog.entity_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Performed By</span>
                  <span className="font-bold text-slate-900 truncate block">{selectedLog.performed_by}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Timestamp</span>
                  <span className="font-mono font-bold text-slate-900">
                    {new Intl.DateTimeFormat('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    }).format(new Date(selectedLog.created_at))}
                  </span>
                </div>
              </div>

              {/* Description / Reason */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block mb-1">
                  Recorded Summary / Reason
                </span>
                <p className="font-semibold text-slate-900 text-sm">
                  {selectedLog.reason || 'Standard operation'}
                </p>
              </div>

              {/* Stock Movement if applicable */}
              {(selectedLog.previous_stock !== null || selectedLog.quantity_difference !== null) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-slate-700">Stock Quantity Adjustment:</span>
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    {selectedLog.previous_stock !== null && (
                      <span>{selectedLog.previous_stock} → {selectedLog.new_stock} </span>
                    )}
                    {selectedLog.quantity_difference !== null && selectedLog.quantity_difference !== undefined && (
                      <span className={Number(selectedLog.quantity_difference) >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        ({Number(selectedLog.quantity_difference) >= 0 ? `+${selectedLog.quantity_difference}` : selectedLog.quantity_difference})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Render Diff or payload */}
              {renderDetailDiff(selectedLog)}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedLog.created_at}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close (बंद करें)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
