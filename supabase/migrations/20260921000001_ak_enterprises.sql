-- ==========================================================
-- AK ENTERPRISES SHOP MANAGEMENT SYSTEM
-- PostgreSQL / Supabase Schema & Migrations
-- Version: 20260921000001
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PROFILES / ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRODUCTS TABLE
-- Decimal quantity support: NUMERIC(14, 3) enables 10 kg, 5.5 kg, 2.250 kg, etc.
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    unit VARCHAR(32) NOT NULL DEFAULT 'Piece',
    opening_quantity NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (opening_quantity >= 0),
    current_quantity NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
    minimum_stock NUMERIC(14, 3) NOT NULL DEFAULT 10 CHECK (minimum_stock >= 0),
    purchase_price NUMERIC(14, 2) DEFAULT 0 CHECK (purchase_price >= 0),
    selling_price NUMERIC(14, 2) DEFAULT 0 CHECK (selling_price >= 0),
    supplier_name VARCHAR(255),
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. STOCK MOVEMENTS (IMMUTABLE INVENTORY JOURNAL)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type VARCHAR(64) NOT NULL, -- OPENING_STOCK, STOCK_ADDED, STOCK_ADJUSTED, SALE_CREATED, SALE_UPDATED, SALE_CANCELLED
    quantity NUMERIC(14, 3) NOT NULL,
    previous_quantity NUMERIC(14, 3) NOT NULL,
    new_quantity NUMERIC(14, 3) NOT NULL,
    reference_type VARCHAR(64), -- PRODUCT, STOCK_IN, ADJUSTMENT, SALE
    reference_id VARCHAR(128),
    reason TEXT,
    notes TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SALES TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(64) UNIQUE NOT NULL, -- e.g. SALE-20260921-0001
    customer_name VARCHAR(255) DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(64),
    payment_method VARCHAR(64) NOT NULL DEFAULT 'Cash',
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, EDITED, CANCELLED
    notes TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    cancelled_by VARCHAR(255)
);

-- 8. SALE ITEMS
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(32) NOT NULL,
    selling_price NUMERIC(14, 2) NOT NULL CHECK (selling_price >= 0),
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AUDIT LOGS (IMMUTABLE AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(64) NOT NULL, -- PRODUCT_CREATED, PRODUCT_UPDATED, STOCK_ADDED, STOCK_ADJUSTED, SALE_CREATED, SALE_UPDATED, SALE_CANCELLED, LOGIN, LOGOUT
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    product_id UUID,
    product_name VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    quantity_difference NUMERIC(14, 3),
    previous_stock NUMERIC(14, 3),
    new_stock NUMERIC(14, 3),
    reason TEXT,
    performed_by VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. INDEXES FOR HIGH-PERFORMANCE SEARCH & REPORTS
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON public.stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_sales_tx ON public.sales(transaction_number);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins full access
CREATE POLICY "Admins full access on settings" ON public.settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access on profiles" ON public.profiles
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access on categories" ON public.categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access on products" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access on stock_movements" ON public.stock_movements
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access on sales" ON public.sales
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access on sale_items" ON public.sale_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins read and insert audit_logs" ON public.audit_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins insert audit_logs" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Explicitly PREVENT deletions on audit_logs and stock_movements
CREATE POLICY "No deletion on audit_logs" ON public.audit_logs
    FOR DELETE TO authenticated USING (false);

CREATE POLICY "No deletion on stock_movements" ON public.stock_movements
    FOR DELETE TO authenticated USING (false);

-- 12. DATABASE SEED FOR DEFAULT SETTINGS
INSERT INTO public.settings (key, value) VALUES
    ('shop_name', 'AK ENTERPRISES'),
    ('currency', '₹'),
    ('timezone', 'Asia/Kolkata'),
    ('phone', '+91 98765 43210'),
    ('email', 'admin@akenterprises.com'),
    ('address', 'Wholesale Market Complex, Main Road'),
    ('default_min_stock', '10'),
    ('receipt_footer', 'Thank you for your business with AK ENTERPRISES!')
ON CONFLICT (key) DO NOTHING;
