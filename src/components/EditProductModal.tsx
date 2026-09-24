import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle, Trash2, CheckCircle2, PackageCheck } from 'lucide-react';
import { Product, UnitType } from '../types';
import { api } from '../api';

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  categories?: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
  onDeleteRequest?: (product: Product) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  product,
  categories = [],
  onClose,
  onSuccess,
  onDeleteRequest,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('General');
  const [unit, setUnit] = useState<UnitType>('Piece');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [minimumStock, setMinimumStock] = useState('5');
  const [supplierName, setSupplierName] = useState('');
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setCategory(product.category || 'General');
      setUnit(product.unit || 'Piece');
      setCurrentQuantity(product.current_quantity !== undefined ? String(product.current_quantity) : '0');
      setSellingPrice(product.selling_price !== undefined ? String(product.selling_price) : '0');
      setPurchasePrice(product.purchase_price !== undefined ? String(product.purchase_price) : '0');
      setMinimumStock(product.minimum_stock !== undefined ? String(product.minimum_stock) : '5');
      setSupplierName(product.supplier_name || '');
      setDescription(product.description || '');
      setError(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter the product / item name.');
      return;
    }

    const sp = parseFloat(sellingPrice);
    if (isNaN(sp) || sp < 0) {
      setError('Please enter a valid selling price (₹).');
      return;
    }

    const cq = parseFloat(currentQuantity);
    if (isNaN(cq) || cq < 0) {
      setError('Please enter a valid available stock quantity (0 or greater).');
      return;
    }

    setIsLoading(true);
    try {
      const updated = await api.updateProduct(product.id, {
        name: name.trim(),
        sku: sku.trim() || product.sku,
        category: category.trim() || 'General',
        unit,
        current_quantity: cq,
        selling_price: sp,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : 0,
        minimum_stock: minimumStock ? parseFloat(minimumStock) : 5,
        supplier_name: supplierName.trim() || undefined,
        description: description.trim() || undefined,
      });

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update product.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Edit Product (सामान एडिट करें)</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Code: {product.sku} • Current Stock: {product.current_quantity} {product.unit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Available Stock (Permission Enabled) */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-current-quantity" className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <span>Current Available Stock (वर्तमान उपलब्ध मात्रा)</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Permission Enabled (एडिट करने की अनुमति)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  id="edit-current-quantity"
                  type="number"
                  step="any"
                  min="0"
                  value={currentQuantity}
                  onChange={e => setCurrentQuantity(e.target.value)}
                  required
                  placeholder="0"
                  className="w-full pl-3.5 pr-20 py-2.5 bg-white border border-emerald-300 rounded-xl font-black text-slate-900 text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                  {unit}
                </span>
              </div>
            </div>

            {/* Live Comparison / Delta info */}
            {product && !isNaN(parseFloat(currentQuantity)) && parseFloat(currentQuantity) !== product.current_quantity && (
              <div className="text-[11px] font-semibold text-emerald-900 bg-white/90 p-2 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span>Stock Count Adjustment:</span>
                <span className="font-mono font-bold">
                  {product.current_quantity} {product.unit} → <strong className="text-slate-900">{parseFloat(currentQuantity)} {unit}</strong>{' '}
                  <span className={parseFloat(currentQuantity) >= product.current_quantity ? 'text-emerald-700' : 'text-rose-700'}>
                    ({parseFloat(currentQuantity) - product.current_quantity >= 0 ? '+' : ''}
                    {(parseFloat(currentQuantity) - product.current_quantity).toFixed(2).replace(/\.00$/, '')})
                  </span>
                </span>
              </div>
            )}
            <p className="text-[11px] text-emerald-800/80 leading-tight">
              You can directly edit the on-hand stock count here. The adjustment and quantity difference will be tracked in the audit history.
            </p>
          </div>

          {/* 1. Item Name */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Item / Product Name (सामान का नाम) <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-product-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden text-base shadow-2xs"
            />
          </div>

          {/* 2. Selling Price & Purchase Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Selling Price (बिक्री दर) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  id="edit-selling-price"
                  type="number"
                  step="any"
                  min="0"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  required
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Price charged to customer</span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Purchase / Cost Price (खरीद दर)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  id="edit-purchase-price"
                  type="number"
                  step="any"
                  min="0"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Cost price (optional)</span>
            </div>
          </div>

          {/* 3. Unit & Low Stock Alert */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Unit (माप की इकाई)
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as UnitType)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Piece">Pieces (नग / Pcs)</option>
                <option value="Kg">Kilogram (किलो / Kg)</option>
                <option value="Gram">Gram (ग्राम / gm)</option>
                <option value="Liter">Liter (लीटर / Ltr)</option>
                <option value="Meter">Meter (मीटर / mtr)</option>
                <option value="Box">Box (पेटी / डिब्बा)</option>
                <option value="Packet">Packet (पैकेट)</option>
                <option value="Other">Other (अन्य)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Low Stock Alert (कम स्टॉक अलर्ट)
              </label>
              <input
                id="edit-minimum-stock"
                type="number"
                step="any"
                min="0"
                value={minimumStock}
                onChange={e => setMinimumStock(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl font-semibold border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">Alert when stock falls below this</span>
            </div>
          </div>

          {/* 4. Category & Supplier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Grocery, Dairy, Hardware"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Supplier Name</label>
              <input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="Vendor or supplier"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 5. Description / Notes */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Description / Notes (विवरण)</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details or specifications..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            {onDeleteRequest ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteRequest(product);
                }}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete (हटाएं)</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Changes (बदलाव सहेजें)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
