import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Boxes,
  PlusCircle,
  SlidersHorizontal,
  Package,
  TrendingUp,
  History,
  ShoppingCart,
  Calendar,
  AlertTriangle,
  Receipt,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Product, StockMovement, SaleItem } from '../types';
import { api } from '../api';

interface ProductDetailsViewProps {
  productId: string;
  onBack: () => void;
  onOpenAddStock: (productId: string) => void;
  onNavigateToSell?: (productId: string) => void;
  onOpenEditProduct?: (product: Product) => void;
  onOpenDeleteProduct?: (product: Product) => void;
}

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  productId,
  onBack,
  onOpenAddStock,
  onNavigateToSell,
  onOpenEditProduct,
  onOpenDeleteProduct,
}) => {
  const [data, setData] = useState<{
    product: Product;
    stats: {
      totalAdded: number;
      totalSold: number;
      totalRevenue: number;
      totalTransactions: number;
    };
    recentMovements: StockMovement[];
    recentSales: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'movements' | 'sales'>('movements');

  const fetchDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getProduct(productId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load product details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchDetails();
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading product details and history journal...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs space-y-3">
        <p className="font-bold">Error loading product:</p>
        <p>{error || 'Product not found.'}</p>
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold"
        >
          Return to Inventory
        </button>
      </div>
    );
  }

  const product = (data.product || ((data as any).name ? (data as any) : null)) as Product | null;

  if (!product) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs space-y-3">
        <p className="font-bold">Error loading product:</p>
        <p>Product record not found.</p>
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold"
        >
          Return to Inventory
        </button>
      </div>
    );
  }

  const currentQty = Number(product.current_quantity ?? 0);
  const minStock = Number(product.minimum_stock ?? 0);
  const isOutOfStock = currentQty <= 0;
  const isLowStock = !isOutOfStock && currentQty <= minStock;

  const stats = data.stats || {
    totalAdded: 0,
    totalSold: 0,
    totalRevenue: 0,
    totalTransactions: 0,
  };
  const recentMovements = (data.recentMovements || (data as any).movements || []) as StockMovement[];
  const recentSales = (data.recentSales || (data as any).sales || []) as any[];

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {product.sku}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unit: {product.unit}{product.supplier_name ? ` • Supplier: ${product.supplier_name}` : ''}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToSell && (
            <button
              onClick={() => onNavigateToSell(product.id)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Sell This Item (सामान बेचें)</span>
            </button>
          )}
          <button
            onClick={() => onOpenAddStock(product.id)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Stock (माल आया)</span>
          </button>
          {onOpenEditProduct && (
            <button
              onClick={() => onOpenEditProduct(product)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Edit (एडिट करें)</span>
            </button>
          )}
          {onOpenDeleteProduct && (
            <button
              onClick={() => onOpenDeleteProduct(product)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete (हटाएं)</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Stat Cards for Product */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Stock */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stock</p>
              <h3
                className={`text-2xl font-black mt-1 ${
                  isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {product.current_quantity} {product.unit}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] flex items-center justify-between text-slate-500 border-t border-slate-100 pt-2">
            <span>Min Alert: {product.minimum_stock} {product.unit}</span>
            <span className="font-bold">
              {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'HEALTHY'}
            </span>
          </div>
        </div>

        {/* Total Inward Added */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock Added</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {Number(stats.totalAdded).toFixed(2)} {product.unit}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Opening: {product.opening_quantity} {product.unit}
          </p>
        </div>

        {/* Total Sold */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Quantity Sold</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {Number(stats.totalSold).toFixed(2)} {product.unit}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Across {stats.totalTransactions} completed transactions
          </p>
        </div>

        {/* Total Revenue Generated */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Value</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                ₹{Number(stats.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Selling Price: ₹{product.selling_price} / {product.unit}
          </p>
        </div>
      </div>

      {/* Tabs for History Journal & Sales */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-6 pt-4 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('movements')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'movements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Stock Movement Journal ({recentMovements.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'sales'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales History ({recentSales.length})</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'movements' ? (
            recentMovements.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No stock movements logged for this product.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time (IST)</th>
                      <th className="py-2.5 px-3">Action / Movement Type</th>
                      <th className="py-2.5 px-3 text-right">Quantity Change</th>
                      <th className="py-2.5 px-3 text-right">Previous Stock</th>
                      <th className="py-2.5 px-3 text-right">New Balance</th>
                      <th className="py-2.5 px-3">Reason / Details</th>
                      <th className="py-2.5 px-3">Logged By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentMovements.map(m => {
                      const isPositive = m.quantity > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {new Date(m.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.movement_type === 'STOCK_ADDED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.movement_type === 'SALE_CREATED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : m.movement_type === 'STOCK_ADJUSTED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : m.movement_type === 'SALE_CANCELLED'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.movement_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold">
                            <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                              {isPositive ? `+${m.quantity}` : m.quantity} {product.unit}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500 font-medium">
                            {m.previous_quantity} {product.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900">
                            {m.new_quantity} {product.unit}
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            <div>{m.reason || 'Standard transaction'}</div>
                            {m.notes && <span className="text-[10px] text-slate-400">{m.notes}</span>}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-medium">{m.created_by}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : recentSales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No sales logged for this product yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Transaction #</th>
                    <th className="py-2.5 px-3">Date (IST)</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{s.transaction_number}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(s.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{s.customer_name}</div>
                        {s.customer_address && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]" title={s.customer_address}>
                            {s.customer_address}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold">
                        {s.quantity} {s.unit}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">₹{Number(s.selling_price).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        ₹{Number(s.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {s.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'EDITED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
