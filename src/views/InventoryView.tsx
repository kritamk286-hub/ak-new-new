import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  PlusCircle,
  PackagePlus,
  ArrowUpDown,
  ShoppingCart,
  Sparkles,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface InventoryViewProps {
  products: Product[];
  categories?: { id: string; name: string }[];
  initialFilter?: string;
  onOpenAddProduct: () => void;
  onOpenAddStock: (productId?: string) => void;
  onViewProductDetails: (productId: string) => void;
  onNavigateToSell?: (productId?: string) => void;
  onOpenEditProduct?: (product: Product) => void;
  onOpenDeleteProduct?: (product: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  initialFilter = 'ALL',
  onOpenAddProduct,
  onOpenAddStock,
  onViewProductDetails,
  onNavigateToSell,
  onOpenEditProduct,
  onOpenDeleteProduct,
}) => {
  const { isHindi, autoTranslate } = useLanguage();
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<string>(initialFilter);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return (products || [])
      .filter(p => {
        if (!p) return false;
        const currQty = Number(p.current_quantity ?? 0);
        const minStock = Number(p.minimum_stock ?? 0);

        // Stock status filter
        if (stockFilter === 'LOW_STOCK') {
          if (currQty <= 0 || currQty > minStock) return false;
        } else if (stockFilter === 'OUT_OF_STOCK') {
          if (currQty > 0) return false;
        } else if (stockFilter === 'IN_STOCK') {
          if (currQty <= minStock) return false;
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = (p.name || '').toLowerCase().includes(q);
          const matchSku = (p.sku || '').toLowerCase().includes(q);
          const matchSupplier = (p.supplier_name || '').toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchSupplier) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return sortOrder === 'asc'
            ? (a.name || '').localeCompare(b.name || '')
            : (b.name || '').localeCompare(a.name || '');
        }
        if (sortBy === 'stock') {
          const stockA = Number(a.current_quantity ?? 0);
          const stockB = Number(b.current_quantity ?? 0);
          return sortOrder === 'asc' ? stockA - stockB : stockB - stockA;
        }
        if (sortBy === 'price') {
          const pA = Number(a.selling_price) || 0;
          const pB = Number(b.selling_price) || 0;
          return sortOrder === 'asc' ? pA - pB : pB - pA;
        }
        return 0;
      });
  }, [products, search, stockFilter, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'stock' | 'price') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // If there are 0 products in total
  if (products.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <Boxes className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Store Catalog Empty
            </h2>
            <p className="text-xs text-slate-500">
              Add your first item to start tracking inventory and billing customers.
            </p>
          </div>

          <div className="pt-2">
            <button
              id="empty-state-add-product-btn"
              onClick={() => onOpenAddProduct()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-2xs text-xs transition-colors cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {isHindi ? 'सामान व स्टॉक गोदाम (Products & Inventory)' : 'Products & Inventory'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHindi
              ? 'स्टॉक स्थिति, मूल्य सूची एवं त्वरित बिक्री बिलिंग'
              : 'Stock levels, pricing catalogue, and rapid billing access'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToSell && (
            <button
              id="inv-sell-product-btn"
              onClick={() => onNavigateToSell()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{isHindi ? 'सामान बेचें' : 'Sell Product'}</span>
            </button>
          )}
          <button
            id="inv-add-stock-btn"
            onClick={() => onOpenAddStock()}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>{isHindi ? 'स्टॉक जोड़ें' : 'Add Stock'}</span>
          </button>
          <button
            id="inv-new-product-btn"
            onClick={() => onOpenAddProduct()}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>{isHindi ? 'नया सामान' : 'New Item'}</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="inv-search-input"
              type="text"
              placeholder={isHindi ? 'सामान का नाम या कोड खोजें...' : 'Search product name or code...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden text-slate-800 text-xs"
            />
          </div>

          {/* Stock Status Pills */}
          <div className="sm:col-span-6 flex items-center gap-1 overflow-x-auto justify-start sm:justify-end">
            {[
              { id: 'ALL', label: isHindi ? 'सभी' : 'All' },
              { id: 'IN_STOCK', label: isHindi ? 'स्टॉक उपलब्ध' : 'In Stock' },
              { id: 'LOW_STOCK', label: isHindi ? 'कम स्टॉक' : 'Low Stock' },
              { id: 'OUT_OF_STOCK', label: isHindi ? 'स्टॉक समाप्त' : 'Out of Stock' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStockFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  stockFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count & active tags */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px] text-slate-400">
          <span>
            {isHindi ? 'दिखाए जा रहे हैं:' : 'Showing'} <strong className="text-slate-700">{filteredProducts.length}</strong> {isHindi ? 'सामान (कुल' : 'of'}{' '}
            {products.length} {isHindi ? 'में से)' : 'products'}
          </span>
          {(search || stockFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStockFilter('ALL');
              }}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              {isHindi ? 'फ़िल्टर हटाएं' : 'Reset filter'}
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th
                  className="py-2.5 px-3.5 cursor-pointer select-none"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>{isHindi ? 'सामान' : 'Product'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-2.5 px-3.5 cursor-pointer select-none"
                  onClick={() => toggleSort('stock')}
                >
                  <div className="flex items-center gap-1">
                    <span>{isHindi ? 'उपलब्ध स्टॉक' : 'Stock'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-2.5 px-3.5 text-right cursor-pointer select-none"
                  onClick={() => toggleSort('price')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{isHindi ? 'दर (₹)' : 'Rate (₹)'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">{isHindi ? 'स्थिति' : 'Status'}</th>
                <th className="py-2.5 px-3.5 text-right">{isHindi ? 'कार्रवाई' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    <Boxes className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-700 text-xs">
                      {isHindi ? 'कोई सामान नहीं मिला' : 'No matching products'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isHindi
                        ? 'खोज हटाएं या नया सामान जोड़ें'
                        : 'Try clearing the search or add a new item'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const currQty = Number(p.current_quantity ?? 0);
                  const minStock = Number(p.minimum_stock ?? 0);
                  const isOutOfStock = currQty <= 0;
                  const isLowStock = !isOutOfStock && currQty <= minStock;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => onViewProductDetails(p.id)}
                    >
                      {/* Product Name */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {autoTranslate(p.name)}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          {p.category && <span>{autoTranslate(p.category)}</span>}
                          {p.sku && <span>· {p.sku}</span>}
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {p.current_quantity}
                        </span>{' '}
                        <span className="text-slate-400 text-[11px]">{autoTranslate(p.unit)}</span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          ₹{Number(p.selling_price || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="text-[11px] font-semibold text-rose-600">
                            {isHindi ? 'स्टॉक समाप्त' : 'Out of stock'}
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[11px] font-semibold text-amber-600">
                            {isHindi ? `कम स्टॉक (${p.minimum_stock})` : `Low stock (${p.minimum_stock})`}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-700">
                            {isHindi ? 'स्टॉक उपलब्ध' : 'In stock'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-2.5 px-3.5 text-right whitespace-nowrap"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {onNavigateToSell && (
                            <button
                              onClick={() => onNavigateToSell(p.id)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
                              title={isHindi ? 'यह सामान बेचें' : 'Sell this item'}
                            >
                              {isHindi ? 'बेचें' : 'Sell'}
                            </button>
                          )}
                          <button
                            onClick={() => onOpenAddStock(p.id)}
                            className="px-2 py-1 bg-slate-50 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors cursor-pointer"
                            title={isHindi ? 'स्टॉक बढ़ाएं' : 'Add Stock'}
                          >
                            {isHindi ? '+ स्टॉक' : '+ Stock'}
                          </button>
                          {onOpenEditProduct && (
                            <button
                              onClick={() => onOpenEditProduct(p)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                              title={isHindi ? 'संपादित करें' : 'Edit'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onOpenDeleteProduct && (
                            <button
                              onClick={() => onOpenDeleteProduct(p)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title={isHindi ? 'हटाएं' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
