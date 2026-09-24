import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar, NavView } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { ProductDetailsView } from './views/ProductDetailsView';
import { SellView } from './views/SellView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { DailyManagementView } from './views/DailyManagementView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { AuditHistoryView } from './views/AuditHistoryView';

import { ReceiptModal } from './components/ReceiptModal';
import { AddStockModal } from './components/AddStockModal';
import { AddProductModal } from './components/AddProductModal';
import { EditProductModal } from './components/EditProductModal';
import { DeleteProductModal } from './components/DeleteProductModal';

import { Product, Sale, ShopSettings } from './types';
import { api } from './api';

function MainApp() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [viewParam, setViewParam] = useState<any>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Global data with immediate sessionStorage hydration
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = sessionStorage.getItem('ak_cached_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(() => {
    try {
      const saved = sessionStorage.getItem('ak_cached_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(() => {
    try {
      const saved = sessionStorage.getItem('ak_cached_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modals
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [addStockProductId, setAddStockProductId] = useState<string | undefined>(undefined);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleteProductOpen, setIsDeleteProductOpen] = useState(false);

  // Refresh data in background
  const reloadData = async () => {
    try {
      const [prods, cats, sets] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getSettings(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setShopSettings(sets);
      try {
        sessionStorage.setItem('ak_cached_products', JSON.stringify(prods));
        sessionStorage.setItem('ak_cached_categories', JSON.stringify(cats));
        sessionStorage.setItem('ak_cached_settings', JSON.stringify(sets));
      } catch {}
    } catch (err) {
      console.error('Failed to reload data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      reloadData();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl animate-pulse">
          AK
        </div>
        <p className="text-xs text-slate-400 font-medium">Initializing AK ENTERPRISES system...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Count low stock items for alert badge
  const lowStockCount = (products || []).filter(
    p => p && (p.current_quantity ?? 0) <= (p.minimum_stock ?? 0) && (p.current_quantity ?? 0) > 0
  ).length;

  const handleNavigate = (view: NavView, data?: any) => {
    if (view === 'add-stock') {
      setAddStockProductId(data);
      setIsAddStockOpen(true);
      return;
    }
    if (view === 'add-product') {
      setIsAddProductOpen(true);
      return;
    }

    setCurrentView(view);
    setViewParam(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top bar header */}
        <TopBar
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onNavigate={handleNavigate}
          lowStockCount={lowStockCount}
        />

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenAddStock={() => {
                setAddStockProductId(undefined);
                setIsAddStockOpen(true);
              }}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryView
              products={products}
              categories={categories}
              initialFilter={viewParam?.filter || 'ALL'}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              onOpenAddStock={prodId => {
                setAddStockProductId(prodId);
                setIsAddStockOpen(true);
              }}
              onViewProductDetails={prodId => {
                setViewParam(prodId);
                setCurrentView('product-details');
              }}
              onNavigateToSell={prodId => {
                setViewParam(prodId);
                setCurrentView('sell');
              }}
              onOpenEditProduct={prod => {
                setEditingProduct(prod);
                setIsEditProductOpen(true);
              }}
              onOpenDeleteProduct={prod => {
                setDeletingProduct(prod);
                setIsDeleteProductOpen(true);
              }}
            />
          )}

          {currentView === 'product-details' && (
            <ProductDetailsView
              productId={viewParam}
              onBack={() => setCurrentView('inventory')}
              onOpenAddStock={prodId => {
                setAddStockProductId(prodId);
                setIsAddStockOpen(true);
              }}
              onNavigateToSell={prodId => {
                setViewParam(prodId);
                setCurrentView('sell');
              }}
              onOpenEditProduct={prod => {
                setEditingProduct(prod);
                setIsEditProductOpen(true);
              }}
              onOpenDeleteProduct={prod => {
                setDeletingProduct(prod);
                setIsDeleteProductOpen(true);
              }}
            />
          )}

          {currentView === 'sell' && (
            <SellView
              products={products}
              categories={categories}
              initialProductId={typeof viewParam === 'string' ? viewParam : undefined}
              onSaleCompleted={sale => {
                // Deduct sold quantity optimistically from products
                const soldItem = sale.items?.[0];
                if (soldItem) {
                  setProducts(prev =>
                    prev.map(p =>
                      p.id === soldItem.product_id
                        ? { ...p, current_quantity: Math.max(0, (p.current_quantity ?? 0) - soldItem.quantity) }
                        : p
                    )
                  );
                }
                reloadData();
              }}
              onOpenReceipt={sale => {
                setReceiptSale(sale);
              }}
              onNavigateToAddProduct={() => {
                setIsAddProductOpen(true);
              }}
            />
          )}

          {currentView === 'sales-history' && (
            <SalesHistoryView
              products={products}
              categories={categories}
              initialSearch={typeof viewParam === 'string' ? viewParam : ''}
              onOpenReceipt={sale => setReceiptSale(sale)}
            />
          )}

          {currentView === 'audit-history' && <AuditHistoryView />}

          {currentView === 'daily-management' && <DailyManagementView />}

          {currentView === 'reports' && <ReportsView />}

          {currentView === 'settings' && <SettingsView onDataReset={reloadData} />}
        </main>
      </div>

      {/* Global Modals */}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        sale={receiptSale}
        onClose={() => setReceiptSale(null)}
        shopSettings={shopSettings}
      />

      {/* Inward Add Stock Modal */}
      <AddStockModal
        products={products}
        selectedProductId={addStockProductId}
        isOpen={isAddStockOpen}
        onClose={() => {
          setIsAddStockOpen(false);
          setAddStockProductId(undefined);
        }}
        onSuccess={() => {
          reloadData();
        }}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        categories={categories}
        onClose={() => {
          setIsAddProductOpen(false);
        }}
        onSuccess={(newProduct) => {
          // Immediately add to products state for 0ms response
          setProducts(prev => [newProduct, ...prev]);
          reloadData();
        }}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditProductOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => {
          setIsEditProductOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={(updatedProduct) => {
          // Immediately update in products state for 0ms response
          setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
          reloadData();
        }}
        onDeleteRequest={prod => {
          setDeletingProduct(prod);
          setIsDeleteProductOpen(true);
        }}
      />

      {/* Delete Product Confirmation Modal */}
      <DeleteProductModal
        isOpen={isDeleteProductOpen}
        product={deletingProduct}
        onClose={() => {
          setIsDeleteProductOpen(false);
          setDeletingProduct(null);
        }}
        onSuccess={deletedId => {
          // Immediately remove from products state for 0ms response
          setProducts(prev => prev.filter(p => p.id !== deletedId));
          reloadData();
          if (currentView === 'product-details' && viewParam === deletedId) {
            setCurrentView('inventory');
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
