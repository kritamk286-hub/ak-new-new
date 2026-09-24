import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Product } from '../types';
import { api } from '../api';

interface StockAdjustModalProps {
  products: Product[];
  selectedProductId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  products,
  selectedProductId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [productId, setProductId] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'INCREASE' | 'DECREASE'>('DECREASE');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('Damaged goods');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (selectedProductId) {
      setProductId(selectedProductId);
    } else if (products.length > 0 && !productId) {
      setProductId(products[0].id);
    }
  }, [selectedProductId, products]);

  if (!isOpen) return null;

  const currentProduct = products.find(p => p.id === productId);
  const currentStock = Number(currentProduct?.current_quantity || 0);
  const qtyNum = parseFloat(quantity) || 0;
  const projectedStock = adjustmentType === 'INCREASE' ? currentStock + qtyNum : currentStock - qtyNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Please enter a valid positive quantity.');
      return;
    }

    if (adjustmentType === 'DECREASE' && currentStock < qtyNum) {
      setError(`Cannot decrease by ${qtyNum} ${currentProduct?.unit}. Current stock is only ${currentStock} ${currentProduct?.unit}.`);
      return;
    }

    if (!reason.trim()) {
      setError('Adjustment reason is required for audit trail.');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.adjustStock({
        productId,
        adjustmentType,
        quantity: qtyNum,
        reason,
        notes: notes || undefined,
      });

      setQuantity('');
      setNotes('');
      setShowConfirm(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
      setShowConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-slate-100">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Stock Audit Adjustment</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showConfirm ? (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
              <h4 className="font-bold text-base mb-1">Confirm Stock Adjustment?</h4>
              <p className="text-sm">
                Product: <strong className="font-extrabold">{currentProduct?.name}</strong>
              </p>
              <div className="mt-3 pt-3 border-t border-amber-200/60 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span>Adjustment Type:</span>
                  <span className={`font-bold ${adjustmentType === 'INCREASE' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {adjustmentType === 'INCREASE' ? `+${qtyNum} ${currentProduct?.unit} (Increase)` : `-${qtyNum} ${currentProduct?.unit} (Decrease)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reason:</span>
                  <span className="font-semibold text-slate-900">{reason}</span>
                </div>
                <div className="flex justify-between">
                  <span>Previous Stock:</span>
                  <span>{currentStock} {currentProduct?.unit}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-amber-200 text-slate-900">
                  <span>New Stock:</span>
                  <span className={projectedStock <= 0 ? 'text-rose-600' : 'text-emerald-700'}>
                    {projectedStock.toFixed(3)} {currentProduct?.unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                id="confirm-adjust-stock-btn"
                onClick={handleConfirmSave}
                disabled={isLoading}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs shadow-amber-600/30"
              >
                {isLoading ? 'Processing...' : 'Confirm & Save to Audit'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Product */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Product *</label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Available: {p.current_quantity} {p.unit}
                  </option>
                ))}
              </select>
              {currentProduct && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Current In-Hand Stock: <strong>{currentProduct.current_quantity} {currentProduct.unit}</strong>
                </p>
              )}
            </div>

            {/* Adjustment Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Type *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('DECREASE')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    adjustmentType === 'DECREASE'
                      ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-400/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  <span>Decrease (-)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('INCREASE')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    adjustmentType === 'INCREASE'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-2 ring-emerald-400/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span>Increase (+)</span>
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adjustment Quantity ({currentProduct?.unit || 'Units'}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                placeholder="e.g. 5 or 2.5"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Adjustment *</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="Damaged goods">Damaged goods / Spillage</option>
                <option value="Physical count discrepancy">Physical count discrepancy</option>
                <option value="Expired inventory">Expired / Unfit for sale</option>
                <option value="Return to supplier">Return to supplier</option>
                <option value="Internal usage / Sampling">Internal usage / Sampling</option>
                <option value="Found untracked inventory">Found untracked inventory</option>
                <option value="Other">Other (Specify in notes)</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Audit Notes / Explanation</label>
              <textarea
                rows={2}
                placeholder="Details of audit or incident..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-stock-adjust-btn"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs shadow-amber-600/30"
              >
                Review Adjustment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
