import React, { useState } from 'react';
import { Printer, X, CheckCircle2, MapPin, Phone, ShieldCheck, CreditCard, Languages } from 'lucide-react';
import { Sale } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { translateToHindi, convertAmountToHindiWords } from '../utils/hindiTranslator';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
  shopSettings?: any;
}

function convertAmountToEnglishWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let output = '';
  const crore = Math.floor(integerPart / 10000000);
  let rem = integerPart % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundred = Math.floor(rem / 100);
  const rest = rem % 100;

  if (crore > 0) output += inWords(crore) + 'Crore ';
  if (lakh > 0) output += inWords(lakh) + 'Lakh ';
  if (thousand > 0) output += inWords(thousand) + 'Thousand ';
  if (hundred > 0) output += inWords(hundred) + 'Hundred ';
  if (rest > 0) output += inWords(rest);

  output = output.trim();
  if (!output) output = 'Zero';

  let result = 'Rupees ' + output;
  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart).trim() + ' Paise';
  }
  return result + ' Only';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose, shopSettings }) => {
  const { isHindi: globalIsHindi } = useLanguage();
  // Allow per-bill language toggle, initialized from global setting
  const [billLang, setBillLang] = useState<'hi' | 'en'>(globalIsHindi ? 'hi' : 'en');
  const isHindi = billLang === 'hi';

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  // Helper to translate in the bill's selected language
  const tr = (text: string | null | undefined): string => {
    if (!text) return '';
    if (!isHindi) return text;
    return translateToHindi(text);
  };

  // Parse IST Date and Time
  let dateFormatted = sale.created_at;
  let timeFormatted = '';
  try {
    const d = new Date(sale.created_at);
    dateFormatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
    timeFormatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch (e) {
    // fallback
  }

  const items =
    sale.items && sale.items.length > 0
      ? sale.items
      : [
          {
            id: '1',
            sale_id: sale.id,
            product_id: sale.product_id || 'p1',
            product_name: sale.product_name || 'Item',
            product_sku: sale.product_sku || '',
            category: sale.category || sale.product_category || 'General',
            quantity: sale.quantity || 1,
            unit: sale.unit || 'unit',
            selling_price: sale.selling_price || sale.total_amount,
            total_amount: sale.total_amount,
            created_at: sale.created_at,
            updated_at: sale.updated_at,
          },
        ];

  const totalItemsCount = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  const totalAmountNum = Number(sale.total_amount) || 0;

  // Amount in words
  const amountInWords = isHindi
    ? convertAmountToHindiWords(totalAmountNum)
    : convertAmountToEnglishWords(totalAmountNum);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] border border-slate-200">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">
                  {isHindi ? 'अधिकृत कर चालान (टैक्स इनवॉइस)' : 'Official Tax Invoice'}
                </span>
                <span className="font-mono text-[11px] text-slate-400">#{sale.transaction_number}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isHindi ? 'प्रिंट या पीडीएफ सुरक्षित करने के लिए तैयार' : 'Ready for high-resolution print or PDF save'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bill Language Toggle */}
            <button
              onClick={() => setBillLang(isHindi ? 'en' : 'hi')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="बिल की भाषा बदलें (Toggle Bill Language)"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? 'English Bill' : 'हिन्दी बिल'}</span>
            </button>

            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isHindi ? 'बिल प्रिंट करें' : 'Print Bill'}</span>
            </button>
            <button
              id="close-receipt-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div
          id="printable-receipt"
          className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white font-sans text-slate-900 text-xs selection:bg-slate-100"
        >
          {/* Header Grid: Brand & Invoice Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b-2 border-slate-900 gap-4">
            {/* Store Information */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-black text-xs tracking-wider">
                  AK
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {isHindi ? tr(shopSettings?.shop_name || 'AK ENTERPRISES') : (shopSettings?.shop_name || 'AK ENTERPRISES')}
                </h1>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {isHindi ? tr(shopSettings?.address || 'Main Road, Commercial Complex') : (shopSettings?.address || 'Main Road, Commercial Complex')}
              </p>
              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2.5">
                <span>{isHindi ? 'फोन:' : 'Phone:'} <strong className="text-slate-800">{shopSettings?.phone || '+91 98765 43210'}</strong></span>
                {shopSettings?.gst_number && (
                  <span>· GSTIN: <strong className="font-mono text-slate-800">{shopSettings.gst_number}</strong></span>
                )}
              </div>
            </div>

            {/* Invoice Tag & Metadata */}
            <div className="sm:text-right space-y-1">
              <div className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded">
                {isHindi ? 'कर चालान / रोकड़ पर्ची' : 'TAX INVOICE / CASH MEMO'}
              </div>
              <div className="font-mono font-bold text-sm text-slate-900">
                #{sale.transaction_number}
              </div>
              <div className="text-[11px] text-slate-500">
                {isHindi ? 'दिनांक:' : 'Date:'} <strong className="text-slate-800 font-medium">{dateFormatted}</strong>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {isHindi ? 'समय:' : 'Time:'} {timeFormatted} (IST)
              </div>
            </div>
          </div>

          {/* Billed To & Payment Details */}
          <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isHindi ? 'बिल प्राप्तकर्ता (ग्राहक का विवरण)' : 'Billed To (Customer Details)'}
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {tr(sale.customer_name) || (isHindi ? 'दुकान पर आया ग्राहक' : 'Walk-in Customer')}
              </div>
              {sale.customer_phone && (
                <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{sale.customer_phone}</span>
                </div>
              )}
              <div className="text-[11px] text-slate-600 flex items-start gap-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-slate-700 font-medium">
                  {tr(sale.customer_address) || (isHindi ? 'दुकान' : 'Store')}
                </span>
              </div>
            </div>

            <div className="sm:border-l sm:border-slate-200 sm:pl-3.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isHindi ? 'भुगतान विवरण' : 'Payment Details'}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {isHindi ? 'भुगतान प्रकार: ' : 'Payment Mode: '}
                    <strong className="text-slate-900">{tr(sale.payment_method) || 'Cash'}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {isHindi ? 'स्थिति:' : 'Status:'}{' '}
                  <span className="font-bold text-emerald-700">
                    {isHindi ? 'पूर्ण भुगतान प्राप्त (PAID)' : 'PAID & SETTLED'}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 mt-2 flex items-center justify-between">
                <span>{isHindi ? 'काउंटर ID:' : 'Authorized Counter:'} #{sale.id.slice(0, 8)}</span>
                <span>{isHindi ? 'कैशियर:' : 'User:'} {sale.created_by || 'Admin'}</span>
              </div>
            </div>
          </div>

          {/* Itemized Invoice Ledger */}
          <div className="border border-slate-200 rounded-lg overflow-hidden my-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <th className="py-2 px-3 w-8">#</th>
                  <th className="py-2 px-3">{isHindi ? 'सामान का विवरण (Description)' : 'Item Description'}</th>
                  <th className="py-2 px-3 text-center">{isHindi ? 'श्रेणी' : 'Category'}</th>
                  <th className="py-2 px-3 text-center w-20">{isHindi ? 'मात्रा' : 'Qty'}</th>
                  <th className="py-2 px-3 text-right w-24">{isHindi ? 'दर (₹)' : 'Rate (₹)'}</th>
                  <th className="py-2 px-3 text-right w-28">{isHindi ? 'कुल राशि (₹)' : 'Amount (₹)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{tr(it.product_name)}</div>
                      {it.product_sku && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {isHindi ? 'कोड: ' : 'Code: '}{it.product_sku}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                      {tr(it.category || it.product_category || 'General')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-900 whitespace-nowrap">
                      {it.quantity} <span className="text-[11px] text-slate-500 font-normal">{tr(it.unit)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                      ₹{Number(it.selling_price).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900 whitespace-nowrap">
                      ₹{Number(it.total_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount In Words & Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-2 border-b border-slate-200">
            <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isHindi ? 'अक्षरों में कुल राशि (Amount in words)' : 'Amount Chargeable (in words)'}
                </span>
                <p className="font-bold text-slate-800 text-xs italic mt-0.5">
                  {amountInWords}
                </p>
              </div>

              <div className="text-[10px] text-slate-400 space-y-0.5">
                <p>• {isHindi ? 'सभी लागू कर एवं जीएसटी मूल्य में शामिल हैं।' : 'Applicable GST & local taxes are inclusive in retail rate.'}</p>
                <p>• {isHindi ? 'कंप्यूटर जनित प्रामाणिक टैक्स बिल।' : 'System-generated digital invoice compliant with Indian mercantile practice.'}</p>
              </div>
            </div>

            <div className="sm:col-span-5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{isHindi ? 'कुल सामान:' : 'Total Items:'}</span>
                <span className="font-bold text-slate-800">
                  {items.length} {isHindi ? 'आइटम' : 'item(s)'} ({totalItemsCount} {isHindi ? 'इकाई' : 'units'})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isHindi ? 'उप-योग:' : 'Subtotal:'}</span>
                <span className="font-mono text-slate-800">₹{totalAmountNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isHindi ? 'टैक्स / जीएसटी:' : 'Tax Breakdown:'}</span>
                <span className="text-slate-500 font-medium">
                  {isHindi ? 'मूल्य में सम्मिलित' : 'Included in MRP'}
                </span>
              </div>

              {/* Grand Total Box */}
              <div className="pt-2 mt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                  {isHindi ? 'कुल देय राशि:' : 'Total Payable:'}
                </span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  ₹{totalAmountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Signatory & Footer */}
          <div className="pt-6 grid grid-cols-2 gap-4 text-xs text-slate-500">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isHindi ? 'नियम व शर्तें' : 'Terms & Conditions'}
              </span>
              <p className="text-[10px] text-slate-600">
                {isHindi
                  ? '1. बिका हुआ सामान बिना पक्के बिल के वापस नहीं लिया जाएगा।'
                  : '1. Goods once sold will not be taken back without invoice copy.'}
              </p>
              <p className="text-[10px] text-slate-600">
                {isHindi
                  ? '2. समस्त विवाद स्थानीय क्षेत्राधिकार के अधीन मान्य।'
                  : '2. Subject to local jurisdiction.'}
              </p>
              <p className="text-[11px] font-semibold text-slate-800 pt-1">
                {isHindi
                  ? tr(shopSettings?.receipt_footer || 'आपके व्यापार के लिए हार्दिक धन्यवाद! पुनः पधारें।')
                  : (shopSettings?.receipt_footer || 'Thank you for your business! Please visit again.')}
              </p>
            </div>

            <div className="flex flex-col items-end justify-end text-right">
              <div className="border-t border-slate-400 w-40 pt-1 text-center">
                <span className="text-[10px] font-bold text-slate-700 block uppercase">
                  {isHindi ? 'कृते ' : 'For '}
                  {isHindi ? tr(shopSettings?.shop_name || 'AK ENTERPRISES') : (shopSettings?.shop_name || 'AK ENTERPRISES')}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  {isHindi ? 'अधिकृत हस्ताक्षरकर्ता' : 'Authorized Signatory'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
