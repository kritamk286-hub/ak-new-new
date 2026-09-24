import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  IndianRupee,
  ShoppingCart,
  Boxes,
  PlusCircle,
  SlidersHorizontal,
  CreditCard,
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { DailyBusiness } from '../types';
import { api } from '../api';

export const DailyManagementView: React.FC = () => {
  // Current date in IST format: YYYY-MM-DD
  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayIST);
  const [data, setData] = useState<DailyBusiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDaily = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await api.getDaily(date);
      setData(res);
    } catch (err) {
      console.error('Failed to load daily business details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDaily(selectedDate);
  }, [selectedDate]);

  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handlePrintDailySummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Day-Wise Business Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily shop reconciliation, opening/closing stock, payment breakdowns & product-wise sales journal
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs text-xs">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-2 py-1 border-0 text-slate-900 font-bold focus:outline-hidden text-xs"
            />
            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(todayIST)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Today
          </button>

          <button
            onClick={handlePrintDailySummary}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors print:hidden"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Header Badge */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">
              Daily Ledger for{' '}
              {new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'full',
              }).format(new Date(selectedDate))}
            </h3>
            <span className="text-[11px] text-slate-400">AK ENTERPRISES • Indian Standard Time (IST)</span>
          </div>
        </div>
      </div>

      {/* 5 Daily Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Daily Sales</p>
          <h3 className="text-xl font-black text-emerald-600 mt-1">
            ₹{Number(data?.salesSummary?.total_sales_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] text-slate-400">
            {data?.salesSummary?.total_transactions || 0} bills closed
          </span>
        </div>

        {/* Total Quantity Sold */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sold Volume</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {Number(data?.salesSummary?.total_quantity_sold || 0).toFixed(2)}
          </h3>
          <span className="text-[10px] text-slate-400">Units sold today</span>
        </div>

        {/* Stock Added */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock Inward (माल आया)</p>
          <h3 className="text-xl font-black text-blue-600 mt-1">
            +{Number(data?.stockSummary?.stockAdded || 0).toFixed(2)}
          </h3>
          <span className="text-[10px] text-slate-400">Total inward units</span>
        </div>

        {/* Transactions count */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Bills (कुल बिल)</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {data?.salesSummary?.total_transactions || 0}
          </h3>
          <span className="text-[10px] text-slate-400">Invoices issued</span>
        </div>
      </div>

      {/* Grid: Payment Method Breakdown & Product-Wise Daily Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Breakdown Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Payment Breakdown</h3>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>

          {!data || !data.paymentBreakdown || data.paymentBreakdown.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No payments collected on this date.
            </div>
          ) : (
            <div className="space-y-3">
              {data.paymentBreakdown.map((pm, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 uppercase">{pm.payment_method}</span>
                    <p className="text-[10px] text-slate-400">{pm.count} transaction(s)</p>
                  </div>
                  <div className="text-right font-black text-slate-900">
                    ₹{Number(pm.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product-wise Daily Sales */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Product-Wise Sales for {selectedDate}</h3>
            <span className="text-xs text-slate-400">{data?.productSales?.length || 0} product(s) sold</span>
          </div>

          {!data || !data.productSales || data.productSales.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No product sales logged on this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-center">Quantity Sold</th>
                    <th className="py-2.5 px-3 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.productSales.map((ps, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-900">{ps.product_name}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{ps.sku}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {ps.quantity_sold} {ps.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        ₹{Number(ps.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stock Movements on this Day */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-4">
          All Stock Movements Logged on {selectedDate}
        </h3>

        {!data || data.movements.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No stock inward, sales, or audit movements logged on this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Time (IST)</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Change</th>
                  <th className="py-2.5 px-3 text-right">Before</th>
                  <th className="py-2.5 px-3 text-right">After</th>
                  <th className="py-2.5 px-3">Reason / Details</th>
                  <th className="py-2.5 px-3">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.movements.map(m => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {new Intl.DateTimeFormat('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        }).format(new Date(m.created_at))}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{m.product_name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {m.movement_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {m.previous_quantity} {m.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {m.new_quantity} {m.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{m.reason || 'Standard transaction'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{m.created_by}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
