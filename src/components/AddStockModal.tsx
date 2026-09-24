import React, { useState, useEffect } from 'react';
import { X, PlusCircle, AlertCircle, Check } from 'lucide-react';
import { Product } from '../types';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

interface AddStockModalProps {
  products: Product[];
  selectedProductId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  products,
  selectedProductId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isHindi, autoTranslate } = useLanguage();
  const [productId, setProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid positive quantity.');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.addStock({
        productId,
        quantityAdded: parseFloat(quantity),
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        supplier: supplier || undefined,
        notes: notes || undefined,
      });

      // Reset
      setQuantity('');
      setPurchasePrice('');
      setNotes('');
      setShowConfirm(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add stock');
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
            <PlusCircle className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">
              {isHindi ? 'स्टॉक आवक जोड़ें (Add Stock)' : 'Add Stock (Inward Purchase)'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showConfirm ? (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
              <h4 className="font-bold text-base mb-1">
                {isHindi ? 'स्टॉक जोड़ने की पुष्टि करें' : 'Confirm Stock Addition'}
              </h4>
              <p className="text-sm">
                {isHindi ? 'क्या आप ' : 'Confirm adding '}
                <strong className="font-extrabold">{quantity} {autoTranslate(currentProduct?.unit)}</strong>{' '}
                {isHindi ? 'को ' : 'to '}
                <strong className="font-extrabold">{autoTranslate(currentProduct?.name)}</strong>{' '}
                {isHindi ? 'में जोड़ना चाहते हैं?' : '?'}
              </p>
              <div className="mt-3 pt-3 border-t border-blue-200/60 text-xs text-blue-800 space-y-1">
                <div>
                  {isHindi ? 'वर्तमान पुराना स्टॉक:' : 'Previous Stock:'}{' '}
                  {currentProduct?.current_quantity} {autoTranslate(currentProduct?.unit)}
                </div>
                <div>
                  {isHindi ? 'नया कुल स्टॉक:' : 'New Projected Stock:'}{' '}
                  <span className="font-bold text-emerald-700">
                    {(Number(currentProduct?.current_quantity || 0) + parseFloat(quantity)).toFixed(3)}{' '}
                    {autoTranslate(currentProduct?.unit)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isHindi ? 'वापस जाएं' : 'Go Back'}
              </button>
              <button
                type="button"
                id="confirm-add-stock-btn"
                onClick={handleConfirmSave}
                disabled={isLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-xs shadow-blue-600/30 cursor-pointer"
              >
                {isLoading
                  ? (isHindi ? 'सहेज रहे हैं...' : 'Saving...')
                  : (isHindi ? 'हाँ, पक्का करें व स्टॉक जोड़ें' : 'Yes, Confirm & Add Stock')}
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

            {/* Product Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isHindi ? 'सामान चुनें (Select Product) *' : 'Select Product *'}
              </label>
              <select
                id="add-stock-product-select"
                value={productId}
                onChange={e => setProductId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {autoTranslate(p.name)} ({p.sku}) — {isHindi ? 'उपलब्ध:' : 'Available:'}{' '}
                    {p.current_quantity} {autoTranslate(p.unit)}
                  </option>
                ))}
              </select>
              {currentProduct && (
                <p className="text-[11px] text-slate-500 mt-1">
                  {isHindi ? 'वर्तमान स्टॉक:' : 'Current Stock:'}{' '}
                  <strong className="text-slate-800">
                    {currentProduct.current_quantity ?? 0} {autoTranslate(currentProduct.unit)}
                  </strong>{' '}
                  • {isHindi ? 'इकाई:' : 'Unit:'} {autoTranslate(currentProduct.unit)}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isHindi
                  ? `जोड़ी गई मात्रा (${autoTranslate(currentProduct?.unit) || 'इकाई'}) *`
                  : `Quantity Added (${currentProduct?.unit || 'Units'}) *`}
              </label>
              <input
                id="add-stock-quantity-input"
                type="number"
                step="any"
                min="0.001"
                placeholder="e.g. 25 or 5.5"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">
                {isHindi
                  ? 'दशमलव मात्रा समर्थित है (उदा. 10 किग्रा, 5.5 किग्रा, 2.250 किग्रा)'
                  : 'Supports decimal quantities (e.g. 10 kg, 5.5 kg, 2.250 kg)'}
              </span>
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isHindi
                  ? `प्रति ${autoTranslate(currentProduct?.unit) || 'इकाई'} खरीद मूल्य (₹ ऐच्छिक)`
                  : `Purchase Price per ${currentProduct?.unit || 'Unit'} (₹ Optional)`}
              </label>
              <input
                id="add-stock-price-input"
                type="number"
                step="any"
                min="0"
                placeholder={currentProduct?.purchase_price ? `Default: ₹${currentProduct.purchase_price}` : '₹ 0.00'}
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isHindi ? 'आपूर्तिकर्ता / व्यापारी का नाम (ऐच्छिक)' : 'Supplier Name (Optional)'}
              </label>
              <input
                type="text"
                placeholder={isHindi ? 'उदा. मेट्रो डिस्ट्रीब्यूटर्स / होलसेल एजेंसी' : 'e.g. Metro Distributors'}
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isHindi ? 'विवरण / आवक बिल नंबर (ऐच्छिक)' : 'Notes / Inward Bill No. (Optional)'}
              </label>
              <input
                type="text"
                placeholder={isHindi ? 'उदा. चालान / बिल #PO-99182' : 'e.g. Invoice #PO-99182'}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                id="submit-add-stock-btn"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs shadow-blue-600/30 cursor-pointer"
              >
                {isHindi ? 'आगे बढ़ें (समीक्षा करें)' : 'Continue to Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
