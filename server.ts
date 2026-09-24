import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { firestore, initFirebaseDatabase, getISTTimestamp } from './server/firebaseDb.js';
import * as services from './server/firebaseServices.js';

// Universal directory resolution across ESM (tsx dev) and CJS (production bundle)
const getBaseDir = () => {
  if (typeof __dirname !== 'undefined') return __dirname;
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).url) {
      return path.dirname(fileURLToPath((import.meta as any).url));
    }
  } catch {}
  return process.cwd();
};
const baseDir = getBaseDir();

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Container / Blitz.cloud health checks
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Session auth middleware
interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token.' });
  }

  const token = authHeader.substring(7).trim();
  try {
    const admin = await services.verifySessionToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized: Session expired or invalid. Please log in again.' });
    }
    req.admin = admin;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized: Authentication check failed.' });
  }
}

// ----------------- HEALTH CHECK -----------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    backend: 'Firebase Firestore',
    shop: 'AK ENTERPRISES',
    time: getISTTimestamp(),
  });
});

// ----------------- AUTH ROUTES -----------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await services.authenticateAdmin(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid email or password.' });
  }
});

// ----------------- GOOGLE AUTH SINGLE-ACCOUNT LOCK -----------------
app.get('/api/auth/google-status', async (req, res) => {
  try {
    const status = await services.getGoogleAuthStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to check Google auth status.' });
  }
});

app.post('/api/auth/google-login', async (req, res) => {
  const { email, name, uid, photoUrl } = req.body;
  if (!email || !uid) {
    return res.status(400).json({ error: 'Email and Google UID are required.' });
  }

  try {
    const result = await services.authenticateGoogleAdmin({
      email,
      name,
      uid,
      photoUrl,
    });
    res.json(result);
  } catch (err: any) {
    const isDenied = err.message?.includes('अस्वीकृत') || err.message?.includes('Access Denied');
    res.status(isDenied ? 403 : 401).json({ error: err.message || 'Google authentication failed.' });
  }
});

app.get('/api/auth/google-admin-details', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const details = await services.getAdminGoogleAuthDetails();
    res.json(details);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get Google auth details.' });
  }
});

app.post('/api/auth/reset-google-lock', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Admin password is required to reset Google account lock.' });
  }
  try {
    const result = await services.resetGoogleAuthLock(req.admin!.id, password, req.admin!.email);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reset Google account lock.' });
  }
});

app.post('/api/auth/logout', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.substring(7).trim();
  if (token) {
    await services.logoutSession(token, req.admin?.email);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({ admin: req.admin });
});

app.post('/api/auth/change-password', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  try {
    await services.changeAdminPassword(req.admin!.id, currentPassword, newPassword, req.admin!.email);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update credentials.' });
  }
});

// ----------------- DASHBOARD -----------------
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;
    const stats = await services.getDashboardStats(
      String(dateRange || 'TODAY'),
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined
    );
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load dashboard metrics.' });
  }
});

// ----------------- PRODUCTS / INVENTORY -----------------
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const products = await services.getProducts({
      category: category ? String(category) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
    });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch inventory.' });
  }
});

app.post('/api/products', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const product = await services.createProduct(req.body, req.admin!.email);
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create product.' });
  }
});

app.get('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const details = await services.getProductDetails(req.params.id);
    if (!details) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(details);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch product details.' });
  }
});

app.put('/api/products/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await services.updateProduct(req.params.id, req.body, req.admin!.email);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update product.' });
  }
});

app.delete('/api/products/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await services.deleteProduct(req.params.id, req.admin!.email);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete product.' });
  }
});

// ----------------- STOCK OPERATIONS -----------------
app.post('/api/stock/add', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await services.addStock(req.body, req.admin!.email);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add stock.' });
  }
});

app.post('/api/stock/adjust', authMiddleware, async (req: AuthenticatedRequest, res) => {
  return res.status(403).json({
    error: 'Manual stock reduction and adjustment are disabled. Stock levels are only updated via new inward stock arrivals or verified customer sales (स्टॉक डिलीट या एडजस्ट करना वर्जित है).'
  });
});

// ----------------- SALES -----------------
app.get('/api/sales', authMiddleware, async (req, res) => {
  try {
    const { search, productId, category, paymentMethod, status, dateFilter, startDate, endDate, page, limit } = req.query;
    const data = await services.getSales({
      search: search ? String(search) : undefined,
      productId: productId ? String(productId) : undefined,
      category: category ? String(category) : undefined,
      paymentMethod: paymentMethod ? String(paymentMethod) : undefined,
      status: status ? String(status) : undefined,
      dateFilter: dateFilter ? String(dateFilter) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20,
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch sales records.' });
  }
});

app.post('/api/sales', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const sale = await services.createSale(req.body, req.admin!.email);
    res.status(201).json(sale);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to complete sale.' });
  }
});

app.get('/api/sales/:id', authMiddleware, async (req, res) => {
  try {
    const sale = await services.getSaleById(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale transaction not found.' });
    }
    res.json(sale);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve sale details.' });
  }
});

app.put('/api/sales/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  res.status(403).json({
    error: 'Sales bills cannot be edited. All transaction history is permanent and non-editable (बिक्री बिल में बदलाव नहीं किया जा सकता).'
  });
});

app.post('/api/sales/:id/cancel', authMiddleware, async (req: AuthenticatedRequest, res) => {
  res.status(403).json({
    error: 'Bill cancellation is disabled. All transaction history is permanent and non-deletable (बिक्री बिल को रद्द नहीं किया जा सकता).'
  });
});

// ----------------- DAILY BUSINESS -----------------
app.get('/api/daily', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const data = await services.getDailyManagement(date ? String(date) : undefined);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch daily business summary.' });
  }
});

// ----------------- REPORTS -----------------
app.get('/api/reports', authMiddleware, async (req, res) => {
  try {
    const { type, dateFilter, startDate, endDate } = req.query;
    const data = await services.getReportData(
      String(type || 'SALES_DETAILED'),
      String(dateFilter || 'THIS_MONTH'),
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate report.' });
  }
});

// ----------------- AUDIT HISTORY -----------------
app.get('/api/audit-logs', authMiddleware, async (req, res) => {
  try {
    const { action, entityType, search, page, limit } = req.query;
    const logs = await services.getAuditLogs({
      action: action ? String(action) : undefined,
      entityType: entityType ? String(entityType) : undefined,
      search: search ? String(search) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 25,
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve audit history.' });
  }
});

// ----------------- GLOBAL SEARCH -----------------
app.get('/api/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const results = await services.globalSearch(String(q || ''));
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search failed.' });
  }
});

// ----------------- SETTINGS & CATEGORIES -----------------
app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await services.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

app.put('/api/settings', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await services.updateSettings(req.body, req.admin!.email);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update settings.' });
  }
});

app.get('/api/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await services.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

app.post('/api/categories', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }
    const cat = await services.createCategory(name, req.admin?.email || 'admin@akenterprises.com');
    res.status(201).json(cat);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to create category.' });
  }
});

app.post('/api/admin/clear-data', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await services.clearAllStoreData(req.admin?.email || 'kritamk286@gmail.com');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear store data.' });
  }
});

// ----------------- VITE MIDDLEWARE & SERVER STARTUP -----------------
async function startServer() {
  // Initialize Firebase Firestore backend and seed collections if empty
  await initFirebaseDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const candidates = [
      path.join(process.cwd(), 'dist'),
      path.join(baseDir, 'dist'),
      path.resolve('dist'),
    ];
    let distPath = candidates[0];
    for (const c of candidates) {
      if (fs.existsSync(path.join(c, 'index.html'))) {
        distPath = c;
        break;
      }
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('AK Enterprises Server is running. Frontend is compiling...');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AK ENTERPRISES Firebase Firestore Backend Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
