import crypto from 'node:crypto';
import { db, getISTTimestamp } from './db.js';

export interface ProductInput {
  sku: string;
  name: string;
  category: string;
  unit: string;
  opening_quantity: number;
  current_quantity?: number;
  minimum_stock: number;
  purchase_price?: number;
  selling_price?: number;
  supplier_name?: string;
  description?: string;
  status?: string;
}

export interface AddStockInput {
  productId: string;
  quantityAdded: number;
  unit?: string;
  purchasePrice?: number;
  supplier?: string;
  notes?: string;
}

export interface AdjustStockInput {
  productId: string;
  adjustmentType: 'INCREASE' | 'DECREASE';
  quantity: number;
  reason: string;
  notes?: string;
}

export interface SaleInput {
  productId: string;
  quantity: number;
  unit?: string;
  sellingPrice: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod: string;
  notes?: string;
}

export interface EditSaleInput {
  quantity: number;
  sellingPrice?: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  reason: string;
}

// Generate unique sequential transaction ID: SALE-YYYYMMDD-0001
export function generateTransactionNumber(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const yyyy = ist.getFullYear();
  const mm = String(ist.getMonth() + 1).padStart(2, '0');
  const dd = String(ist.getDate()).padStart(2, '0');
  const datePrefix = `SALE-${yyyy}${mm}${dd}`;

  // Find max count for today
  const row = db.prepare(`
    SELECT transaction_number FROM sales
    WHERE transaction_number LIKE ?
    ORDER BY transaction_number DESC
    LIMIT 1
  `).get(`${datePrefix}-%`) as { transaction_number?: string } | undefined;

  let sequence = 1;
  if (row && row.transaction_number) {
    const parts = row.transaction_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  const seqStr = String(sequence).padStart(4, '0');
  return `${datePrefix}-${seqStr}`;
}

// Create Product
export function createProduct(input: ProductInput, adminEmail: string) {
  if (!input.name || !input.name.trim()) {
    throw new Error('Product name is required.');
  }
  if (!input.sku || !input.sku.trim()) {
    throw new Error('Product SKU / Code is required.');
  }
  const cleanSku = input.sku.trim().toUpperCase();

  // Check unique SKU
  const existing = db.prepare('SELECT id FROM products WHERE UPPER(sku) = ?').get(cleanSku);
  if (existing) {
    throw new Error(`This SKU already exists: ${cleanSku}`);
  }

  const openingQty = Number(input.opening_quantity) || 0;
  if (openingQty < 0) {
    throw new Error('Opening quantity cannot be negative.');
  }

  const minStock = Number(input.minimum_stock) >= 0 ? Number(input.minimum_stock) : 10;
  const purchasePrice = Number(input.purchase_price) || 0;
  const sellingPrice = Number(input.selling_price) || 0;

  const id = 'prod_' + crypto.randomUUID().slice(0, 8);
  const now = getISTTimestamp();

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      INSERT INTO products (
        id, sku, name, category, unit, opening_quantity, current_quantity,
        minimum_stock, purchase_price, selling_price, supplier_name, description, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      cleanSku,
      input.name.trim(),
      input.category.trim() || 'General Merchandise',
      input.unit.trim() || 'Piece',
      openingQty,
      openingQty,
      minStock,
      purchasePrice,
      sellingPrice,
      input.supplier_name?.trim() || null,
      input.description?.trim() || null,
      input.status || 'ACTIVE',
      now,
      now
    );

    // If opening quantity > 0, record in stock movements
    if (openingQty > 0) {
      db.prepare(`
        INSERT INTO stock_movements (
          id, product_id, movement_type, quantity, previous_quantity, new_quantity,
          reference_type, reference_id, reason, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        id,
        'OPENING_STOCK',
        openingQty,
        0,
        openingQty,
        'PRODUCT',
        id,
        'Initial Opening Stock',
        'Registered on product creation',
        adminEmail,
        now
      );
    }

    // Record audit log
    db.prepare(`
      INSERT INTO audit_logs (
        id, action, entity_type, entity_id, product_id, product_name,
        old_value, new_value, quantity_difference, previous_stock, new_stock,
        reason, performed_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      'PRODUCT_CREATED',
      'PRODUCT',
      id,
      id,
      input.name.trim(),
      null,
      `Opening stock: ${openingQty} ${input.unit}`,
      openingQty,
      0,
      openingQty,
      'New product registered in inventory',
      adminEmail,
      now
    );

    db.exec('COMMIT;');
    return getProductById(id);
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Update Product
export function updateProduct(id: string, input: Partial<ProductInput>, adminEmail: string) {
  const existing = getProductById(id);
  if (!existing) throw new Error('Product not found.');

  const updates: string[] = [];
  const params: any[] = [];

  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error('Product name cannot be empty.');
    updates.push('name = ?');
    params.push(input.name.trim());
  }
  if (input.sku !== undefined && input.sku.trim()) {
    updates.push('sku = ?');
    params.push(input.sku.trim().toUpperCase());
  }
  if (input.category !== undefined) {
    updates.push('category = ?');
    params.push(input.category.trim() || 'General');
  }
  if (input.unit !== undefined) {
    updates.push('unit = ?');
    params.push(input.unit.trim() || 'Piece');
  }
  if (input.selling_price !== undefined) {
    const sp = Number(input.selling_price);
    if (isNaN(sp) || sp < 0) throw new Error('Selling price must be a non-negative number.');
    updates.push('selling_price = ?');
    params.push(sp);
  }
  if (input.purchase_price !== undefined) {
    const pp = Number(input.purchase_price);
    if (isNaN(pp) || pp < 0) throw new Error('Purchase price must be a non-negative number.');
    updates.push('purchase_price = ?');
    params.push(pp);
  }
  if (input.minimum_stock !== undefined) {
    const ms = Number(input.minimum_stock);
    if (isNaN(ms) || ms < 0) throw new Error('Minimum stock alert must be a non-negative number.');
    updates.push('minimum_stock = ?');
    params.push(ms);
  }
  if (input.supplier_name !== undefined) {
    updates.push('supplier_name = ?');
    params.push(input.supplier_name.trim());
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    params.push(input.description.trim());
  }
  let qtyDiff = 0;
  let newStock = Number(existing.current_quantity ?? 0);
  const oldStock = Number(existing.current_quantity ?? 0);
  if (input.current_quantity !== undefined) {
    const cq = Number(input.current_quantity);
    if (isNaN(cq) || cq < 0) throw new Error('Current quantity must be a non-negative number.');
    updates.push('current_quantity = ?');
    params.push(cq);
    newStock = cq;
    qtyDiff = newStock - oldStock;
  }
  if (input.status !== undefined) {
    updates.push('status = ?');
    params.push(input.status);
  }

  const now = getISTTimestamp();
  updates.push('updated_at = ?');
  params.push(now);

  params.push(id);

  db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  // If quantity was changed, also record a stock movement record
  if (input.current_quantity !== undefined && qtyDiff !== 0) {
    const movId = 'mov_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO stock_movements (
        id, product_id, movement_type, quantity, previous_quantity, new_quantity,
        reference_type, reference_id, reason, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movId,
      id,
      'STOCK_ADJUSTED',
      Math.abs(qtyDiff),
      oldStock,
      newStock,
      'MANUAL_EDIT',
      movId,
      `Stock quantity manually edited: ${oldStock} → ${newStock} (${qtyDiff >= 0 ? '+' : ''}${qtyDiff} ${input.unit || existing.unit})`,
      'Updated via Edit Product modal',
      adminEmail,
      now
    );
  }

  // Build human-readable change notes
  const changeNotes: string[] = [];
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    changeNotes.push(`Name: "${existing.name}" → "${input.name.trim()}"`);
  }
  if (input.current_quantity !== undefined && newStock !== oldStock) {
    changeNotes.push(`Stock Quantity: ${oldStock} → ${newStock} ${input.unit || existing.unit} (${qtyDiff >= 0 ? '+' : ''}${qtyDiff})`);
  }
  if (input.selling_price !== undefined && Number(input.selling_price) !== Number(existing.selling_price)) {
    changeNotes.push(`Selling Price: ₹${existing.selling_price} → ₹${input.selling_price}`);
  }
  if (input.purchase_price !== undefined && Number(input.purchase_price) !== Number(existing.purchase_price)) {
    changeNotes.push(`Cost Price: ₹${existing.purchase_price} → ₹${input.purchase_price}`);
  }
  if (input.minimum_stock !== undefined && Number(input.minimum_stock) !== Number(existing.minimum_stock)) {
    changeNotes.push(`Min Stock Alert: ${existing.minimum_stock} → ${input.minimum_stock}`);
  }
  if (input.unit !== undefined && input.unit !== existing.unit) {
    changeNotes.push(`Unit: ${existing.unit} → ${input.unit}`);
  }
  if (input.category !== undefined && input.category !== existing.category) {
    changeNotes.push(`Category: "${existing.category}" → "${input.category}"`);
  }
  if (input.supplier_name !== undefined && input.supplier_name !== (existing.supplier_name || '')) {
    changeNotes.push(`Supplier: "${existing.supplier_name || 'None'}" → "${input.supplier_name}"`);
  }
  if (input.sku !== undefined && input.sku.trim() !== existing.sku) {
    changeNotes.push(`Code/SKU: ${existing.sku} → ${input.sku.trim().toUpperCase()}`);
  }

  const reason = changeNotes.length > 0
    ? `Product modified: ${changeNotes.join(' | ')}`
    : 'Product details updated by administrator';

  // Log audit
  db.prepare(`
    INSERT INTO audit_logs (
      id, action, entity_type, entity_id, product_id, product_name,
      old_value, new_value, quantity_difference, previous_stock, new_stock,
      reason, performed_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    'PRODUCT_UPDATED',
    'PRODUCT',
    id,
    id,
    input.name?.trim() || existing.name,
    JSON.stringify({
      name: existing.name,
      sku: existing.sku,
      current_quantity: oldStock,
      selling_price: existing.selling_price,
      purchase_price: existing.purchase_price,
      minimum_stock: existing.minimum_stock,
      unit: existing.unit,
      category: existing.category,
      supplier_name: existing.supplier_name,
    }),
    JSON.stringify({
      name: input.name?.trim() || existing.name,
      sku: input.sku?.trim().toUpperCase() || existing.sku,
      current_quantity: newStock,
      selling_price: input.selling_price ?? existing.selling_price,
      purchase_price: input.purchase_price ?? existing.purchase_price,
      minimum_stock: input.minimum_stock ?? existing.minimum_stock,
      unit: input.unit ?? existing.unit,
      category: input.category ?? existing.category,
      supplier_name: input.supplier_name ?? existing.supplier_name,
    }),
    qtyDiff !== 0 ? qtyDiff : null,
    oldStock,
    newStock,
    reason,
    adminEmail,
    now
  );

  return getProductById(id);
}

// Delete Product
export function deleteProduct(id: string, adminEmail: string) {
  const existing = getProductById(id);
  if (!existing) throw new Error('Product not found.');

  const now = getISTTimestamp();
  db.prepare('DELETE FROM products WHERE id = ?').run(id);

  db.prepare(`
    INSERT INTO audit_logs (
      id, action, entity_type, entity_id, product_id, product_name,
      old_value, new_value, quantity_difference, previous_stock, new_stock,
      reason, performed_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    'PRODUCT_DELETED',
    'PRODUCT',
    id,
    id,
    existing.name,
    JSON.stringify(existing),
    null,
    -Number(existing.current_quantity || 0),
    Number(existing.current_quantity || 0),
    0,
    `Product deleted from catalog: "${existing.name}" (Code: ${existing.sku}, Rate: ₹${existing.selling_price}, Removed Stock: ${existing.current_quantity} ${existing.unit})`,
    adminEmail,
    now
  );

  return { success: true, message: `Product ${existing.name} deleted successfully.` };
}

// Get Product by ID
export function getProductById(id: string) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
}

// Get all products with calculated stock status
export function getProducts(filters?: { category?: string; status?: string; search?: string }) {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (filters?.category && filters.category !== 'ALL') {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters?.status && filters.status !== 'ALL') {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query += ' AND (name LIKE ? OR sku LIKE ? OR supplier_name LIKE ?)';
    params.push(term, term, term);
  }

  query += ' ORDER BY name ASC';
  const products = db.prepare(query).all(...params) as any[];

  return products.map(p => {
    let stockStatus = 'IN_STOCK';
    if (p.current_quantity <= 0) {
      stockStatus = 'OUT_OF_STOCK';
    } else if (p.current_quantity <= p.minimum_stock) {
      stockStatus = 'LOW_STOCK';
    }
    return {
      ...p,
      stock_status: stockStatus,
    };
  });
}

// Add Stock (Purchase / Stock In)
export function addStock(input: AddStockInput, adminEmail: string) {
  const qtyAdded = Number(input.quantityAdded);
  if (isNaN(qtyAdded) || qtyAdded <= 0) {
    throw new Error('Quantity added must be a positive number greater than 0.');
  }

  const product = getProductById(input.productId);
  if (!product) {
    throw new Error('Product not found.');
  }

  const previousQty = Number(product.current_quantity);
  const newQty = previousQty + qtyAdded;
  const now = getISTTimestamp();

  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Update product current quantity
    db.prepare(`
      UPDATE products
      SET current_quantity = ?, updated_at = ?
      WHERE id = ?
    `).run(newQty, now, product.id);

    // 2. Insert stock movement record
    const movementId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO stock_movements (
        id, product_id, movement_type, quantity, previous_quantity, new_quantity,
        reference_type, reference_id, reason, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movementId,
      product.id,
      'STOCK_ADDED',
      qtyAdded,
      previousQty,
      newQty,
      'STOCK_IN',
      movementId,
      input.supplier ? `Supplier: ${input.supplier}` : 'Stock Inward Purchase',
      input.notes || null,
      adminEmail,
      now
    );

    // 3. Insert audit log
    db.prepare(`
      INSERT INTO audit_logs (
        id, action, entity_type, entity_id, product_id, product_name,
        old_value, new_value, quantity_difference, previous_stock, new_stock,
        reason, performed_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      'STOCK_ADDED',
      'STOCK',
      movementId,
      product.id,
      product.name,
      `${previousQty} ${product.unit}`,
      `${newQty} ${product.unit}`,
      qtyAdded,
      previousQty,
      newQty,
      input.notes ? `Added: ${input.notes}` : `Stock addition of ${qtyAdded} ${product.unit}`,
      adminEmail,
      now
    );

    db.exec('COMMIT;');
    return {
      product: getProductById(product.id),
      previousQuantity: previousQty,
      quantityAdded: qtyAdded,
      newQuantity: newQty,
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Adjust Stock (Disabled - Manual stock deletion / reduction is forbidden)
export function adjustStock(input: AdjustStockInput, adminEmail: string) {
  throw new Error('Manual stock adjustment or deletion is permanently disabled. Stock is only updated via verified sales or inward stock arrivals (स्टॉक डिलीट या एडजस्ट करना वर्जित है).');
}

// Create Sale (Atomically validate stock, record sale, update stock, create movement & audit)
export function createSale(input: SaleInput, adminEmail: string) {
  const qtySold = Number(input.quantity);
  if (isNaN(qtySold) || qtySold <= 0) {
    throw new Error('Sale quantity must be a positive number greater than 0.');
  }

  const sellingPrice = Number(input.sellingPrice);
  if (isNaN(sellingPrice) || sellingPrice < 0) {
    throw new Error('Selling price must be 0 or greater.');
  }

  const product = getProductById(input.productId);
  if (!product) {
    throw new Error('Selected product does not exist.');
  }

  const currentStock = Number(product.current_quantity);
  if (currentStock < qtySold) {
    throw new Error(`Insufficient stock. Available quantity: ${currentStock} ${product.unit}.`);
  }

  if (!input.customerName || !input.customerName.trim()) {
    throw new Error('Customer Name is mandatory. Please provide customer name (ग्राहक का नाम लिखना अनिवार्य है).');
  }

  if (!input.customerAddress || !input.customerAddress.trim()) {
    throw new Error('Customer Address is mandatory. Please provide customer address (ग्राहक का पता लिखना अनिवार्य है).');
  }

  const newStock = currentStock - qtySold;
  const totalAmount = Number((qtySold * sellingPrice).toFixed(2));
  const txNumber = generateTransactionNumber();
  const saleId = 'sale_' + crypto.randomUUID().slice(0, 8);
  const itemId = crypto.randomUUID();
  const now = getISTTimestamp();

  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Decrement product stock
    db.prepare(`
      UPDATE products
      SET current_quantity = ?, updated_at = ?
      WHERE id = ?
    `).run(newStock, now, product.id);

    // 2. Insert into sales
    db.prepare(`
      INSERT INTO sales (
        id, transaction_number, customer_name, customer_phone, customer_address,
        payment_method, total_amount, status, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      saleId,
      txNumber,
      input.customerName.trim(),
      input.customerPhone?.trim() || null,
      input.customerAddress.trim(),
      input.paymentMethod || 'Cash',
      totalAmount,
      'COMPLETED',
      input.notes?.trim() || null,
      adminEmail,
      now,
      now
    );

    // 3. Insert sale item
    db.prepare(`
      INSERT INTO sale_items (
        id, sale_id, product_id, quantity, unit, selling_price, total_amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      itemId,
      saleId,
      product.id,
      qtySold,
      product.unit,
      sellingPrice,
      totalAmount,
      now,
      now
    );

    // 4. Stock Movement record
    db.prepare(`
      INSERT INTO stock_movements (
        id, product_id, movement_type, quantity, previous_quantity, new_quantity,
        reference_type, reference_id, reason, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      product.id,
      'SALE_CREATED',
      -qtySold,
      currentStock,
      newStock,
      'SALE',
      saleId,
      `Sale ${txNumber}`,
      `Sold to ${input.customerName || 'Customer'} via ${input.paymentMethod}`,
      adminEmail,
      now
    );

    // 5. Audit Log
    db.prepare(`
      INSERT INTO audit_logs (
        id, action, entity_type, entity_id, product_id, product_name,
        old_value, new_value, quantity_difference, previous_stock, new_stock,
        reason, performed_by, transaction_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      'SALE_CREATED',
      'SALE',
      saleId,
      product.id,
      product.name,
      `${currentStock} ${product.unit}`,
      `${newStock} ${product.unit}`,
      -qtySold,
      currentStock,
      newStock,
      `Sale executed for ${qtySold} ${product.unit} @ ₹${sellingPrice}`,
      adminEmail,
      txNumber,
      now
    );

    db.exec('COMMIT;');
    return getSaleById(saleId);
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Edit a Sale (Permanently disabled - sales bills and history are immutable)
export function updateSale(saleId: string, input: EditSaleInput, adminEmail: string) {
  throw new Error('Sales bills cannot be edited. All transaction records and history are permanent (बिक्री बिल में बदलाव वर्जित है).');
}

// Cancel Sale (Restores inventory, marks as CANCELLED, permanent audit)
export function cancelSale(saleId: string, reason: string, adminEmail: string) {
  throw new Error('Sales bills cannot be cancelled. All transaction records and history are permanent (बिक्री बिल को रद्द करना वर्जित है).');
}

// Get Sale by ID with items
export function getSaleById(id: string) {
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id) as any;
  if (!sale) return null;

  const items = db.prepare(`
    SELECT si.*, p.name as product_name, p.sku as product_sku
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `).all(id) as any[];

  return {
    ...sale,
    items,
  };
}

// Get Sales with pagination and filters
export function getSales(params?: {
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
}) {
  let query = `
    SELECT s.*,
           si.product_id,
           si.quantity,
           si.unit,
           si.selling_price,
           p.name as product_name,
           p.sku as product_sku,
           p.category as product_category
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN products p ON si.product_id = p.id
    WHERE 1=1
  `;
  const countQueryBase = `
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN products p ON si.product_id = p.id
    WHERE 1=1
  `;

  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  if (params?.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    whereConditions.push('(s.transaction_number LIKE ? OR s.customer_name LIKE ? OR s.customer_address LIKE ? OR s.customer_phone LIKE ? OR p.name LIKE ? OR p.sku LIKE ?)');
    queryParams.push(term, term, term, term, term, term);
  }

  if (params?.productId && params.productId !== 'ALL') {
    whereConditions.push('si.product_id = ?');
    queryParams.push(params.productId);
  }

  if (params?.category && params.category !== 'ALL') {
    whereConditions.push('p.category = ?');
    queryParams.push(params.category);
  }

  if (params?.paymentMethod && params.paymentMethod !== 'ALL') {
    whereConditions.push('s.payment_method = ?');
    queryParams.push(params.paymentMethod);
  }

  if (params?.status && params.status !== 'ALL') {
    whereConditions.push('s.status = ?');
    queryParams.push(params.status);
  }

  // Date filters
  const dateCond = buildDateFilter(params?.dateFilter, params?.startDate, params?.endDate);
  if (dateCond.sql) {
    whereConditions.push(dateCond.sql);
    queryParams.push(...dateCond.params);
  }

  const whereClause = whereConditions.length > 0 ? ' AND ' + whereConditions.join(' AND ') : '';
  const finalQuery = query + whereClause + ' ORDER BY s.created_at DESC';

  const limit = params?.limit || 20;
  const page = Math.max(1, params?.page || 1);
  const offset = (page - 1) * limit;

  const paginatedQuery = `${finalQuery} LIMIT ? OFFSET ?`;
  const allParams = [...queryParams, limit, offset];

  const rows = db.prepare(paginatedQuery).all(...allParams) as any[];

  // Total count
  const countSql = `SELECT COUNT(DISTINCT s.id) as total ${countQueryBase} ${whereClause}`;
  const totalCountRow = db.prepare(countSql).get(...queryParams) as { total: number };

  return {
    sales: rows,
    total: totalCountRow.total,
    page,
    limit,
    totalPages: Math.ceil(totalCountRow.total / limit),
  };
}

// Date Filter Builder
function buildDateFilter(filterType?: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);

  const getDayStart = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}T00:00:00.000+05:30`;
  };

  const getDayEnd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}T23:59:59.999+05:30`;
  };

  switch (filterType) {
    case 'TODAY': {
      return {
        sql: 's.created_at >= ? AND s.created_at <= ?',
        params: [getDayStart(ist), getDayEnd(ist)],
      };
    }
    case 'YESTERDAY': {
      const yesterday = new Date(ist.getTime() - 24 * 60 * 60 * 1000);
      return {
        sql: 's.created_at >= ? AND s.created_at <= ?',
        params: [getDayStart(yesterday), getDayEnd(yesterday)],
      };
    }
    case 'LAST_7_DAYS': {
      const past = new Date(ist.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        sql: 's.created_at >= ? AND s.created_at <= ?',
        params: [getDayStart(past), getDayEnd(ist)],
      };
    }
    case 'THIS_MONTH': {
      const startOfMonth = new Date(ist.getFullYear(), ist.getMonth(), 1);
      return {
        sql: 's.created_at >= ? AND s.created_at <= ?',
        params: [getDayStart(startOfMonth), getDayEnd(ist)],
      };
    }
    case 'PREVIOUS_MONTH': {
      const startOfPrevMonth = new Date(ist.getFullYear(), ist.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(ist.getFullYear(), ist.getMonth(), 0);
      return {
        sql: 's.created_at >= ? AND s.created_at <= ?',
        params: [getDayStart(startOfPrevMonth), getDayEnd(endOfPrevMonth)],
      };
    }
    case 'CUSTOM': {
      if (customStart && customEnd) {
        return {
          sql: 's.created_at >= ? AND s.created_at <= ?',
          params: [`${customStart}T00:00:00.000+05:30`, `${customEnd}T23:59:59.999+05:30`],
        };
      }
      return { sql: '', params: [] };
    }
    default:
      return { sql: '', params: [] };
  }
}

// Get Dashboard Statistics from Real Database
export function getDashboardStats(dateRange: string = 'TODAY', customStart?: string, customEnd?: string) {
  const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count;
  const totalStock = (db.prepare('SELECT COALESCE(SUM(current_quantity), 0) as total FROM products').get() as any).total;
  const lowStockCount = (db.prepare('SELECT COUNT(*) as count FROM products WHERE current_quantity <= minimum_stock AND current_quantity > 0').get() as any).count;
  const outOfStockCount = (db.prepare('SELECT COUNT(*) as count FROM products WHERE current_quantity <= 0').get() as any).count;

  // Inventory valuation
  const inventoryValue = (db.prepare('SELECT COALESCE(SUM(current_quantity * purchase_price), 0) as val FROM products').get() as any).val;

  // Real today bounds
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const todayYMD = `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
  const todayStart = `${todayYMD}T00:00:00.000+05:30`;
  const todayEnd = `${todayYMD}T23:59:59.999+05:30`;

  // Today's stats
  const todaySales = db.prepare(`
    SELECT
      COUNT(DISTINCT s.id) as transactions_count,
      COALESCE(SUM(s.total_amount), 0) as total_amount,
      COALESCE(SUM(si.quantity), 0) as quantity_sold
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE s.status IN ('COMPLETED', 'EDITED')
      AND s.created_at >= ? AND s.created_at <= ?
  `).get(todayStart, todayEnd) as any;

  // Range-specific stats (for chosen range)
  const rangeCond = buildDateFilter(dateRange, customStart, customEnd);
  let rangeSalesSql = `
    SELECT
      COUNT(DISTINCT s.id) as transactions_count,
      COALESCE(SUM(s.total_amount), 0) as total_amount,
      COALESCE(SUM(si.quantity), 0) as quantity_sold
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE s.status IN ('COMPLETED', 'EDITED')
  `;
  if (rangeCond.sql) {
    rangeSalesSql += ` AND ${rangeCond.sql}`;
  }
  const rangeSales = db.prepare(rangeSalesSql).get(...rangeCond.params) as any;

  // Low stock products list
  const lowStockProducts = db.prepare(`
    SELECT id, sku, name, current_quantity, minimum_stock, unit, selling_price
    FROM products
    WHERE current_quantity <= minimum_stock
    ORDER BY current_quantity ASC
    LIMIT 10
  `).all() as any[];

  // Top selling products
  let topProductsSql = `
    SELECT
      p.id,
      p.name,
      p.sku,
      p.unit,
      COALESCE(SUM(si.quantity), 0) as total_sold_quantity,
      COALESCE(SUM(si.total_amount), 0) as total_sales_amount
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.status IN ('COMPLETED', 'EDITED')
  `;
  if (rangeCond.sql) {
    topProductsSql += ` AND ${rangeCond.sql}`;
  }
  topProductsSql += `
    GROUP BY p.id
    ORDER BY total_sales_amount DESC
    LIMIT 5
  `;
  const topSellingProducts = db.prepare(topProductsSql).all(...rangeCond.params) as any[];

  // Daily sales chart data for last 7 days
  const last7DaysData: { date: string; amount: number; quantity: number; transactions: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(ist.getTime() - i * 24 * 60 * 60 * 1000);
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    const dayStr = `${y}-${m}-${d}`;
    const start = `${dayStr}T00:00:00.000+05:30`;
    const end = `${dayStr}T23:59:59.999+05:30`;

    const dayStat = db.prepare(`
      SELECT
        COUNT(DISTINCT s.id) as tx_count,
        COALESCE(SUM(s.total_amount), 0) as amount,
        COALESCE(SUM(si.quantity), 0) as qty
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.status IN ('COMPLETED', 'EDITED')
        AND s.created_at >= ? AND s.created_at <= ?
    `).get(start, end) as any;

    const shortDate = new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' }).format(day);
    last7DaysData.push({
      date: shortDate,
      amount: dayStat.amount,
      quantity: dayStat.qty,
      transactions: dayStat.tx_count,
    });
  }

  // Stock movement breakdown
  const movementBreakdown = db.prepare(`
    SELECT movement_type, COUNT(*) as count, COALESCE(SUM(ABS(quantity)), 0) as total_qty
    FROM stock_movements
    GROUP BY movement_type
  `).all() as any[];

  return {
    summary: {
      totalProducts,
      totalStock,
      lowStockCount,
      outOfStockCount,
      inventoryValue,
      today: {
        salesAmount: todaySales.total_amount,
        transactionsCount: todaySales.transactions_count,
        quantitySold: todaySales.quantity_sold,
      },
      selectedRange: {
        salesAmount: rangeSales.total_amount,
        transactionsCount: rangeSales.transactions_count,
        quantitySold: rangeSales.quantity_sold,
      },
    },
    lowStockProducts,
    topSellingProducts,
    salesChart: last7DaysData,
    movementBreakdown,
  };
}

// Daily Business Management
export function getDailyManagement(targetDateStr?: string) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);

  const dateStr = targetDateStr || `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
  const dayStart = `${dateStr}T00:00:00.000+05:30`;
  const dayEnd = `${dateStr}T23:59:59.999+05:30`;

  // Sales totals on that day
  const salesSummary = db.prepare(`
    SELECT
      COUNT(DISTINCT s.id) as total_transactions,
      COALESCE(SUM(s.total_amount), 0) as total_sales_amount,
      COALESCE(SUM(si.quantity), 0) as total_quantity_sold
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE s.status IN ('COMPLETED', 'EDITED')
      AND s.created_at >= ? AND s.created_at <= ?
  `).get(dayStart, dayEnd) as any;

  // Payment method breakdown
  const paymentBreakdown = db.prepare(`
    SELECT
      payment_method,
      COUNT(id) as count,
      COALESCE(SUM(total_amount), 0) as amount
    FROM sales
    WHERE status IN ('COMPLETED', 'EDITED')
      AND created_at >= ? AND created_at <= ?
    GROUP BY payment_method
  `).all(dayStart, dayEnd) as any[];

  // Product-wise daily sales
  const productSales = db.prepare(`
    SELECT
      p.name as product_name,
      p.sku,
      si.unit,
      COALESCE(SUM(si.quantity), 0) as quantity_sold,
      COALESCE(SUM(si.total_amount), 0) as total_amount
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.status IN ('COMPLETED', 'EDITED')
      AND s.created_at >= ? AND s.created_at <= ?
    GROUP BY p.id
    ORDER BY total_amount DESC
  `).all(dayStart, dayEnd) as any[];

  // Stock movements on that day
  const movements = db.prepare(`
    SELECT sm.*, p.name as product_name, p.sku as product_sku, p.unit
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    WHERE sm.created_at >= ? AND sm.created_at <= ?
    ORDER BY sm.created_at DESC
  `).all(dayStart, dayEnd) as any[];

  // Stock additions, adjustments, sold
  const stockAdded = movements
    .filter(m => m.movement_type === 'STOCK_ADDED')
    .reduce((acc, m) => acc + m.quantity, 0);

  const stockSold = movements
    .filter(m => m.movement_type === 'SALE_CREATED')
    .reduce((acc, m) => acc + Math.abs(m.quantity), 0);

  const stockAdjustments = movements
    .filter(m => m.movement_type === 'STOCK_ADJUSTED' || m.movement_type === 'SALE_UPDATED' || m.movement_type === 'SALE_CANCELLED')
    .reduce((acc, m) => acc + m.quantity, 0);

  return {
    date: dateStr,
    salesSummary,
    paymentBreakdown,
    productSales,
    movements,
    stockSummary: {
      stockAdded,
      stockSold,
      stockAdjustments,
    },
  };
}

// Reports Generation
export function getReportData(reportType: string, dateFilter: string = 'THIS_MONTH', customStart?: string, customEnd?: string) {
  const dateCond = buildDateFilter(dateFilter, customStart, customEnd);
  let where = dateCond.sql ? `WHERE ${dateCond.sql}` : '';

  switch (reportType) {
    case 'PRODUCT_WISE': {
      const sql = `
        SELECT
          p.id,
          p.name,
          p.sku,
          p.category,
          p.unit,
          p.current_quantity as current_stock,
          COALESCE(SUM(si.quantity), 0) as quantity_sold,
          COALESCE(SUM(si.total_amount), 0) as total_revenue
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id AND s.status IN ('COMPLETED', 'EDITED')
        ${dateCond.sql ? `AND ${dateCond.sql}` : ''}
        GROUP BY p.id
        ORDER BY total_revenue DESC
      `;
      return db.prepare(sql).all(...dateCond.params) as any[];
    }

    case 'STOCK_MOVEMENT': {
      const sql = `
        SELECT
          sm.*,
          p.name as product_name,
          p.sku,
          p.unit
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        ${dateCond.sql ? `WHERE ${dateCond.sql.replace(/s\.created_at/g, 'sm.created_at')}` : ''}
        ORDER BY sm.created_at DESC
        LIMIT 500
      `;
      return db.prepare(sql).all(...dateCond.params) as any[];
    }

    case 'PAYMENT_METHOD': {
      const sql = `
        SELECT
          payment_method,
          COUNT(id) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_amount
        FROM sales s
        ${where ? `${where} AND status IN ('COMPLETED', 'EDITED')` : "WHERE status IN ('COMPLETED', 'EDITED')"}
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `;
      return db.prepare(sql).all(...dateCond.params) as any[];
    }

    case 'LOW_STOCK': {
      const sql = `
        SELECT
          id, name, sku, category, unit, current_quantity, minimum_stock, purchase_price, selling_price, supplier_name
        FROM products
        WHERE current_quantity <= minimum_stock
        ORDER BY current_quantity ASC
      `;
      return db.prepare(sql).all() as any[];
    }

    case 'SALES_DETAILED':
    default: {
      const sql = `
        SELECT
          s.transaction_number,
          s.created_at,
          s.customer_name,
          s.customer_phone,
          s.payment_method,
          s.total_amount,
          s.status,
          si.quantity,
          si.unit,
          si.selling_price,
          p.name as product_name,
          p.sku as product_sku
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        ${where}
        ORDER BY s.created_at DESC
      `;
      return db.prepare(sql).all(...dateCond.params) as any[];
    }
  }
}

// Audit Logs
export function getAuditLogs(params?: {
  action?: string;
  entityType?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
  const queryParams: any[] = [];

  if (params?.action && params.action !== 'ALL') {
    query += ' AND action = ?';
    countQuery += ' AND action = ?';
    queryParams.push(params.action);
  }

  if (params?.entityType && params.entityType !== 'ALL') {
    query += ' AND entity_type = ?';
    countQuery += ' AND entity_type = ?';
    queryParams.push(params.entityType);
  }

  if (params?.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    query += ' AND (product_name LIKE ? OR transaction_id LIKE ? OR reason LIKE ? OR performed_by LIKE ?)';
    countQuery += ' AND (product_name LIKE ? OR transaction_id LIKE ? OR reason LIKE ? OR performed_by LIKE ?)';
    queryParams.push(term, term, term, term);
  }

  query += ' ORDER BY created_at DESC';

  const limit = params?.limit || 25;
  const page = Math.max(1, params?.page || 1);
  const offset = (page - 1) * limit;

  const paginatedQuery = `${query} LIMIT ? OFFSET ?`;
  const rows = db.prepare(paginatedQuery).all(...queryParams, limit, offset) as any[];
  const total = (db.prepare(countQuery).get(...queryParams) as any).total;

  return {
    logs: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Product Details with complete stock movements & sales history
export function getProductDetails(productId: string) {
  const product = getProductById(productId);
  if (!product) return null;

  // Movements
  const movements = db.prepare(`
    SELECT * FROM stock_movements
    WHERE product_id = ?
    ORDER BY created_at DESC
  `).all(productId) as any[];

  // Sales
  const sales = db.prepare(`
    SELECT s.transaction_number, s.customer_name, s.payment_method, s.status,
           si.quantity, si.unit, si.selling_price, si.total_amount, s.created_at
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE si.product_id = ?
    ORDER BY s.created_at DESC
  `).all(productId) as any[];

  // Stats
  const totalAdded = movements
    .filter(m => m.movement_type === 'STOCK_ADDED')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalSold = movements
    .filter(m => m.movement_type === 'SALE_CREATED')
    .reduce((acc, m) => acc + Math.abs(m.quantity), 0);

  const totalRevenue = sales
    .filter(s => s.status !== 'CANCELLED')
    .reduce((acc, s) => acc + s.total_amount, 0);

  return {
    product,
    stats: {
      totalAdded,
      totalSold,
      totalRevenue,
      salesCount: sales.filter(s => s.status !== 'CANCELLED').length,
    },
    movements,
    sales,
  };
}

// Global Search (Products, SKU, Sales, Customers)
export function globalSearch(term: string) {
  if (!term || !term.trim()) {
    return { products: [], sales: [] };
  }
  const clean = `%${term.trim()}%`;

  const products = db.prepare(`
    SELECT id, sku, name, category, unit, current_quantity, minimum_stock, selling_price, status
    FROM products
    WHERE name LIKE ? OR sku LIKE ? OR category LIKE ?
    LIMIT 6
  `).all(clean, clean, clean) as any[];

  const sales = db.prepare(`
    SELECT id, transaction_number, customer_name, total_amount, payment_method, status, created_at
    FROM sales
    WHERE transaction_number LIKE ? OR customer_name LIKE ?
    LIMIT 6
  `).all(clean, clean) as any[];

  return {
    products,
    sales,
  };
}

// Settings
export function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settingsObj: Record<string, string> = {};
  for (const r of rows) {
    settingsObj[r.key] = r.value;
  }
  return settingsObj;
}

export function updateSettings(newSettings: Record<string, string>, adminEmail: string) {
  const now = getISTTimestamp();
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const [k, v] of Object.entries(newSettings)) {
      upsert.run(k, String(v), now);
    }

    db.prepare(`
      INSERT INTO audit_logs (
        id, action, entity_type, entity_id, reason, performed_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      'SETTINGS_UPDATED',
      'SETTINGS',
      'global_settings',
      'Business configuration updated',
      adminEmail,
      now
    );

    db.exec('COMMIT;');
    return getSettings();
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function getCategories() {
  const rows = db.prepare('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category ASC').all() as any[];
  return rows.map((r, idx) => ({ id: `cat_${idx}`, name: r.category }));
}

export function createCategory(name: string, adminEmail: string = 'admin@akenterprises.com') {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name cannot be blank.');
  const now = getISTTimestamp();
  const id = 'cat_' + crypto.randomUUID().slice(0, 8);
  
  db.prepare(`
    INSERT INTO audit_logs (
      id, action, entity_type, entity_id, new_value, reason, performed_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    'CATEGORY_CREATED',
    'CATEGORY',
    id,
    JSON.stringify({ name: trimmed }),
    `New category registered: "${trimmed}"`,
    adminEmail,
    now
  );

  return { id, name: trimmed };
}
