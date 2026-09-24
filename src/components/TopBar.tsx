import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  AlertTriangle,
  Clock,
  User,
  ShoppingCart,
  X,
  ArrowRight,
  Languages,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';
import { Product, Sale } from '../types';

interface TopBarProps {
  onToggleMobileSidebar: () => void;
  onNavigate: (view: any, data?: any) => void;
  lowStockCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileSidebar,
  onNavigate,
  lowStockCount,
}) => {
  const { user } = useAuth();
  const { isHindi, toggleLanguage, autoTranslate } = useLanguage();
  const [istTime, setIstTime] = useState<string>('');
  const [istDate, setIstDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: Product[]; sales: Sale[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(now);

      const timeStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);

      setIstDate(dateStr);
      setIstTime(`${timeStr} IST`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.search(searchQuery.trim());
        setSearchResults(res);
        setSearchOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header id="app-topbar" className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-sidebar-toggle-btn"
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center">
            AK
          </span>
          <span className="font-extrabold text-sm text-slate-900 tracking-tight">AK ENTERPRISES</span>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-md relative hidden md:block" ref={searchContainerRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            placeholder={isHindi ? 'सामान, ग्राहक, पता या बिल # खोजें...' : 'Search products, SKU, customer or sale #...'}
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden transition-all text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Popup */}
        {searchOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-xs text-slate-400">Searching inventory...</div>
            ) : !searchResults || (searchResults.products.length === 0 && searchResults.sales.length === 0) ? (
              <div className="p-4 text-center text-xs text-slate-500">No matching products or sales found.</div>
            ) : (
              <div className="p-2 space-y-3">
                {searchResults.products.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Products ({searchResults.products.length})
                    </div>
                    <div className="space-y-1">
                      {searchResults.products.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            onNavigate('product-details', p.id);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{p.name}</p>
                            <p className="text-[11px] text-slate-500">
                              Code: <span className="font-mono text-slate-700">{p.sku}</span> • ₹{p.selling_price}/{p.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                (p.current_quantity ?? 0) <= 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : (p.current_quantity ?? 0) <= (p.minimum_stock ?? 0)
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {p.current_quantity ?? 0} {p.unit}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.sales.length > 0 && (
                  <div className="border-t border-slate-100 pt-2">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sales Transactions ({searchResults.sales.length})
                    </div>
                    <div className="space-y-1">
                      {searchResults.sales.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            onNavigate('sales-history', s.transaction_number);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 font-mono">{s.transaction_number}</p>
                            <p className="text-[11px] text-slate-500">
                              {s.customer_name}{s.customer_address ? ` • ${s.customer_address}` : ''} • {s.payment_method}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">₹{s.total_amount.toLocaleString('en-IN')}</p>
                            <span className="text-[10px] text-slate-400 uppercase">{s.status}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side widgets: Clock, Low stock alert, Sell CTA, Admin */}
      <div className="flex items-center gap-3">
        {/* Firebase Cloud DB Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Firebase Connected</span>
        </div>

        {/* Live IST Date/Time */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <div className="leading-tight">
            <span className="font-semibold text-slate-800">{istDate}</span>
            <span className="text-slate-400 mx-1">•</span>
            <span className="font-mono text-slate-600">{istTime}</span>
          </div>
        </div>

        {/* Language Switcher (Hindi / English) */}
        <button
          id="language-toggle-btn"
          onClick={toggleLanguage}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
            isHindi
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
          title={isHindi ? 'अंग्रेज़ी में बदलें (Switch to English)' : 'पूरी ऐप हिन्दी में करें (Switch to Hindi)'}
        >
          <Languages className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="flex items-center gap-1">
            <span className={isHindi ? 'text-amber-900 font-extrabold' : 'text-slate-500 font-normal'}>हिन्दी</span>
            <span className="text-slate-300">/</span>
            <span className={!isHindi ? 'text-slate-900 font-bold' : 'text-slate-400 font-normal'}>ENG</span>
          </div>
        </button>

        {/* Low Stock Warning Pill */}
        {lowStockCount > 0 && (
          <button
            id="topbar-low-stock-btn"
            onClick={() => onNavigate('inventory', { filter: 'LOW_STOCK' })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors"
            title={`${lowStockCount} items below minimum stock alert`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{lowStockCount} {isHindi ? 'कम स्टॉक' : 'Low Stock'}</span>
          </button>
        )}

        {/* BIG Quick Sell Button */}
        <button
          id="topbar-sell-btn"
          onClick={() => onNavigate('sell')}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
          <div className="flex flex-col text-left leading-none">
            <span className="font-black uppercase tracking-tight">Sell / बिल</span>
            <span className="text-[9px] text-emerald-200 font-medium hidden sm:inline">सामान बेचें</span>
          </div>
        </button>

        {/* Admin Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
