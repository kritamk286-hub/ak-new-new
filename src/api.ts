import {
  AdminUser,
  AuditLog,
  DailyBusiness,
  DashboardStats,
  GoogleAuthAdminDetails,
  GoogleAuthStatus,
  Product,
  Sale,
  ShopSettings,
} from './types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('ak_auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('ak_auth_token', token);
    } else {
      localStorage.removeItem('ak_auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // If unauthorized, clear token
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; admin: AdminUser }> {
    const res = await this.request<{ token: string; admin: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  // Google Auth with Single Account Lock
  async getGoogleAuthStatus(): Promise<GoogleAuthStatus> {
    return this.request<GoogleAuthStatus>('/auth/google-status');
  }

  async googleLogin(payload: {
    email: string;
    name?: string;
    uid: string;
    photoUrl?: string;
    idToken?: string;
  }): Promise<{ token: string; admin: AdminUser; isFirstRegistration?: boolean }> {
    const res = await this.request<{ token: string; admin: AdminUser; isFirstRegistration?: boolean }>(
      '/auth/google-login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    this.setToken(res.token);
    return res;
  }

  async getGoogleAuthAdminDetails(): Promise<GoogleAuthAdminDetails> {
    return this.request<GoogleAuthAdminDetails>('/auth/google-admin-details');
  }

  async resetGoogleAuthLock(password: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/reset-google-lock', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<{ admin: AdminUser }> {
    return this.request<{ admin: AdminUser }>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Dashboard
  async getDashboard(dateRange: string = 'TODAY', startDate?: string, endDate?: string): Promise<DashboardStats> {
    const params = new URLSearchParams({ dateRange });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request<DashboardStats>(`/dashboard?${params.toString()}`);
  }

  // Products
  async getProducts(params?: { category?: string; status?: string; search?: string }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    return this.request<Product[]>(`/products?${searchParams.toString()}`);
  }

  async getProduct(id: string): Promise<any> {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Stock
  async addStock(data: {
    productId: string;
    quantityAdded: number;
    unit?: string;
    purchasePrice?: number;
    supplier?: string;
    notes?: string;
  }): Promise<any> {
    return this.request<any>('/stock/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adjustStock(data: {
    productId: string;
    adjustmentType: 'INCREASE' | 'DECREASE';
    quantity: number;
    reason: string;
    notes?: string;
  }): Promise<any> {
    return this.request<any>('/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Sales
  async getSales(params?: {
    search?: string;
    productId?: string;
    category?: string;
    paymentMethod?: string;
    status?: string;
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ sales: Sale[]; total: number; page: number; limit: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.productId) searchParams.append('productId', params.productId);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.dateFilter) searchParams.append('dateFilter', params.dateFilter);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    return this.request<any>(`/sales?${searchParams.toString()}`);
  }

  async createSale(data: {
    productId: string;
    quantity: number;
    unit?: string;
    sellingPrice: number;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    paymentMethod: string;
    notes?: string;
  }): Promise<Sale> {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSale(id: string): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`);
  }

  async updateSale(
    id: string,
    data: {
      quantity: number;
      sellingPrice?: number;
      customerName?: string;
      customerPhone?: string;
      paymentMethod?: string;
      reason: string;
    }
  ): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelSale(id: string, reason: string): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Daily
  async getDaily(date?: string): Promise<DailyBusiness> {
    const params = date ? `?date=${date}` : '';
    return this.request<DailyBusiness>(`/daily${params}`);
  }

  // Reports
  async getReports(type: string, dateFilter: string, startDate?: string, endDate?: string): Promise<any[]> {
    const params = new URLSearchParams({ type, dateFilter });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request<any[]>(`/reports?${params.toString()}`);
  }

  // Audit Logs
  async getAuditLogs(params?: {
    action?: string;
    entityType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number; page: number; limit: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.append('action', params.action);
    if (params?.entityType) searchParams.append('entityType', params.entityType);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    return this.request<any>(`/audit-logs?${searchParams.toString()}`);
  }

  // Global Search
  async search(query: string): Promise<{ products: Product[]; sales: Sale[] }> {
    return this.request<{ products: Product[]; sales: Sale[] }>(`/search?q=${encodeURIComponent(query)}`);
  }

  // Settings & Categories
  async getSettings(): Promise<ShopSettings> {
    return this.request<ShopSettings>('/settings');
  }

  async updateSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
    return this.request<ShopSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getCategories(): Promise<{ id: string; name: string }[]> {
    const res = await this.request<any>('/categories');
    if (!Array.isArray(res)) return [];
    return res.map((item: any, idx: number) => {
      if (typeof item === 'string') {
        return { id: item, name: item };
      }
      return {
        id: item?.id || item?.name || `cat_${idx}`,
        name: item?.name || item?.id || '',
      };
    });
  }

  async createCategory(name: string): Promise<{ id: string; name: string }> {
    return this.request<{ id: string; name: string }>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async clearAllData(): Promise<{ success: boolean; totalDeleted: number; message: string }> {
    return this.request<{ success: boolean; totalDeleted: number; message: string }>('/admin/clear-data', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
