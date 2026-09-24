import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { api } from '../api';

interface DeleteProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: (deletedProductId: string) => void;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.deleteProduct(product.id);
      onSuccess(product.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete product.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-700 flex items-center justify-center text-white">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Delete Product (सामान हटाएं)</h3>
              <p className="text-[11px] text-rose-100">Permanent item removal from store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-100 hover:text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Are you sure you want to delete this product?</p>
              <p className="text-slate-600 mt-1">
                This item will be removed from your catalog and will no longer be available for new sales. Past transaction history and receipts will remain intact.
              </p>
            </div>
          </div>

          {/* Product details card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="font-black text-slate-900 text-base">{product.name}</div>
            <div className="text-xs text-slate-500 font-mono">Code / SKU: {product.sku}</div>
            <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
              <span>Current Stock:</span>
              <span className="font-bold text-slate-900">
                {product.current_quantity} {product.unit}
              </span>
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Selling Price:</span>
              <span className="font-bold text-emerald-700">₹{Number(product.selling_price || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Deleting...</span>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Delete Product (हाँ, हटाएं)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
