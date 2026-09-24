import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  ShoppingCart,
  Receipt,
  CalendarCheck,
  FileBarChart2,
  History,
  Settings,
  LogOut,
  SlidersHorizontal,
  PackagePlus,
  ShieldCheck,
  Languages,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export type NavView =
  | 'dashboard'
  | 'inventory'
  | 'add-product'
  | 'add-stock'
  | 'sell'
  | 'sales-history'
  | 'audit-history'
  | 'daily-management'
  | 'reports'
  | 'settings'
  | 'product-details';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onCloseMobile,
  lowStockCount = 0,
}) => {
  const { user, logout } = useAuth();
  const { isHindi, toggleLanguage } = useLanguage();

  const navItems = [
    {
      id: 'dashboard' as NavView,
      label: isHindi ? 'होम डैशबोर्ड' : 'Dashboard',
      sublabel: isHindi ? 'मुख्य अवलोकन' : 'होम पेज',
      icon: LayoutDashboard,
    },
    {
      id: 'inventory' as NavView,
      label: isHindi ? 'दुकान का सामान (स्टॉक)' : 'Items & Stock',
      sublabel: isHindi ? 'इन्वेंट्री बहीखाता' : 'दुकान का सामान',
      icon: Boxes,
      badge: lowStockCount > 0 ? (isHindi ? `${lowStockCount} कम` : `${lowStockCount} Low`) : undefined,
    },
    {
      id: 'add-product' as NavView,
      label: isHindi ? 'नया सामान जोड़ें' : 'Add New Item',
      sublabel: isHindi ? 'उत्पाद कैटलॉग' : 'नया सामान जोड़ें',
      icon: PackagePlus,
    },
    {
      id: 'add-stock' as NavView,
      label: isHindi ? 'नया माल आया (स्टॉक)' : 'Add Stock',
      sublabel: isHindi ? 'स्टॉक जमा करें' : 'नया माल आया',
      icon: PlusCircle,
    },
    {
      id: 'sales-history' as NavView,
      label: isHindi ? 'बिक्री व पक्के बिल' : 'Bills & Sales',
      sublabel: isHindi ? 'टैक्स इनवॉइस रसीदें' : 'बिक्री रसीदें',
      icon: Receipt,
    },
    {
      id: 'daily-management' as NavView,
      label: isHindi ? 'आज की कुल कमाई' : "Today's Summary",
      sublabel: isHindi ? 'दैनिक बिक्री हिसाब' : 'आज की कमाई',
      icon: CalendarCheck,
    },
    {
      id: 'audit-history' as NavView,
      label: isHindi ? 'स्थायी ऑडिट इतिहास' : 'Audit & Updates History',
      sublabel: isHindi ? 'सुरक्षित रिकॉर्ड' : 'स्थायी इतिहास (Immutable)',
      icon: History,
    },
    {
      id: 'settings' as NavView,
      label: isHindi ? 'दुकान सेटिंग्स' : 'Settings',
      sublabel: isHindi ? 'बिल व प्रोफाइल' : 'दुकान सेटिंग्स',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 text-slate-200 z-50 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-600/30 tracking-tight">
              AK
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">
                AK ENTERPRISES
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                  Firebase Cloud DB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BIG SELL PRODUCT BUTTON (Main Action for Shopkeeper) */}
        <div className="p-3 pb-1">
          <button
            id="nav-btn-sell-hero"
            onClick={() => {
              onNavigate('sell');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-black transition-all shadow-lg active:scale-98 ${
              currentView === 'sell'
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/40 ring-2 ring-white/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:shadow-emerald-500/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-sm font-black uppercase tracking-wide">
                  Sell Product
                </div>
                <div className="text-[11px] font-semibold text-emerald-100 opacity-90">
                  सामान बेचें / नया बिल
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-black/20 text-[10px] font-bold tracking-wider uppercase">
              1-Click
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Store Menu (दुकान मेनू)
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <p className="font-bold text-xs">{item.label}</p>
                    <p className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.sublabel}
                    </p>
                  </div>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Language switch & User profile */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 space-y-2">
          {/* Language Toggle in Sidebar */}
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? 'भाषा: हिन्दी' : 'Language: English'}</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {isHindi ? 'English करें' : 'हिन्दी करें'}
            </span>
          </button>

          <div className="px-3 py-1.5 flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
              {user?.role || 'Admin'}
            </span>
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isHindi ? 'लॉग आउट (Sign Out)' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
