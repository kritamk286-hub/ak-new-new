import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Download,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Boxes,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<string>('SALES');
  const [dateFilter, setDateFilter] = useState<string>('THIS_MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReports(
        reportType,
        dateFilter,
        startDate || undefined,
        endDate || undefined
      );
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, dateFilter]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchReport();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    const keys = Object.keys(reportData[0]);
    const headers = keys.map(k => k.replace(/_/g, ' ').toUpperCase());

    const rows = reportData.map(row => keys.map(k => row[k]));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AK_Enterprises_${reportType}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Business Intelligence & Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time query engine for revenue analysis, stock flow reconciliation, and accountant export
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportCSV}
            disabled={reportData.length === 0}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Control Panel (Hidden during Print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Report Type Selector */}
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1.5">Select Report Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'SALES', label: 'Sales Transaction Journal', icon: TrendingUp },
                { id: 'PRODUCT_WISE', label: 'Product-Wise Sales Analysis', icon: Boxes },
                { id: 'PAYMENT_METHOD', label: 'Payment Method Breakdown', icon: CreditCard },
                { id: 'STOCK_MOVEMENT', label: 'Stock Movement Flow Journal', icon: FileBarChart2 },
                { id: 'LOW_STOCK', label: 'Low Stock Deficit Report', icon: AlertTriangle },
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setReportType(t.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 font-semibold transition-all ${
                      reportType === t.id
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${reportType === t.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Period Filter */}
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1.5">Time Period Filter</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'TODAY', label: 'Today' },
                { id: 'YESTERDAY', label: 'Yesterday' },
                { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'PREVIOUS_MONTH', label: 'Last Month' },
                { id: 'CUSTOM', label: 'Custom Range' },
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setDateFilter(d.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    dateFilter === d.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {dateFilter === 'CUSTOM' && (
              <form onSubmit={handleApplyCustom} className="flex items-center gap-2 mt-3 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Run Query
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Printable Report Document */}
      <div id="printable-report" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs">
        {/* Printable Header */}
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">AK ENTERPRISES</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Official Management & Audit Report: <strong className="text-slate-900 uppercase">{reportType.replace(/_/g, ' ')}</strong>
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Period: <strong className="text-slate-900">{dateFilter}</strong></p>
            <p>Generated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</p>
          </div>
        </div>

        {/* Report Content Table */}
        <div className="pt-6">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Running SQL analytical query on shop database...
            </div>
          ) : reportData.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No matching records found for the selected report filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <tr>
                    {Object.keys(reportData[0]).map((col, idx) => (
                      <th key={idx} className="py-3 px-3">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {Object.keys(row).map((col, cIdx) => {
                        const val = row[col];
                        const isNum = typeof val === 'number';
                        return (
                          <td
                            key={cIdx}
                            className={`py-3 px-3 ${
                              isNum ? 'font-mono text-slate-900 font-bold' : 'text-slate-700 font-medium'
                            }`}
                          >
                            {col.toLowerCase().includes('date') || col.toLowerCase().includes('at')
                              ? new Date(val).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                              : col.toLowerCase().includes('amount') || col.toLowerCase().includes('price')
                              ? `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                              : String(val ?? '-')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Printable Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>AK ENTERPRISES • Confidential Commercial Ledger</span>
          <span>Verified & Certified by System Admin</span>
        </div>
      </div>
    </div>
  );
};
