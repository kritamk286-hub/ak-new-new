import React, { useState } from 'react';
import { X, PackagePlus, AlertCircle, ChevronDown, ChevronUp, Sparkles, Lock } from 'lucide-react';
import { Product, UnitType } from '../types';
import { api } from '../api';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Product) => void;
  categories?: { id: string; name: string }[];
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState<UnitType>('Piece');
  const [openingQty, setOpeningQty] = useState('10');
  const [minimumStock, setMinimumStock] = useState('5');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter the product / item name.');
      return;
    }

    setIsLoading(true);
    try {
      // Auto-generate a clean SKU if the user left it blank
      const finalSku = sku.trim() ? sku.trim().toUpperCase() : 'ITEM-' + Math.floor(1000 + Math.random() * 9000);

      const created = await api.createProduct({
        name: name.trim(),
        sku: finalSku,
        category: 'General',
        unit,
        opening_quantity: parseFloat(openingQty) || 0,
        minimum_stock: parseFloat(minimumStock) || 5,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : 0,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : 0,
        supplier_name: supplierName.trim() || undefined,
        description: description.trim() || undefined,
        status,
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product.');
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
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Add New Item (नया सामान जोड़ें)</h3>
              <p className="text-[11px] text-slate-400">
                Quickly add an item to your permanent shop inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
          {/* Catalog Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Store catalog entry: once added, you can edit prices, details, or adjust settings anytime.</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Item Name */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Item / Product Name (सामान का नाम) <span className="text-rose-500">*</span>
            </label>
            <input
              id="product-name-input"
              type="text"
              placeholder="e.g. Basmati Rice, Tata Salt, Parle-G, Milk"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden text-base shadow-2xs"
            />
          </div>

          {/* 2. Selling Price & Cost Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Selling Price (बिक्री मूल्य) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  id="product-selling-price-input"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  required
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Price customer pays</span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Purchase / Cost Price (खरीद मूल्य)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">What you paid (optional)</span>
            </div>
          </div>

          {/* 3. Initial Stock & Unit of Measure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Stock in Hand (शुरुआती मात्रा)
              </label>
              <input
                id="product-opening-qty-input"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 10 or 25.5"
                value={openingQty}
                onChange={e => setOpeningQty(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl font-semibold border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Quantity available right now
              </span>
            </div>

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
                <option value="Kg">Kilogram (Kg / किलो)</option>
                <option value="Gram">Gram (g / ग्राम)</option>
                <option value="Packet">Packet (पैकेट)</option>
                <option value="Liter">Liter (L / लीटर)</option>
                <option value="Box">Box (डिब्बा / पेटी)</option>
                <option value="Meter">Meter (मीटर)</option>
                <option value="Other">Other</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-0.5 block">How you sell this item</span>
            </div>
          </div>

          {/* 4. Collapsible Optional Details (SKU, Minimum Alert, Notes) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Optional Details (Item Code, Low Stock Alert, Notes)</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-3 pb-1">
                <div className="grid grid-cols-2 gap-3">
                  {/* Item Code / SKU */}
                  <div>
                    <label className="block font-semibold text-slate-700 text-xs mb-1">
                      Item Code / Barcode
                    </label>
                    <input
                      id="product-sku-input"
                      type="text"
                      placeholder="Auto-created if blank"
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Low Stock Alert */}
                  <div>
                    <label className="block font-semibold text-slate-700 text-xs mb-1">
                      Low Stock Warning At
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="5"
                      value={minimumStock}
                      onChange={e => setMinimumStock(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Supplier / Notes */}
                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1">
                    Supplier / Vendor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Local Wholesale Depot"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Notes / Description */}
                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1">
                    Item Description / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500g pouch, fresh stock"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-product-btn"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/25 text-sm flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Add Item to Shop (सामान जोड़ें)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
