import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  Receipt,
  RotateCcw,
  IndianRupee,
  User,
  Phone,
  MapPin,
  Plus,
  Minus,
  PackagePlus,
  Printer,
  Check,
  X,
  AlertCircle,
  Tag,
  CreditCard,
  QrCode,
  Banknote,
  FileText,
  Clock,
  Languages,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Product, Sale, Category } from '../types';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

interface SellViewProps {
  products: Product[];
  categories?: Category[];
  initialProductId?: string;
  onSaleCompleted: (sale: Sale) => void;
  onOpenReceipt: (sale: Sale) => void;
  onNavigateToAddProduct?: () => void;
}

export const SellView: React.FC<SellViewProps> = ({
  products,
  categories = [],
  initialProductId,
  onSaleCompleted,
  onOpenReceipt,
  onNavigateToAddProduct,
}) => {
  const { isHindi, toggleLanguage, autoTranslate } = useLanguage();

  const activeProducts = useMemo(
    () => (products || []).filter(p => p && p.status === 'ACTIVE'),
    [products]
  );

  // Extract category names
  const categoryList = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => set.add(c.name));
    activeProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [categories, activeProducts]);

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [productId, setProductId] = useState<string>(() => {
    if (initialProductId && activeProducts.some(p => p.id === initialProductId)) {
      return initialProductId;
    }
    return activeProducts[0]?.id || '';
  });

  const [quantity, setQuantity] = useState<string>('1');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  // Customer address is now strictly mandatory with no "Shop Counter Pickup" default
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('');

  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);

  // Live IST Clock string for POS terminal
  const [liveTime, setLiveTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now);
        setLiveTime(formatted);
      } catch (e) {
        // fallback
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return activeProducts;
    return activeProducts.filter(p => p.category === selectedCategory);
  }, [activeProducts, selectedCategory]);

  // Selected product object
  const selectedProduct = useMemo(
    () => activeProducts.find(p => p.id === productId),
    [activeProducts, productId]
  );

  // Sync selected product
  useEffect(() => {
    if ((!productId || !activeProducts.some(p => p.id === productId)) && activeProducts.length > 0) {
      setProductId(activeProducts[0].id);
    }
  }, [activeProducts, productId]);

  useEffect(() => {
    if (initialProductId) {
      const prod = activeProducts.find(p => p.id === initialProductId);
      if (prod) {
        setProductId(prod.id);
        if (prod.category) setSelectedCategory(prod.category);
      }
    }
  }, [initialProductId, activeProducts]);

  // When selected product changes, sync its price
  useEffect(() => {
    if (selectedProduct) {
      setSellingPrice(String(selectedProduct.selling_price || '0'));
    }
  }, [selectedProduct?.id]);

  const qtyNum = parseFloat(quantity) || 0;
  const priceNum = parseFloat(sellingPrice) || 0;
  const totalAmount = Number((qtyNum * priceNum).toFixed(2));
  const currentStock = Number(selectedProduct?.current_quantity ?? 0);
  const remainingStock = currentStock - qtyNum;

  const handleQuickQty = (delta: number) => {
    const next = Math.max(1, Math.round(qtyNum + delta));
    setQuantity(String(next));
  };

  // Celebration animation & pleasant POS chime
  const playCelebrationAnimation = () => {
    // 1. Confetti cannon blast
    try {
      // Center explosion
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
      });

      // Left blast
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0.05, y: 0.65 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      }, 120);

      // Right blast
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 0.95, y: 0.65 },
          colors: ['#10b981', '#3b82f6', '#ec4899'],
        });
      }, 240);
    } catch (e) {
      // Ignore if canvas confetti fails
    }

    // 2. Synthesized audio chime (Web Audio API)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.07 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.07);
          osc.stop(ctx.currentTime + idx * 0.07 + 0.3);
        });
      }
    } catch (e) {
      // Audio autoplay might be restricted
    }
  };

  const handleProcessSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProduct) {
      setError(isHindi ? 'बिक्री के लिए कोई सामान चुनें।' : 'Select an item to sell.');
      return;
    }

    if (currentStock <= 0) {
      setError(
        isHindi
          ? `"${autoTranslate(selectedProduct.name)}" का स्टॉक समाप्त हो चुका है।`
          : `"${selectedProduct.name}" is out of stock.`
      );
      return;
    }

    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError(isHindi ? 'कृपया 0 से अधिक मान्य मात्रा दर्ज करें।' : 'Enter a valid quantity greater than 0.');
      return;
    }

    if (qtyNum > currentStock) {
      setError(
        isHindi
          ? `मात्रा स्टॉक से अधिक है (केवल ${currentStock} ${autoTranslate(selectedProduct.unit)} उपलब्ध है)।`
          : `Quantity exceeds stock (${currentStock} ${selectedProduct.unit} available).`
      );
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      setError(isHindi ? 'कृपया मान्य बिक्री दर दर्ज करें।' : 'Enter a valid selling rate.');
      return;
    }

    // Customer Name Validation
    const nameToUse = customerName.trim();
    if (!nameToUse) {
      setError(isHindi ? 'ग्राहक का नाम दर्ज करना अनिवार्य है।' : 'Customer name is mandatory.');
      return;
    }

    // Customer Address Validation - MANDATORY as requested
    const addressToUse = customerAddress.trim();
    if (!addressToUse) {
      setError(
        isHindi
          ? 'ग्राहक का पता / डिलीवरी स्थान दर्ज करना अनिवार्य है।'
          : 'Customer address / delivery location is mandatory.'
      );
      addressInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const sale = await api.createSale({
        productId,
        quantity: qtyNum,
        unit: selectedProduct.unit,
        sellingPrice: priceNum,
        customerName: nameToUse,
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: addressToUse,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      setCompletedSale(sale);
      setShowDoneModal(true);
      onSaleCompleted(sale);

      // Trigger celebration animation
      playCelebrationAnimation();

      // Reset form fields
      setQuantity('1');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || (isHindi ? 'बिक्री पूरी करने में त्रुटि आई।' : 'Failed to complete sale.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setQuantity('1');
    setNotes('');
    setError(null);
  };

  if (activeProducts.length === 0) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            {isHindi ? 'बिक्री के लिए कोई सामान उपलब्ध नहीं है' : 'No Items Available for Sale'}
          </h2>
          <p className="text-xs text-slate-500">
            {isHindi
              ? 'आपकी दुकान में कोई सक्रिय सामान नहीं है। कृपया पहले नया सामान जोड़ें।'
              : 'Your product catalog has no active items. Please add items to begin generating invoices.'}
          </p>
          <div className="pt-1">
            <button
              onClick={() => onNavigateToAddProduct && onNavigateToAddProduct()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>{isHindi ? 'पहला सामान जोड़ें' : 'Add First Product'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-2.5">
      {/* COMPACT POS TERMINAL TOP BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Receipt className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {isHindi ? 'पीओएस बिलिंग काउंटर' : 'POS Billing Counter'}
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isHindi ? 'चालू' : 'Live'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Toggle Hindi / English"
          >
            <Languages className="w-3 h-3 text-amber-600" />
            <span>{isHindi ? 'English' : 'हिन्दी'}</span>
          </button>

          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1 text-slate-500 font-mono text-[11px] bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{liveTime || 'IST Active'}</span>
          </div>

          {completedSale && (
            <button
              onClick={() => onOpenReceipt(completedSale)}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Printer className="w-3 h-3 text-emerald-700" />
              <span>#{completedSale.transaction_number}</span>
            </button>
          )}
        </div>
      </div>

      {/* POST-SALE CELEBRATION MODAL WITH SPRING ANIMATION */}
      <AnimatePresence>
        {showDoneModal && completedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDoneModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.75, opacity: 0, y: 20 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                transition: { type: 'spring', damping: 22, stiffness: 280 },
              }}
              exit={{ scale: 0.85, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 z-10 text-center overflow-hidden"
            >
              {/* Confetti celebration badge background */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-100 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-100 rounded-full blur-xl pointer-events-none" />

              <button
                onClick={() => setShowDoneModal(false)}
                className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Animated Success Ring */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/25 relative"
              >
                <Check className="w-8 h-8 stroke-[3]" />
                <motion.span
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  className="absolute inset-0 rounded-2xl border-2 border-emerald-400"
                />
              </motion.div>

              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{isHindi ? 'बिक्री सफलतापूर्वक संपन्न!' : 'Sale Completed!'}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900">
                {isHindi ? 'पक्का बिल तैयार हुआ' : 'Invoice Generated'}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                #{completedSale.transaction_number}
              </p>

              {/* Compact Bill Summary Card */}
              <div className="my-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-left text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">{isHindi ? 'ग्राहक:' : 'Customer:'}</span>
                  <span className="font-semibold text-slate-900">{autoTranslate(completedSale.customer_name)}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 text-[11px]">{isHindi ? 'डिलीवरी पता:' : 'Address:'}</span>
                  <span className="font-medium text-slate-800 text-right truncate max-w-[180px]" title={completedSale.customer_address || ''}>
                    {autoTranslate(completedSale.customer_address)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 text-[11px]">{isHindi ? 'कुल राशि:' : 'Amount Paid:'}</span>
                  <span className="font-extrabold text-emerald-600 font-mono text-sm">
                    ₹{Number(completedSale.total_amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">{isHindi ? 'भुगतान माध्यम:' : 'Mode:'}</span>
                  <span className="font-medium text-slate-700">{autoTranslate(completedSale.payment_method)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowDoneModal(false);
                    onOpenReceipt(completedSale);
                  }}
                  className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'बिल प्रिंट करें' : 'Print Receipt'}</span>
                </button>

                <button
                  onClick={() => setShowDoneModal(false)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isHindi ? 'अगला बिल' : 'Next Bill'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POS WORKSTATION FORM: COMPACT 2-COLUMN LAYOUT */}
      <form id="sell-form" onSubmit={handleProcessSale}>
        {error && (
          <div className="mb-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
          {/* LEFT COLUMN: COMPACT BILLING DETAILS (7 COLS) */}
          <div className="lg:col-span-7 space-y-2.5">
            {/* Card 1: Customer Info with Mandatory Address */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isHindi ? 'ग्राहक एवं डिलीवरी विवरण' : 'Customer & Delivery Info'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerName(isHindi ? 'दुकान ग्राहक' : 'Walk-in Customer');
                    addressInputRef.current?.focus();
                  }}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200/60 cursor-pointer"
                >
                  {isHindi ? '+ दुकान ग्राहक' : '+ Quick Walk-in'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                {/* Customer Name */}
                <div className="sm:col-span-7">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    {isHindi ? 'ग्राहक का नाम *' : 'Customer Name *'}
                  </label>
                  <input
                    id="sell-customer-name-input"
                    type="text"
                    required
                    placeholder={isHindi ? 'ग्राहक का नाम लिखें...' : 'Enter customer name...'}
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden text-slate-900 text-xs"
                  />
                </div>

                {/* Phone */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    {isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}{' '}
                    <span className="text-slate-400 font-normal">({isHindi ? 'वैकल्पिक' : 'optional'})</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      id="sell-customer-phone-input"
                      type="tel"
                      placeholder="+91..."
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden text-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* MANDATORY CUSTOMER ADDRESS / DELIVERY LOCATION */}
                <div className="sm:col-span-12">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>{isHindi ? 'डिलीवरी / ग्राहक का पता *' : 'Delivery / Customer Address *'}</span>
                      <span className="text-[10px] text-rose-600 bg-rose-50 px-1 rounded border border-rose-200 font-semibold">
                        {isHindi ? 'अनिवार्य' : 'Mandatory'}
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {isHindi ? 'पता लिखना जरूरी है' : 'Address is required'}
                    </span>
                  </div>
                  <input
                    ref={addressInputRef}
                    id="sell-customer-address-input"
                    type="text"
                    required
                    placeholder={
                      isHindi
                        ? 'मकान / दुकान नं, गली, इलाका, डिलीवरी का पता लिखें...'
                        : 'Enter house/shop no, street, area, delivery address...'
                    }
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden text-slate-900 text-xs"
                  />

                  {/* Fast address location presets to help shopkeeper */}
                  <div className="flex flex-wrap items-center gap-1 pt-1.5 text-[10px]">
                    <span className="text-slate-400">{isHindi ? 'त्वरित पता:' : 'Quick tags:'}</span>
                    {[
                      { label: isHindi ? 'काउंटर पर सुपुर्दगी' : 'Counter Delivery', val: isHindi ? 'काउंटर पर सुपुर्दगी' : 'Counter Delivery' },
                      { label: isHindi ? 'स्थानीय बाजार' : 'Local Market', val: isHindi ? 'स्थानीय बाजार' : 'Local Market' },
                      { label: isHindi ? 'होम डिलीवरी' : 'Home Delivery', val: isHindi ? 'होम डिलीवरी' : 'Home Delivery' },
                      { label: isHindi ? 'साइट डिलीवरी' : 'Site Delivery', val: isHindi ? 'साइट डिलीवरी' : 'Site Delivery' },
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setCustomerAddress(preset.val)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Item Selection, Quantity & Payment Mode */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
              {/* Category Filter Pills (Compact) */}
              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span>{isHindi ? 'श्रेणी फ़िल्टर' : 'Filter by Category'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {filteredProducts.length} {isHindi ? 'सामान' : 'items'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('ALL');
                      if (activeProducts.length > 0) setProductId(activeProducts[0].id);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedCategory === 'ALL'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isHindi ? `सभी (${activeProducts.length})` : `All (${activeProducts.length})`}
                  </button>
                  {categoryList.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        const first = activeProducts.find(p => p.category === cat);
                        if (first) setProductId(first.id);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {autoTranslate(cat)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3 text-slate-500" />
                    <span>{isHindi ? 'सामान चुनें *' : 'Select Product *'}</span>
                  </label>
                  {selectedProduct && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        currentStock <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : currentStock <= (selectedProduct.minimum_stock ?? 0)
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isHindi
                        ? `स्टॉक: ${currentStock} ${autoTranslate(selectedProduct.unit)}`
                        : `Stock: ${currentStock} ${selectedProduct.unit}`}
                    </span>
                  )}
                </div>

                <select
                  id="sell-product-select"
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:border-blue-500 focus:outline-hidden text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  {filteredProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {autoTranslate(p.name)} [{autoTranslate(p.category || 'General')}] — ₹{p.selling_price}/{autoTranslate(p.unit)} ({p?.current_quantity ?? 0} {isHindi ? 'स्टॉक' : 'in stock'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity, Rate & Quick Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end pt-1">
                {/* Quantity */}
                <div className="sm:col-span-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      {isHindi ? 'मात्रा' : 'Qty'} ({autoTranslate(selectedProduct?.unit || 'Unit')}) *
                    </label>
                    <div className="flex items-center gap-1 text-[10px]">
                      {[1, 5, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setQuantity(String(n))}
                          className="text-slate-500 hover:text-slate-900 px-1 py-0.2 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer font-medium"
                        >
                          +{n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickQty(-1)}
                      className="w-7 h-7 rounded-md border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                      title="Decrease by 1"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      id="sell-quantity-input"
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="1"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      required
                      className="flex-1 py-1 px-2 border border-slate-200 rounded-md text-center font-bold text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuickQty(1)}
                      className="w-7 h-7 rounded-md border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                      title="Increase by 1"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Selling Rate */}
                <div className="sm:col-span-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      {isHindi ? 'दर / मूल्य (₹) *' : 'Rate / Price (₹) *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setSellingPrice(String(selectedProduct?.selling_price || '0'))}
                      className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                    >
                      {isHindi ? 'डिफ़ॉल्ट दर' : 'Reset'}
                    </button>
                  </div>
                  <div className="relative">
                    <IndianRupee className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      id="sell-price-input"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={sellingPrice}
                      onChange={e => setSellingPrice(e.target.value)}
                      required
                      className="w-full pl-6 pr-2 py-1 border border-slate-200 rounded-md font-bold text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Compact Payment Method Selector */}
                <div className="sm:col-span-12 pt-1">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isHindi ? 'भुगतान माध्यम (Payment Mode)' : 'Payment Method'}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'Cash', label: isHindi ? 'नकद' : 'Cash', icon: Banknote },
                      { id: 'UPI', label: isHindi ? 'यूपीआई' : 'UPI', icon: QrCode },
                      { id: 'Card', label: isHindi ? 'कार्ड' : 'Card', icon: CreditCard },
                      { id: 'Credit', label: isHindi ? 'उधार' : 'Credit', icon: FileText },
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isSelected = paymentMethod === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPaymentMethod(tab.id)}
                          className={`py-1 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: COMPACT LIVE BILL SLIP & CHECKOUT (5 COLS) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
              {/* Slip Header */}
              <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-xs uppercase tracking-wide">
                    {isHindi ? 'कच्चा बिल (ड्राफ्ट पर्ची)' : 'Draft Invoice Ticket'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
                  {isHindi ? 'लाइव' : 'Ready'}
                </span>
              </div>

              {/* Receipt Body */}
              <div className="p-3 space-y-2 text-xs">
                {/* Customer Snapshot */}
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">{isHindi ? 'ग्राहक:' : 'Customer:'}</span>
                    <strong className="text-slate-900 font-semibold truncate max-w-[150px]">
                      {autoTranslate(customerName.trim() || (isHindi ? 'नाम दर्ज करें' : 'Enter Name'))}
                    </strong>
                  </div>
                  <div className="flex justify-between items-start text-[11px]">
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                      <span>{isHindi ? 'पता:' : 'Address:'}</span>
                    </span>
                    <span
                      className={`truncate max-w-[150px] font-medium ${
                        customerAddress.trim() ? 'text-slate-800' : 'text-rose-500 italic'
                      }`}
                    >
                      {customerAddress.trim() ? autoTranslate(customerAddress.trim()) : (isHindi ? '* पता अनिवार्य है' : '* Address required')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">{isHindi ? 'भुगतान:' : 'Payment:'}</span>
                    <span className="font-semibold text-slate-800">{autoTranslate(paymentMethod)}</span>
                  </div>
                </div>

                {/* Line Item Breakdown */}
                {selectedProduct && (
                  <div className="space-y-1">
                    <div className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 space-y-0.5">
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {autoTranslate(selectedProduct.name)}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {qtyNum} {autoTranslate(selectedProduct.unit)} × ₹{priceNum.toFixed(2)}
                        </span>
                        <span className="font-bold font-mono text-slate-900">
                          ₹{totalAmount.toFixed(2)}
                        </span>
                      </div>
                      {remainingStock < 0 ? (
                        <div className="text-[10px] text-rose-600 font-bold pt-0.5">
                          ⚠️ {isHindi ? `कमी: स्टॉक से ${Math.abs(remainingStock)} ${autoTranslate(selectedProduct.unit)} अधिक` : `Shortage: Exceeds by ${Math.abs(remainingStock)}`}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 pt-0.5">
                          {isHindi ? 'स्टॉक बचेगा:' : 'Stock left:'} {remainingStock} {autoTranslate(selectedProduct.unit)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Totals */}
                <div className="pt-1.5 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>{isHindi ? 'उप-योग (Subtotal):' : 'Subtotal:'}</span>
                    <span className="font-mono text-slate-800">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>{isHindi ? 'जीएसटी (GST):' : 'GST Tax:'}</span>
                    <span className="text-slate-500">{isHindi ? 'मूल्य में शामिल' : 'Inclusive'}</span>
                  </div>

                  {/* Grand Total Box */}
                  <div className="pt-1.5 mt-0.5 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      {isHindi ? 'कुल देय राशि:' : 'Total Payable:'}
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-600">
                      ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-1 space-y-1.5">
                  <button
                    type="submit"
                    id="submit-sale-btn"
                    disabled={isLoading || currentStock <= 0 || qtyNum <= 0}
                    className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                      currentStock <= 0 || qtyNum <= 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-98'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isLoading
                        ? (isHindi ? 'बिल दर्ज हो रहा है...' : 'Processing...')
                        : (isHindi ? `बिल बनाएं और प्रिंट करें (₹${totalAmount.toFixed(2)})` : `Complete & Print (₹${totalAmount.toFixed(2)})`)}
                    </span>
                  </button>

                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
                    >
                      {isHindi ? 'साफ करें' : 'Clear form'}
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {isHindi ? 'बहीखाते में स्वतः दर्ज' : 'Auto-saves to Ledger'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
