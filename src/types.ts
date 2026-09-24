export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface GoogleAuthStatus {
  isRegistered: boolean;
  authorizedEmailMasked: string | null;
  authorizedName: string | null;
  registeredAt: string | null;
}

export interface GoogleAuthAdminDetails {
  isRegistered: boolean;
  authorizedEmail: string | null;
  authorizedUid: string | null;
  authorizedName: string | null;
  registeredAt: string | null;
  lastLoginAt: string | null;
  status: string;
}

export interface Category {
  id: string;
  name: string;
}

export type UnitType = 'Piece' | 'Kg' | 'Gram' | 'Liter' | 'Meter' | 'Box' | 'Packet' | 'Other';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category?: string;
  unit: UnitType;
  opening_quantity: number;
  current_quantity: number;
  minimum_stock: number;
  purchase_price: number;
  selling_price: number;
  supplier_name?: string | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  stock_status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  unit?: string;
  movement_type: 'OPENING_STOCK' | 'STOCK_ADDED' | 'STOCK_ADJUSTED' | 'SALE_CREATED' | 'SALE_UPDATED' | 'SALE_CANCELLED';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type?: string;
  reference_id?: string;
  reason?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  category?: string;
  product_category?: string;
  quantity: number;
  unit: string;
  selling_price: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  transaction_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  payment_method: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Credit' | 'Other';
  total_amount: number;
  status: 'COMPLETED' | 'EDITED' | 'CANCELLED';
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string | null;
  cancelled_reason?: string | null;
  cancelled_by?: string | null;
  items?: SaleItem[];
  // Flat joined fields if query returned joined rows:
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  category?: string;
  product_category?: string;
  quantity?: number;
  unit?: string;
  selling_price?: number;
}

export interface AuditLog {
  id: string;
  action:
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'PRODUCT_DELETED'
    | 'STOCK_ADDED'
    | 'STOCK_ADJUSTED'
    | 'SALE_CREATED'
    | 'SALE_UPDATED'
    | 'SALE_CANCELLED'
    | 'CATEGORY_CREATED'
    | 'LOGIN'
    | 'LOGOUT'
    | 'PASSWORD_CHANGED'
    | 'SETTINGS_UPDATED';
  entity_type: string;
  entity_id: string;
  product_id?: string | null;
  product_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  quantity_difference?: number | null;
  previous_stock?: number | null;
  new_stock?: number | null;
  reason?: string | null;
  performed_by: string;
  transaction_id?: string | null;
  created_at: string;
}

export interface DashboardStats {
  summary: {
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
    outOfStockCount: number;
    inventoryValue: number;
    today: {
      salesAmount: number;
      transactionsCount: number;
      quantitySold: number;
    };
    selectedRange: {
      salesAmount: number;
      transactionsCount: number;
      quantitySold: number;
    };
  };
  lowStockProducts: {
    id: string;
    sku: string;
    name: string;
    current_quantity: number;
    minimum_stock: number;
    unit: string;
    selling_price: number;
  }[];
  topSellingProducts: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    total_sold_quantity: number;
    total_sales_amount: number;
  }[];
  salesChart: {
    date: string;
    amount: number;
    quantity: number;
    transactions: number;
  }[];
  movementBreakdown: {
    movement_type: string;
    count: number;
    total_qty: number;
  }[];
}

export interface DailyBusiness {
  date: string;
  salesSummary: {
    total_transactions: number;
    total_sales_amount: number;
    total_quantity_sold: number;
  };
  paymentBreakdown: {
    payment_method: string;
    count: number;
    amount: number;
  }[];
  productSales: {
    product_name: string;
    sku: string;
    unit: string;
    quantity_sold: number;
    total_amount: number;
  }[];
  movements: (StockMovement & { product_name: string; product_sku: string; unit: string })[];
  stockSummary: {
    stockAdded: number;
    stockSold: number;
    stockAdjustments: number;
  };
}

export interface ShopSettings {
  shop_name: string;
  currency: string;
  timezone: string;
  phone: string;
  email: string;
  address: string;
  default_min_stock: string;
  invoice_prefix: string;
  receipt_footer: string;
}
