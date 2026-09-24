import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'shop.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency & performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Helper for Indian Standard Time (IST) timestamp
export function getISTTimestamp(): string {
  const now = new Date();
  // Formats to IST: YYYY-MM-DDTHH:mm:ss.sss+05:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().replace('Z', '+05:30');
}

export function formatISTDate(dateStr?: string): { date: string; time: string; full: string } {
  const d = dateStr ? new Date(dateStr) : new Date();
  const istOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };
  const dateFormatted = new Intl.DateTimeFormat('en-IN', istOptions).format(d);
  const timeFormatted = new Intl.DateTimeFormat('en-IN', timeOptions).format(d);
  return {
    date: dateFormatted,
    time: timeFormatted,
    full: `${dateFormatted}, ${timeFormatted}`,
  };
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, finalSalt, 1000, 64, 'sha512').toString('hex');
  return { hash: `${finalSalt}:${hash}`, salt: finalSalt };
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      opening_quantity REAL NOT NULL DEFAULT 0,
      current_quantity REAL NOT NULL DEFAULT 0,
      minimum_stock REAL NOT NULL DEFAULT 10,
      purchase_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      supplier_name TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      movement_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      previous_quantity REAL NOT NULL,
      new_quantity REAL NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      reason TEXT,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      transaction_number TEXT UNIQUE NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      customer_address TEXT,
      payment_method TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      cancelled_at TEXT,
      cancelled_reason TEXT,
      cancelled_by TEXT
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      selling_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT,
      old_value TEXT,
      new_value TEXT,
      quantity_difference REAL,
      previous_stock REAL,
      new_stock REAL,
      reason TEXT,
      performed_by TEXT NOT NULL,
      transaction_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_movements_created ON stock_movements(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_tx ON sales(transaction_number);
    CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
  `);

  // Safe migrations for existing databases
  try {
    db.prepare('ALTER TABLE sales ADD COLUMN customer_address TEXT;').run();
  } catch {
    // Column already exists
  }

  // Default settings
  const defaultSettings: Record<string, string> = {
    shop_name: 'AK ENTERPRISES',
    currency: '₹',
    timezone: 'Asia/Kolkata',
    phone: '+91 98765 43210',
    email: 'admin@akenterprises.com',
    address: 'Wholesale Market Complex, Main Road',
    default_min_stock: '10',
    invoice_prefix: 'AK-',
    receipt_footer: 'Thank you for your business with AK ENTERPRISES!',
  };

  const now = getISTTimestamp();
  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)');

  for (const [key, value] of Object.entries(defaultSettings)) {
    const row = getSetting.get(key);
    if (!row) {
      insertSetting.run(key, value, now);
    }
  }

  // Default admin: admin@akenterprises.com / admin123
  const adminCountRow = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (adminCountRow.count === 0) {
    const adminId = 'admin_' + crypto.randomUUID().slice(0, 8);
    const { hash } = hashPassword('admin123');
    db.prepare(`
      INSERT INTO admins (id, email, password_hash, name, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, 'admin@akenterprises.com', hash, 'Admin (AK Enterprises)', 'superadmin', now);

    // Initial audit log for admin creation
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, performed_by, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), 'ADMIN_INITIALIZED', 'AUTH', adminId, 'system', 'Default admin account provisioned', now);
  }

  // Default Categories
  const categoryCountRow = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCountRow.count === 0) {
    const defaultCategories = [
      'Grains & Cereals',
      'Pulses & Lentils',
      'Spices & Condiments',
      'Edible Oils',
      'Flours & Atta',
      'Sugar & Sweeteners',
      'Packaged Goods',
      'General Merchandise',
    ];
    const insertCategory = db.prepare('INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)');
    for (const cat of defaultCategories) {
      insertCategory.run(crypto.randomUUID(), cat, now);
    }
  }

  // Seed sample starter products if empty
  const productCountRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCountRow.count === 0) {
    const starterProducts = [
      {
        name: 'Basmati Rice (Premium Long Grain)',
        sku: 'RICE-01',
        category: 'Grains & Cereals',
        unit: 'Kg',
        opening_quantity: 100,
        current_quantity: 100,
        minimum_stock: 15,
        purchase_price: 75,
        selling_price: 95,
        supplier_name: 'Himalayan Agri Traders',
        description: 'Grade A royal basmati aged 2 years',
      },
      {
        name: 'Chakki Fresh Whole Wheat Atta',
        sku: 'ATTA-01',
        category: 'Flours & Atta',
        unit: 'Kg',
        opening_quantity: 80,
        current_quantity: 80,
        minimum_stock: 20,
        purchase_price: 32,
        selling_price: 42,
        supplier_name: 'Punjab Flour Mills',
        description: '100% whole grain stone ground atta',
      },
      {
        name: 'Toor Dal (Desi Unpolished)',
        sku: 'DAL-01',
        category: 'Pulses & Lentils',
        unit: 'Kg',
        opening_quantity: 50,
        current_quantity: 50,
        minimum_stock: 10,
        purchase_price: 120,
        selling_price: 145,
        supplier_name: 'Kisan Organic Produce',
        description: 'Rich protein unpolished yellow pigeon peas',
      },
      {
        name: 'Pure Mustard Oil (Kachi Ghani)',
        sku: 'OIL-01',
        category: 'Edible Oils',
        unit: 'Liter',
        opening_quantity: 40,
        current_quantity: 40,
        minimum_stock: 10,
        purchase_price: 140,
        selling_price: 170,
        supplier_name: 'National Oil Extraction Co',
        description: 'Cold pressed mustard seed oil in food grade cans',
      },
      {
        name: 'Refined White Sulphurless Sugar',
        sku: 'SUGAR-01',
        category: 'Sugar & Sweeteners',
        unit: 'Kg',
        opening_quantity: 120,
        current_quantity: 120,
        minimum_stock: 25,
        purchase_price: 38,
        selling_price: 46,
        supplier_name: 'Metro Wholesale Depot',
        description: 'Fine crystal white sugar',
      },
      {
        name: 'Black Peppercorns (Malabar Whole)',
        sku: 'SPICE-01',
        category: 'Spices & Condiments',
        unit: 'Gram',
        opening_quantity: 5000,
        current_quantity: 5000,
        minimum_stock: 1000,
        purchase_price: 0.65,
        selling_price: 0.95,
        supplier_name: 'Kerala Spice Exporters',
        description: 'Bold aroma Tellicherry black pepper',
      },
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (
        id, sku, name, category, unit, opening_quantity, current_quantity,
        minimum_stock, purchase_price, selling_price, supplier_name, description,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMovement = db.prepare(`
      INSERT INTO stock_movements (
        id, product_id, movement_type, quantity, previous_quantity,
        new_quantity, reference_type, reference_id, reason, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (
        id, action, entity_type, entity_id, product_id, product_name,
        old_value, new_value, quantity_difference, previous_stock, new_stock,
        reason, performed_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of starterProducts) {
      const pid = 'prod_' + crypto.randomUUID().slice(0, 8);
      insertProd.run(
        pid,
        p.sku,
        p.name,
        p.category,
        p.unit,
        p.opening_quantity,
        p.current_quantity,
        p.minimum_stock,
        p.purchase_price,
        p.selling_price,
        p.supplier_name,
        p.description,
        'ACTIVE',
        now,
        now
      );

      // Record opening stock movement
      insertMovement.run(
        crypto.randomUUID(),
        pid,
        'OPENING_STOCK',
        p.opening_quantity,
        0,
        p.opening_quantity,
        'INITIAL',
        pid,
        'Opening Stock Provisioning',
        'Initial shop inventory setup',
        'admin@akenterprises.com',
        now
      );

      // Record audit log
      insertAudit.run(
        crypto.randomUUID(),
        'PRODUCT_CREATED',
        'PRODUCT',
        pid,
        pid,
        p.name,
        null,
        JSON.stringify({ opening_quantity: p.opening_quantity, current_quantity: p.current_quantity }),
        p.opening_quantity,
        0,
        p.opening_quantity,
        'Product registered with opening stock',
        'admin@akenterprises.com',
        now
      );
    }
  }
}

// Auto run init
initDatabase();
