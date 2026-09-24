import crypto from 'node:crypto';
import {
  firestore,
  getISTTimestamp,
  hashPassword,
  verifyPassword,
} from './firebaseDb.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';

export interface ProductInput {
  sku?: string;
  name: string;
  category?: string;
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

// ----------------- IN-MEMORY PERFORMANCE CACHES -----------------
interface CachedSession {
  admin: { id: string; email: string; name: string; role: string };
  cachedUntil: number;
}
const sessionCache = new Map<string, CachedSession>();

let memoryProducts: any[] | null = null;
let memoryProductsTime = 0;
const PRODUCTS_CACHE_TTL = 45 * 1000; // 45 seconds

let memoryCategories: any[] | null = null;
let memoryCategoriesTime = 0;

let memorySettings: any | null = null;
let memorySettingsTime = 0;

let memorySales: any[] | null = null;
let memorySalesTime = 0;
const SALES_CACHE_TTL = 30 * 1000; // 30 seconds

let memoryAuditLogs: any[] = [];
let memoryAuditLogsLoaded = false;

let lastTxDate = '';
let lastTxSeq = 0;

export function invalidateProductsCache() {
  memoryProducts = null;
  memoryProductsTime = 0;
}

export function invalidateSalesCache() {
  memorySales = null;
  memorySalesTime = 0;
}

// ----------------- TRANSACTION NUMBER GENERATOR -----------------
export async function generateTransactionNumber(): Promise<string> {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const yyyy = ist.getFullYear();
  const mm = String(ist.getMonth() + 1).padStart(2, '0');
  const dd = String(ist.getDate()).padStart(2, '0');
  const datePrefix = `SALE-${yyyy}${mm}${dd}`;

  if (lastTxDate === datePrefix && lastTxSeq > 0) {
    lastTxSeq++;
    return `${datePrefix}-${String(lastTxSeq).padStart(4, '0')}`;
  }

  try {
    const salesSnap = await getDocs(
      query(collection(firestore, 'sales'), orderBy('created_at', 'desc'), firestoreLimit(50))
    );
    let maxSeq = 0;
    salesSnap.forEach((d) => {
      const data = d.data();
      if (data.transaction_number && data.transaction_number.startsWith(datePrefix)) {
        const parts = data.transaction_number.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });
    lastTxDate = datePrefix;
    lastTxSeq = maxSeq + 1;
    return `${datePrefix}-${String(lastTxSeq).padStart(4, '0')}`;
  } catch {
    lastTxDate = datePrefix;
    lastTxSeq = Math.floor(1000 + Math.random() * 9000);
    return `${datePrefix}-${String(lastTxSeq).padStart(4, '0')}`;
  }
}

// ----------------- AUTHENTICATION & SESSIONS -----------------
export async function authenticateAdmin(email: string, pass: string) {
  const adminsSnap = await getDocs(collection(firestore, 'admins'));
  let matchedAdmin: any = null;

  adminsSnap.forEach((d) => {
    const data = d.data();
    if (data.email && data.email.toLowerCase() === email.trim().toLowerCase()) {
      if (data.password_hash && verifyPassword(pass, data.password_hash)) {
        matchedAdmin = { id: d.id, ...data };
      } else if (!matchedAdmin) {
        matchedAdmin = { id: d.id, ...data };
      }
    }
  });

  if (!matchedAdmin || !matchedAdmin.password_hash || !verifyPassword(pass, matchedAdmin.password_hash)) {
    throw new Error('Invalid email or password.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = getISTTimestamp();

  await setDoc(doc(firestore, 'sessions', token), {
    token,
    admin_id: matchedAdmin.id,
    email: matchedAdmin.email,
    name: matchedAdmin.name,
    role: matchedAdmin.role,
    expires_at: expiresAt,
    created_at: now,
  });

  const adminObj = {
    id: matchedAdmin.id,
    email: matchedAdmin.email,
    name: matchedAdmin.name,
    role: matchedAdmin.role,
  };

  // Cache in-memory for instant subsequent requests
  sessionCache.set(token, {
    admin: adminObj,
    cachedUntil: Date.now() + 10 * 60 * 1000,
  });

  logAuditEvent({
    action: 'LOGIN',
    entity_type: 'AUTH',
    entity_id: matchedAdmin.id,
    reason: 'Administrator logged in successfully',
    performed_by: matchedAdmin.email,
  }).catch(() => {});

  return {
    token,
    admin: adminObj,
  };
}

export async function verifySessionToken(token: string) {
  if (!token) return null;
  const now = Date.now();
  const cached = sessionCache.get(token);
  if (cached && cached.cachedUntil > now) {
    return cached.admin;
  }

  const snap = await getDoc(doc(firestore, 'sessions', token));
  if (!snap.exists()) {
    sessionCache.delete(token);
    return null;
  }
  const data = snap.data();
  if (new Date(data.expires_at).getTime() < now) {
    deleteDoc(doc(firestore, 'sessions', token)).catch(() => {});
    sessionCache.delete(token);
    return null;
  }

  const adminObj = {
    id: data.admin_id,
    email: data.email,
    name: data.name,
    role: data.role,
  };

  // Cache session for 5 minutes in memory
  sessionCache.set(token, {
    admin: adminObj,
    cachedUntil: now + 5 * 60 * 1000,
  });

  return adminObj;
}

export async function logoutSession(token: string, adminEmail?: string) {
  if (token) {
    sessionCache.delete(token);
    deleteDoc(doc(firestore, 'sessions', token)).catch(() => {});
  }
  if (adminEmail) {
    await logAuditEvent({
      action: 'LOGOUT',
      entity_type: 'AUTH',
      entity_id: 'session',
      reason: 'Administrator logged out',
      performed_by: adminEmail,
    });
  }
}

export async function changeAdminPassword(adminId: string, currentPass: string, newPass: string, email: string) {
  const adminRef = doc(firestore, 'admins', adminId);
  const snap = await getDoc(adminRef);
  if (!snap.exists()) throw new Error('Admin not found.');
  const adminData = snap.data();
  if (!verifyPassword(currentPass, adminData.password_hash)) {
    throw new Error('Current password does not match.');
  }

  const { hash } = hashPassword(newPass);
  await updateDoc(adminRef, { password_hash: hash });

  await logAuditEvent({
    action: 'PASSWORD_CHANGED',
    entity_type: 'AUTH',
    entity_id: adminId,
    reason: 'Admin credentials updated',
    performed_by: email,
  });
}

// ----------------- GOOGLE AUTH SINGLE-ACCOUNT LOCK -----------------
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  const start = local.slice(0, 2);
  const end = local.length > 4 ? local.slice(-2) : local.slice(-1);
  return `${start}***${end}@${domain}`;
}

export async function getGoogleAuthStatus() {
  const docRef = doc(firestore, 'settings', 'google_auth');
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return {
      isRegistered: false,
      authorizedEmailMasked: null,
      authorizedName: null,
      registeredAt: null,
    };
  }
  const data = snap.data();
  if (!data.authorized_email) {
    return {
      isRegistered: false,
      authorizedEmailMasked: null,
      authorizedName: null,
      registeredAt: null,
    };
  }
  return {
    isRegistered: true,
    authorizedEmailMasked: maskEmail(data.authorized_email),
    authorizedName: data.authorized_name || null,
    registeredAt: data.registered_at || null,
  };
}

export async function getAdminGoogleAuthDetails() {
  const docRef = doc(firestore, 'settings', 'google_auth');
  const snap = await getDoc(docRef);
  if (!snap.exists() || !snap.data().authorized_email) {
    return {
      isRegistered: false,
      authorizedEmail: null,
      authorizedUid: null,
      authorizedName: null,
      registeredAt: null,
      lastLoginAt: null,
      status: 'UNREGISTERED',
    };
  }
  const data = snap.data();
  return {
    isRegistered: true,
    authorizedEmail: data.authorized_email,
    authorizedUid: data.authorized_uid,
    authorizedName: data.authorized_name,
    registeredAt: data.registered_at,
    lastLoginAt: data.last_login_at,
    status: data.status || 'LOCKED_PRIMARY',
  };
}

export async function authenticateGoogleAdmin(payload: {
  email: string;
  name?: string;
  uid: string;
  photoUrl?: string;
}) {
  const rawEmail = payload.email?.trim();
  if (!rawEmail || !payload.uid) {
    throw new Error('Google account details (email and UID) are required.');
  }

  const normalizedEmail = rawEmail.toLowerCase();
  const googleAuthRef = doc(firestore, 'settings', 'google_auth');
  const googleAuthSnap = await getDoc(googleAuthRef);
  const now = getISTTimestamp();

  let matchedAdminId = '';
  let matchedAdminName = payload.name || normalizedEmail.split('@')[0];
  let matchedAdminRole = 'superadmin';
  let isFirstRegistration = false;

  if (!googleAuthSnap.exists() || !googleAuthSnap.data().authorized_email) {
    // ---------------------------------------------------------
    // FIRST TIME GOOGLE LOGIN: LOCK THIS ACCOUNT AS SOLE OWNER!
    // ---------------------------------------------------------
    isFirstRegistration = true;
    await setDoc(googleAuthRef, {
      authorized_email: normalizedEmail,
      authorized_uid: payload.uid,
      authorized_name: matchedAdminName,
      authorized_photo: payload.photoUrl || '',
      registered_at: now,
      last_login_at: now,
      status: 'LOCKED_PRIMARY',
      notes: 'First Google account permanently registered. All subsequent Google logins from different accounts will be rejected.',
    });

    // Ensure superadmin record exists in admins collection
    const adminsSnap = await getDocs(collection(firestore, 'admins'));
    let existingAdmin: any = null;
    adminsSnap.forEach((d) => {
      const data = d.data();
      if (data.email && data.email.toLowerCase() === normalizedEmail) {
        existingAdmin = { id: d.id, ...data };
      }
    });

    if (existingAdmin) {
      matchedAdminId = existingAdmin.id;
      matchedAdminName = existingAdmin.name || matchedAdminName;
      matchedAdminRole = existingAdmin.role || 'superadmin';
      await updateDoc(doc(firestore, 'admins', existingAdmin.id), {
        google_uid: payload.uid,
        auth_provider: 'google',
        role: 'superadmin',
        updated_at: now,
      });
    } else {
      matchedAdminId = `admin_google_${payload.uid.slice(0, 16)}`;
      await setDoc(doc(firestore, 'admins', matchedAdminId), {
        id: matchedAdminId,
        email: normalizedEmail,
        name: matchedAdminName,
        role: 'superadmin',
        auth_provider: 'google',
        google_uid: payload.uid,
        created_at: now,
      });
    }

    await logAuditEvent({
      action: 'FIRST_GOOGLE_ADMIN_REGISTERED',
      entity_type: 'AUTH',
      entity_id: normalizedEmail,
      reason: `First Google account registered and locked as exclusive Google Owner: ${normalizedEmail}`,
      performed_by: normalizedEmail,
    });
  } else {
    // ---------------------------------------------------------
    // SUBSEQUENT GOOGLE LOGIN: VERIFY AGAINST LOCKED ACCOUNT
    // ---------------------------------------------------------
    const existingGoogleAuth = googleAuthSnap.data();
    const authorizedEmail = (existingGoogleAuth.authorized_email || '').toLowerCase().trim();
    const authorizedUid = existingGoogleAuth.authorized_uid;

    if (normalizedEmail !== authorizedEmail && payload.uid !== authorizedUid) {
      // SECURITY REJECTION: Different Google account!
      await logAuditEvent({
        action: 'UNAUTHORIZED_GOOGLE_LOGIN_BLOCKED',
        entity_type: 'SECURITY',
        entity_id: normalizedEmail,
        reason: `Blocked unauthorized Google login attempt from ${normalizedEmail}. Only primary registered account (${authorizedEmail}) is authorized.`,
        performed_by: normalizedEmail,
      });

      const masked = maskEmail(authorizedEmail);
      throw new Error(
        `अस्वीकृत (Access Denied): इस वेबसाइट पर केवल पहला पंजीकृत Google खाता (${masked}) ही लॉगिन कर सकता है। यह खाता "${normalizedEmail}" अधिकृत नहीं है। (Only the first registered Google account is permitted to access this website)`
      );
    }

    // Authorized Google Account: proceed!
    await updateDoc(googleAuthRef, {
      last_login_at: now,
      authorized_name: matchedAdminName,
      ...(payload.photoUrl ? { authorized_photo: payload.photoUrl } : {}),
    });

    const adminsSnap = await getDocs(collection(firestore, 'admins'));
    let existingAdmin: any = null;
    adminsSnap.forEach((d) => {
      const data = d.data();
      if (
        (data.email && data.email.toLowerCase() === normalizedEmail) ||
        data.google_uid === payload.uid
      ) {
        existingAdmin = { id: d.id, ...data };
      }
    });

    if (existingAdmin) {
      matchedAdminId = existingAdmin.id;
      matchedAdminName = existingAdmin.name || matchedAdminName;
      matchedAdminRole = existingAdmin.role || 'superadmin';
    } else {
      matchedAdminId = `admin_google_${payload.uid.slice(0, 16)}`;
      await setDoc(doc(firestore, 'admins', matchedAdminId), {
        id: matchedAdminId,
        email: normalizedEmail,
        name: matchedAdminName,
        role: 'superadmin',
        auth_provider: 'google',
        google_uid: payload.uid,
        created_at: now,
      });
    }
  }

  // Create session
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await setDoc(doc(firestore, 'sessions', token), {
    token,
    admin_id: matchedAdminId,
    email: normalizedEmail,
    name: matchedAdminName,
    role: matchedAdminRole,
    auth_provider: 'google',
    expires_at: expiresAt,
    created_at: now,
  });

  await logAuditEvent({
    action: 'LOGIN',
    entity_type: 'AUTH',
    entity_id: matchedAdminId,
    reason: isFirstRegistration
      ? `Primary Google Administrator registered and signed in (${normalizedEmail})`
      : `Primary Google Administrator logged in (${normalizedEmail})`,
    performed_by: normalizedEmail,
  });

  return {
    token,
    admin: {
      id: matchedAdminId,
      email: normalizedEmail,
      name: matchedAdminName,
      role: matchedAdminRole,
    },
    isFirstRegistration,
  };
}

export async function resetGoogleAuthLock(adminId: string, currentPass: string, adminEmail: string) {
  const adminRef = doc(firestore, 'admins', adminId);
  const snap = await getDoc(adminRef);
  if (!snap.exists()) throw new Error('Admin not found.');
  const adminData = snap.data();
  if (adminData.password_hash && !verifyPassword(currentPass, adminData.password_hash)) {
    throw new Error('Current password does not match. Password verification required.');
  }

  const googleAuthRef = doc(firestore, 'settings', 'google_auth');
  const googleAuthSnap = await getDoc(googleAuthRef);
  const prevEmail = googleAuthSnap.exists() ? googleAuthSnap.data().authorized_email : 'none';

  await deleteDoc(googleAuthRef);

  await logAuditEvent({
    action: 'GOOGLE_AUTH_RESET',
    entity_type: 'SECURITY',
    entity_id: 'google_auth',
    reason: `Google primary account lock was reset by ${adminEmail} (previous locked account: ${prevEmail}). The next Google sign-in will register as the new primary owner.`,
    performed_by: adminEmail,
  });

  return { success: true, message: 'Google account lock reset successfully. The next Google account to sign in will become the new authorized primary account.' };
}

// ----------------- AUDIT LOG HELPER -----------------
export async function logAuditEvent(params: {
  action: string;
  entity_type: string;
  entity_id: string;
  product_id?: string | null;
  product_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  quantity_difference?: number | null;
  previous_stock?: number | null;
  new_stock?: number | null;
  reason: string;
  performed_by: string;
  transaction_id?: string | null;
}) {
  const id = crypto.randomUUID();
  const now = getISTTimestamp();
  const logEntry = {
    id,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    product_id: params.product_id || null,
    product_name: params.product_name || null,
    old_value: params.old_value !== undefined ? params.old_value : null,
    new_value: params.new_value !== undefined ? params.new_value : null,
    quantity_difference: params.quantity_difference !== undefined ? params.quantity_difference : null,
    previous_stock: params.previous_stock !== undefined ? params.previous_stock : null,
    new_stock: params.new_stock !== undefined ? params.new_stock : null,
    reason: params.reason,
    performed_by: params.performed_by,
    transaction_id: params.transaction_id || null,
    created_at: now,
  };

  // Add to in-memory buffer immediately for instantaneous audit queries
  memoryAuditLogs.unshift(logEntry);
  if (memoryAuditLogs.length > 250) {
    memoryAuditLogs = memoryAuditLogs.slice(0, 250);
  }

  // Persist to firestore asynchronously without blocking the user response
  setDoc(doc(firestore, 'audit_logs', id), logEntry).catch((err) => {
    console.error('Audit log write error:', err);
  });
}

// ----------------- PRODUCTS / INVENTORY -----------------
export async function getProducts(filters?: { category?: string; status?: string; search?: string }) {
  const now = Date.now();
  if (!memoryProducts || now - memoryProductsTime > PRODUCTS_CACHE_TTL) {
    const snap = await getDocs(collection(firestore, 'products'));
    const items: any[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() });
    });
    memoryProducts = items;
    memoryProductsTime = now;
  }

  let items = [...memoryProducts];

  if (filters?.category && filters.category !== 'ALL') {
    items = items.filter((p) => p.category === filters.category);
  }
  if (filters?.status && filters.status !== 'ALL') {
    items = items.filter((p) => p.status === filters.status);
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    items = items.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.supplier_name && p.supplier_name.toLowerCase().includes(q))
    );
  }

  // Sort by name
  items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return items.map((p) => {
    let stock_status = 'IN_STOCK';
    const currQty = Number(p.current_quantity) || 0;
    const minStock = Number(p.minimum_stock) || 0;
    if (currQty <= 0) {
      stock_status = 'OUT_OF_STOCK';
    } else if (currQty <= minStock) {
      stock_status = 'LOW_STOCK';
    }
    return {
      ...p,
      stock_status,
    };
  });
}

export async function createProduct(input: ProductInput, adminEmail: string) {
  if (!input.name || !input.name.trim()) throw new Error('Product name is required.');
  let cleanSku = (input.sku || '').trim().toUpperCase();
  if (!cleanSku) {
    cleanSku = 'ITEM-' + Math.floor(1000 + Math.random() * 9000);
  }

  // Fast in-memory check for existing SKU
  if (memoryProducts) {
    const exists = memoryProducts.some((p) => p.sku && p.sku.toUpperCase() === cleanSku);
    if (exists) {
      throw new Error(`This Item code/SKU already exists: ${cleanSku}`);
    }
  }

  const openingQty = Number(input.opening_quantity) || 0;
  if (openingQty < 0) throw new Error('Opening quantity cannot be negative.');

  const minStock = Number(input.minimum_stock) >= 0 ? Number(input.minimum_stock) : 5;
  const purchasePrice = Number(input.purchase_price) || 0;
  const sellingPrice = Number(input.selling_price) || 0;

  const id = 'prod_' + crypto.randomUUID().slice(0, 8);
  const now = getISTTimestamp();

  const productData = {
    id,
    sku: cleanSku,
    name: input.name.trim(),
    category: (input.category || '').trim() || 'General',
    unit: (input.unit || '').trim() || 'Piece',
    opening_quantity: openingQty,
    current_quantity: openingQty,
    minimum_stock: minStock,
    purchase_price: purchasePrice,
    selling_price: sellingPrice,
    supplier_name: input.supplier_name?.trim() || null,
    description: input.description?.trim() || null,
    status: input.status || 'ACTIVE',
    created_at: now,
    updated_at: now,
  };

  // Immediate write to Firestore
  await setDoc(doc(firestore, 'products', id), productData);

  // Update in-memory products cache immediately for 0ms response
  if (memoryProducts) {
    memoryProducts.unshift(productData);
    memoryProductsTime = Date.now();
  } else {
    invalidateProductsCache();
  }

  if (openingQty > 0) {
    const movId = 'mov_' + crypto.randomUUID().slice(0, 8);
    setDoc(doc(firestore, 'stock_movements', movId), {
      id: movId,
      product_id: id,
      product_name: productData.name,
      product_sku: productData.sku,
      unit: productData.unit,
      movement_type: 'OPENING_STOCK',
      quantity: openingQty,
      previous_quantity: 0,
      new_quantity: openingQty,
      reference_type: 'INITIAL',
      reference_id: id,
      reason: 'Opening stock set during product creation',
      notes: 'Initial inventory quantity',
      created_by: adminEmail,
      created_at: now,
    }).catch((err) => console.error('Stock movement save error:', err));
  }

  logAuditEvent({
    action: 'PRODUCT_CREATED',
    entity_type: 'PRODUCT',
    entity_id: id,
    product_id: id,
    product_name: productData.name,
    old_value: null,
    new_value: JSON.stringify({
      name: productData.name,
      sku: productData.sku,
      category: productData.category,
      unit: productData.unit,
      selling_price: productData.selling_price,
      purchase_price: productData.purchase_price,
      opening_quantity: openingQty,
      minimum_stock: minStock,
    }),
    quantity_difference: openingQty,
    previous_stock: 0,
    new_stock: openingQty,
    reason: `New product added: "${productData.name}" (Code: ${productData.sku}, Rate: ₹${productData.selling_price}, Opening Stock: ${openingQty} ${productData.unit})`,
    performed_by: adminEmail,
  }).catch(() => {});

  return { ...productData, stock_status: openingQty <= 0 ? 'OUT_OF_STOCK' : openingQty <= minStock ? 'LOW_STOCK' : 'IN_STOCK' };
}

export async function getProductDetails(productId: string) {
  const prodDoc = await getDoc(doc(firestore, 'products', productId));
  if (!prodDoc.exists()) return null;
  const product = { id: prodDoc.id, ...prodDoc.data() } as any;

  // Recent movements
  const movSnap = await getDocs(collection(firestore, 'stock_movements'));
  let movements: any[] = [];
  movSnap.forEach((d) => {
    const data = d.data();
    if (data.product_id === productId) {
      movements.push({ id: d.id, ...data });
    }
  });
  movements.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  movements = movements.slice(0, 20);

  // Recent sales
  const salesSnap = await getDocs(collection(firestore, 'sales'));
  let sales: any[] = [];
  salesSnap.forEach((d) => {
    const s = d.data();
    if (s.items && Array.isArray(s.items)) {
      const matchItem = s.items.find((it: any) => it.product_id === productId);
      if (matchItem) {
        sales.push({
          sale_id: d.id,
          transaction_number: s.transaction_number,
          customer_name: s.customer_name,
          customer_phone: s.customer_phone || null,
          customer_address: s.customer_address || null,
          payment_method: s.payment_method,
          status: s.status,
          created_at: s.created_at,
          quantity: matchItem.quantity,
          unit: matchItem.unit,
          selling_price: matchItem.selling_price,
          total_amount: matchItem.total_amount,
        });
      }
    }
  });
  sales.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  sales = sales.slice(0, 20);

  let stock_status = 'IN_STOCK';
  const currQty = Number(product.current_quantity ?? 0);
  const minStock = Number(product.minimum_stock ?? 0);
  if (currQty <= 0) stock_status = 'OUT_OF_STOCK';
  else if (currQty <= minStock) stock_status = 'LOW_STOCK';

  const totalAdded = movements
    .filter((m: any) => m.movement_type === 'STOCK_ADDED')
    .reduce((acc: number, m: any) => acc + (Number(m.quantity) || 0), 0);

  const totalSold = movements
    .filter((m: any) => m.movement_type === 'SALE_CREATED')
    .reduce((acc: number, m: any) => acc + Math.abs(Number(m.quantity) || 0), 0);

  const totalRevenue = sales
    .filter((s: any) => s.status !== 'CANCELLED')
    .reduce((acc: number, s: any) => acc + (Number(s.total_amount) || 0), 0);

  const fullProduct = {
    ...product,
    current_quantity: currQty,
    minimum_stock: minStock,
    stock_status,
  };

  return {
    product: fullProduct,
    ...fullProduct,
    stats: {
      totalAdded,
      totalSold,
      totalRevenue,
      totalTransactions: sales.filter((s: any) => s.status !== 'CANCELLED').length,
      salesCount: sales.filter((s: any) => s.status !== 'CANCELLED').length,
    },
    recentMovements: movements,
    movements,
    recentSales: sales,
    sales,
  };
}

export async function updateProduct(productId: string, input: Partial<ProductInput>, adminEmail: string) {
  const prodRef = doc(firestore, 'products', productId);
  const snap = await getDoc(prodRef);
  if (!snap.exists()) throw new Error('Product not found.');
  const existing = snap.data() as any;

  const now = getISTTimestamp();
  const updates: any = { updated_at: now };

  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error('Product name cannot be empty.');
    updates.name = input.name.trim();
  }
  if (input.sku !== undefined && input.sku.trim()) {
    updates.sku = input.sku.trim().toUpperCase();
  }
  if (input.category !== undefined) {
    updates.category = input.category.trim() || 'General';
  }
  if (input.unit !== undefined) {
    updates.unit = input.unit.trim() || 'Piece';
  }
  if (input.selling_price !== undefined) {
    const sp = Number(input.selling_price);
    if (isNaN(sp) || sp < 0) throw new Error('Selling price must be a non-negative number.');
    updates.selling_price = sp;
  }
  if (input.purchase_price !== undefined) {
    const pp = Number(input.purchase_price);
    if (isNaN(pp) || pp < 0) throw new Error('Purchase price must be a non-negative number.');
    updates.purchase_price = pp;
  }
  if (input.minimum_stock !== undefined) {
    const ms = Number(input.minimum_stock);
    if (isNaN(ms) || ms < 0) throw new Error('Minimum stock alert must be a non-negative number.');
    updates.minimum_stock = ms;
  }
  if (input.supplier_name !== undefined) {
    updates.supplier_name = input.supplier_name.trim();
  }
  if (input.description !== undefined) {
    updates.description = input.description.trim();
  }
  if (input.current_quantity !== undefined) {
    const cq = Number(input.current_quantity);
    if (isNaN(cq) || cq < 0) throw new Error('Current quantity must be a non-negative number.');
    updates.current_quantity = cq;
  }
  if (input.status !== undefined) {
    updates.status = input.status;
  }

  const oldQty = Number(existing.current_quantity ?? 0);
  const newQty = updates.current_quantity !== undefined ? Number(updates.current_quantity) : oldQty;
  const qtyDiff = newQty - oldQty;

  // Immediate write to Firestore
  await updateDoc(prodRef, updates);

  // Compute updated product in-memory to eliminate redundant getDoc round-trip
  const updatedData = { ...existing, ...updates, id: productId };
  if (memoryProducts) {
    memoryProducts = memoryProducts.map((p) => (p.id === productId ? updatedData : p));
    memoryProductsTime = Date.now();
  }

  // If quantity was changed, record stock movement asynchronously
  if (updates.current_quantity !== undefined && qtyDiff !== 0) {
    const movId = 'mov_' + crypto.randomUUID().slice(0, 8);
    setDoc(doc(firestore, 'stock_movements', movId), {
      id: movId,
      product_id: productId,
      product_name: updates.name || existing.name,
      product_sku: updates.sku || existing.sku,
      unit: updates.unit || existing.unit,
      movement_type: 'STOCK_ADJUSTED',
      quantity: Math.abs(qtyDiff),
      previous_quantity: oldQty,
      new_quantity: newQty,
      reference_type: 'MANUAL_EDIT',
      reference_id: movId,
      reason: `Stock quantity manually edited: ${oldQty} → ${newQty} (${qtyDiff >= 0 ? '+' : ''}${qtyDiff} ${updates.unit || existing.unit})`,
      notes: 'Updated via Edit Product modal',
      created_by: adminEmail,
      created_at: now,
    }).catch((err) => console.error('Stock adjustment save error:', err));
  }

  // Build human-readable change notes
  const changeNotes: string[] = [];
  if (updates.name && updates.name !== existing.name) {
    changeNotes.push(`Name: "${existing.name}" → "${updates.name}"`);
  }
  if (updates.current_quantity !== undefined && newQty !== oldQty) {
    changeNotes.push(`Stock Quantity: ${oldQty} → ${newQty} ${updates.unit || existing.unit} (${qtyDiff >= 0 ? '+' : ''}${qtyDiff})`);
  }
  if (updates.selling_price !== undefined && Number(updates.selling_price) !== Number(existing.selling_price)) {
    changeNotes.push(`Selling Price: ₹${existing.selling_price} → ₹${updates.selling_price}`);
  }
  if (updates.purchase_price !== undefined && Number(updates.purchase_price) !== Number(existing.purchase_price)) {
    changeNotes.push(`Cost Price: ₹${existing.purchase_price} → ₹${updates.purchase_price}`);
  }
  if (updates.minimum_stock !== undefined && Number(updates.minimum_stock) !== Number(existing.minimum_stock)) {
    changeNotes.push(`Min Stock Alert: ${existing.minimum_stock} → ${updates.minimum_stock}`);
  }
  if (updates.unit !== undefined && updates.unit !== existing.unit) {
    changeNotes.push(`Unit: ${existing.unit} → ${updates.unit}`);
  }
  if (updates.category !== undefined && updates.category !== existing.category) {
    changeNotes.push(`Category: "${existing.category}" → "${updates.category}"`);
  }
  if (updates.supplier_name !== undefined && updates.supplier_name !== (existing.supplier_name || '')) {
    changeNotes.push(`Supplier: "${existing.supplier_name || 'None'}" → "${updates.supplier_name}"`);
  }
  if (updates.sku && updates.sku !== existing.sku) {
    changeNotes.push(`Code/SKU: ${existing.sku} → ${updates.sku}`);
  }

  const reason = changeNotes.length > 0
    ? `Product modified: ${changeNotes.join(' | ')}`
    : 'Product details updated by administrator';

  logAuditEvent({
    action: 'PRODUCT_UPDATED',
    entity_type: 'PRODUCT',
    entity_id: productId,
    product_id: productId,
    product_name: updates.name || existing.name,
    old_value: JSON.stringify({
      name: existing.name,
      sku: existing.sku,
      current_quantity: oldQty,
      selling_price: existing.selling_price,
      purchase_price: existing.purchase_price,
      minimum_stock: existing.minimum_stock,
      unit: existing.unit,
      category: existing.category,
      supplier_name: existing.supplier_name,
    }),
    new_value: JSON.stringify({
      name: updates.name || existing.name,
      sku: updates.sku || existing.sku,
      current_quantity: newQty,
      selling_price: updates.selling_price ?? existing.selling_price,
      purchase_price: updates.purchase_price ?? existing.purchase_price,
      minimum_stock: updates.minimum_stock ?? existing.minimum_stock,
      unit: updates.unit ?? existing.unit,
      category: updates.category ?? existing.category,
      supplier_name: updates.supplier_name ?? existing.supplier_name,
    }),
    quantity_difference: qtyDiff !== 0 ? qtyDiff : undefined,
    previous_stock: oldQty,
    new_stock: newQty,
    reason,
    performed_by: adminEmail,
  }).catch(() => {});

  let stock_status = 'IN_STOCK';
  if (updatedData.current_quantity <= 0) {
    stock_status = 'OUT_OF_STOCK';
  } else if (updatedData.current_quantity <= updatedData.minimum_stock) {
    stock_status = 'LOW_STOCK';
  }
  return { ...updatedData, stock_status };
}

export async function deleteProduct(productId: string, adminEmail: string) {
  const prodRef = doc(firestore, 'products', productId);
  const snap = await getDoc(prodRef);
  if (!snap.exists()) throw new Error('Product not found.');
  const existing = snap.data() as any;

  // Immediate delete from Firestore
  await deleteDoc(prodRef);

  // Update in-memory cache immediately
  if (memoryProducts) {
    memoryProducts = memoryProducts.filter((p) => p.id !== productId);
    memoryProductsTime = Date.now();
  }

  logAuditEvent({
    action: 'PRODUCT_DELETED',
    entity_type: 'PRODUCT',
    entity_id: productId,
    product_id: productId,
    product_name: existing.name,
    old_value: JSON.stringify(existing),
    new_value: null,
    quantity_difference: -Number(existing.current_quantity || 0),
    previous_stock: Number(existing.current_quantity || 0),
    new_stock: 0,
    reason: `Product deleted from catalog: "${existing.name}" (Code: ${existing.sku}, Rate: ₹${existing.selling_price}, Removed Stock: ${existing.current_quantity} ${existing.unit})`,
    performed_by: adminEmail,
  }).catch(() => {});

  return { success: true, message: `Product ${existing.name} deleted successfully.` };
}

// ----------------- STOCK INWARD & ADJUSTMENTS -----------------
export async function addStock(input: AddStockInput, adminEmail: string) {
  const qty = Number(input.quantityAdded);
  if (isNaN(qty) || qty <= 0) throw new Error('Quantity added must be a positive number.');

  const prodRef = doc(firestore, 'products', input.productId);
  const snap = await getDoc(prodRef);
  if (!snap.exists()) throw new Error('Product not found.');
  const product = snap.data() as any;

  const prevQty = product.current_quantity;
  const newQty = prevQty + qty;
  const now = getISTTimestamp();

  const prodUpdates: any = {
    current_quantity: newQty,
    updated_at: now,
  };
  if (input.purchasePrice !== undefined && Number(input.purchasePrice) > 0) {
    prodUpdates.purchase_price = Number(input.purchasePrice);
  }
  if (input.supplier && input.supplier.trim()) {
    prodUpdates.supplier_name = input.supplier.trim();
  }

  await updateDoc(prodRef, prodUpdates);

  // Update in-memory product cache immediately
  if (memoryProducts) {
    memoryProducts = memoryProducts.map((p) =>
      p.id === input.productId ? { ...p, ...prodUpdates } : p
    );
    memoryProductsTime = Date.now();
  }

  const movId = 'mov_' + crypto.randomUUID().slice(0, 8);
  setDoc(doc(firestore, 'stock_movements', movId), {
    id: movId,
    product_id: input.productId,
    product_name: product.name,
    product_sku: product.sku,
    unit: product.unit,
    movement_type: 'INWARD_PURCHASE',
    quantity: qty,
    previous_quantity: prevQty,
    new_quantity: newQty,
    reference_type: 'PURCHASE',
    reference_id: movId,
    reason: `Inward delivery received: +${qty} ${product.unit}`,
    notes: input.notes?.trim() || null,
    created_by: adminEmail,
    created_at: now,
  }).catch((err) => console.error('Stock movement error:', err));

  logAuditEvent({
    action: 'STOCK_ADDED',
    entity_type: 'STOCK',
    entity_id: movId,
    product_id: input.productId,
    product_name: product.name,
    old_value: `${prevQty} ${product.unit}`,
    new_value: `${newQty} ${product.unit}`,
    quantity_difference: qty,
    previous_stock: prevQty,
    new_stock: newQty,
    reason: `Inward purchase added: +${qty} ${product.unit}`,
    performed_by: adminEmail,
  }).catch(() => {});

  return {
    success: true,
    productId: input.productId,
    previous_quantity: prevQty,
    new_quantity: newQty,
    quantity_added: qty,
  };
}

export async function adjustStock(input: AdjustStockInput, adminEmail: string) {
  throw new Error('Manual stock adjustment or deletion is permanently disabled. Stock is only updated via verified sales or inward stock arrivals (स्टॉक डिलीट या एडजस्ट करना वर्जित है).');
}

// ----------------- SALES & BILLING -----------------
export async function createSale(input: SaleInput, adminEmail: string) {
  const qty = Number(input.quantity);
  if (isNaN(qty) || qty <= 0) throw new Error('Quantity must be greater than zero.');

  const prodRef = doc(firestore, 'products', input.productId);
  const snap = await getDoc(prodRef);
  if (!snap.exists()) throw new Error('Selected product not found in inventory.');
  const product = snap.data() as any;

  if (product.current_quantity < qty) {
    throw new Error(
      `Insufficient stock! Only ${product.current_quantity} ${product.unit} available for "${product.name}". Requested: ${qty}`
    );
  }

  const unitPrice = Number(input.sellingPrice);
  if (isNaN(unitPrice) || unitPrice < 0) throw new Error('Invalid selling price.');

  if (!input.customerName || !input.customerName.trim()) {
    throw new Error('Customer Name is mandatory. Please provide customer name (ग्राहक का नाम लिखना अनिवार्य है).');
  }

  if (!input.customerAddress || !input.customerAddress.trim()) {
    throw new Error('Customer Address is mandatory. Please provide customer address (ग्राहक का पता लिखना अनिवार्य है).');
  }

  const totalAmount = Math.round(qty * unitPrice * 100) / 100;
  const transactionNumber = await generateTransactionNumber();
  const saleId = 'sale_' + crypto.randomUUID().slice(0, 8);
  const now = getISTTimestamp();

  const prevStock = product.current_quantity;
  const newStock = prevStock - qty;

  // 1. Update product inventory in Firestore
  await updateDoc(prodRef, {
    current_quantity: newStock,
    updated_at: now,
  });

  // Update in-memory product cache immediately
  if (memoryProducts) {
    memoryProducts = memoryProducts.map((p) =>
      p.id === product.id ? { ...p, current_quantity: newStock, updated_at: now } : p
    );
    memoryProductsTime = Date.now();
  }

  // 2. Insert Sale document
  const saleData = {
    id: saleId,
    transaction_number: transactionNumber,
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone?.trim() || null,
    customer_address: input.customerAddress.trim(),
    payment_method: input.paymentMethod || 'Cash',
    total_amount: totalAmount,
    status: 'COMPLETED',
    notes: input.notes?.trim() || null,
    created_by: adminEmail,
    created_at: now,
    updated_at: now,
    cancelled_at: null,
    cancelled_reason: null,
    cancelled_by: null,
    items: [
      {
        id: 'item_' + crypto.randomUUID().slice(0, 8),
        sale_id: saleId,
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        category: product.category || 'General',
        quantity: qty,
        unit: product.unit,
        selling_price: unitPrice,
        purchase_price: product.purchase_price || 0,
        total_amount: totalAmount,
      },
    ],
  };

  await setDoc(doc(firestore, 'sales', saleId), saleData);

  // Update in-memory sales cache
  if (memorySales) {
    memorySales.unshift(saleData);
    memorySalesTime = Date.now();
  }

  // 3. Record stock movement & audit log asynchronously
  const movId = 'mov_' + crypto.randomUUID().slice(0, 8);
  setDoc(doc(firestore, 'stock_movements', movId), {
    id: movId,
    product_id: product.id,
    product_name: product.name,
    product_sku: product.sku,
    unit: product.unit,
    movement_type: 'SALE_CREATED',
    quantity: -qty,
    previous_quantity: prevStock,
    new_quantity: newStock,
    reference_type: 'SALE',
    reference_id: saleId,
    reason: `Sale ${transactionNumber}`,
    notes: `Sold to ${saleData.customer_name} via ${saleData.payment_method}`,
    created_by: adminEmail,
    created_at: now,
  }).catch((err) => console.error('Sale stock movement error:', err));

  logAuditEvent({
    action: 'SALE_CREATED',
    entity_type: 'SALE',
    entity_id: saleId,
    product_id: product.id,
    product_name: product.name,
    old_value: `${prevStock} ${product.unit}`,
    new_value: `${newStock} ${product.unit}`,
    quantity_difference: -qty,
    previous_stock: prevStock,
    new_stock: newStock,
    reason: `Sale executed for ${qty} ${product.unit} @ ₹${unitPrice}`,
    performed_by: adminEmail,
    transaction_id: transactionNumber,
  }).catch(() => {});

  return saleData;
}

async function getAllSalesCached() {
  const now = Date.now();
  if (memorySales && now - memorySalesTime < SALES_CACHE_TTL) {
    return memorySales;
  }
  const salesSnap = await getDocs(collection(firestore, 'sales'));
  const allSales: any[] = [];
  salesSnap.forEach((d) => {
    allSales.push({ id: d.id, ...d.data() });
  });
  memorySales = allSales;
  memorySalesTime = now;
  return allSales;
}

export async function getSales(params: {
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
  const allSales = await getAllSalesCached();
  let sales: any[] = [...allSales];

  // Filters
  if (params.status && params.status !== 'ALL') {
    sales = sales.filter((s) => s.status === params.status);
  }
  if (params.paymentMethod && params.paymentMethod !== 'ALL') {
    sales = sales.filter((s) => s.paymentMethod === params.paymentMethod || s.payment_method === params.paymentMethod);
  }
  if (params.productId && params.productId !== 'ALL') {
    sales = sales.filter((s) => s.items?.some((it: any) => it.product_id === params.productId));
  }
  if (params.category && params.category !== 'ALL') {
    const prods = await getProducts();
    const catMap = new Map<string, string>();
    prods.forEach((p) => {
      catMap.set(p.id, p.category || 'General');
    });

    sales = sales.filter((s) =>
      s.items?.some(
        (it: any) =>
          it.category === params.category ||
          it.product_category === params.category ||
          catMap.get(it.product_id) === params.category
      )
    );
  }
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    sales = sales.filter(
      (s) =>
        (s.transaction_number && s.transaction_number.toLowerCase().includes(q)) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
        (s.customer_phone && s.customer_phone.toLowerCase().includes(q)) ||
        (s.customer_address && s.customer_address.toLowerCase().includes(q)) ||
        s.items?.some((it: any) => it.product_name?.toLowerCase().includes(q) || it.product_sku?.toLowerCase().includes(q))
    );
  }

  // Date Filtering
  if (params.dateFilter && params.dateFilter !== 'ALL_TIME') {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(now.getTime() + istOffset).toISOString().split('T')[0];

    if (params.dateFilter === 'TODAY') {
      sales = sales.filter((s) => s.created_at?.startsWith(todayIST));
    } else if (params.dateFilter === 'YESTERDAY') {
      const yest = new Date(now.getTime() + istOffset - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      sales = sales.filter((s) => s.created_at?.startsWith(yest));
    } else if (params.dateFilter === 'THIS_WEEK') {
      const weekAgo = new Date(now.getTime() + istOffset - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      sales = sales.filter((s) => (s.created_at?.split('T')[0] || '') >= weekAgo);
    } else if (params.dateFilter === 'THIS_MONTH') {
      const monthPrefix = todayIST.substring(0, 7);
      sales = sales.filter((s) => s.created_at?.startsWith(monthPrefix));
    } else if (params.dateFilter === 'CUSTOM' && params.startDate && params.endDate) {
      sales = sales.filter((s) => {
        const d = s.created_at?.split('T')[0] || '';
        return d >= params.startDate! && d <= params.endDate!;
      });
    }
  }

  // Sort descending by created_at
  sales.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

  const total = sales.length;
  const page = params.page || 1;
  const limit = params.limit || 20;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;
  const paginated = sales.slice(offset, offset + limit);

  return {
    sales: paginated,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getSaleById(saleId: string) {
  if (memorySales) {
    const cached = memorySales.find((s) => s.id === saleId);
    if (cached) return cached;
  }
  const snap = await getDoc(doc(firestore, 'sales', saleId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateSale(saleId: string, input: EditSaleInput, adminEmail: string) {
  throw new Error('Sales bills cannot be edited. All transaction records and history are permanent (बिक्री बिल में बदलाव वर्जित है).');
}

export async function cancelSale(saleId: string, reason: string, adminEmail: string) {
  throw new Error('Sales bills cannot be cancelled. All transaction records and history are permanent (बिक्री बिल को रद्द करना वर्जित है).');
}

// ----------------- DASHBOARD METRICS -----------------
export async function getDashboardStats(dateRange = 'TODAY', customStart?: string, customEnd?: string) {
  const allActiveProducts = await getProducts();
  let totalProducts = 0;
  let totalPhysicalStock = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalInventoryValue = 0;

  const lowStockAlerts: any[] = [];

  for (const p of allActiveProducts) {
    if (p.status !== 'ARCHIVED') {
      totalProducts++;
      const currentQty = Number(p.current_quantity) || 0;
      const minStock = Number(p.minimum_stock) || 0;
      const purchasePrice = Number(p.purchase_price) || 0;

      totalPhysicalStock += currentQty;
      totalInventoryValue += currentQty * purchasePrice;

      if (currentQty <= 0) {
        outOfStockCount++;
        lowStockAlerts.push({ ...p, status_badge: 'OUT_OF_STOCK' });
      } else if (currentQty <= minStock) {
        lowStockCount++;
        lowStockAlerts.push({ ...p, status_badge: 'LOW_STOCK' });
      }
    }
  }

  // Low stock products array for dashboard cards & alerts
  const lowStockProducts = allActiveProducts
    .filter((p) => Number(p.current_quantity) <= Number(p.minimum_stock))
    .sort((a, b) => Number(a.current_quantity) - Number(b.current_quantity))
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      current_quantity: Number(p.current_quantity) || 0,
      minimum_stock: Number(p.minimum_stock) || 0,
      unit: p.unit,
      selling_price: Number(p.selling_price) || 0,
    }));

  // Fetch sales from fast in-memory cache
  const sales = await getAllSalesCached();
  const allCompletedSales: any[] = [];

  for (const s of sales) {
    if (s.status !== 'CANCELLED') {
      allCompletedSales.push(s);
    }
  }

  // Time boundaries in IST
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);

  const formatISTDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const todayStr = formatISTDate(ist);
  const todayStart = `${todayStr}T00:00:00.000+05:30`;
  const todayEnd = `${todayStr}T23:59:59.999+05:30`;

  // Compute today's metrics
  let todaySalesAmount = 0;
  let todayTransactionsCount = 0;
  let todayQuantitySold = 0;

  for (const s of allCompletedSales) {
    const createdAt = s.created_at || '';
    if (createdAt >= todayStart && createdAt <= todayEnd) {
      todayTransactionsCount++;
      todaySalesAmount += Number(s.total_amount) || 0;
      if (s.items && Array.isArray(s.items)) {
        for (const it of s.items) {
          todayQuantitySold += Number(it.quantity) || 0;
        }
      }
    }
  }

  // Determine selected date range boundaries
  let rangeStart = todayStart;
  let rangeEnd = todayEnd;

  switch (dateRange) {
    case 'TODAY':
      rangeStart = todayStart;
      rangeEnd = todayEnd;
      break;
    case 'YESTERDAY': {
      const yest = new Date(ist.getTime() - 24 * 60 * 60 * 1000);
      const yestStr = formatISTDate(yest);
      rangeStart = `${yestStr}T00:00:00.000+05:30`;
      rangeEnd = `${yestStr}T23:59:59.999+05:30`;
      break;
    }
    case 'LAST_7_DAYS': {
      const past = new Date(ist.getTime() - 6 * 24 * 60 * 60 * 1000);
      rangeStart = `${formatISTDate(past)}T00:00:00.000+05:30`;
      rangeEnd = todayEnd;
      break;
    }
    case 'THIS_MONTH': {
      const startOfMonth = new Date(ist.getFullYear(), ist.getMonth(), 1);
      rangeStart = `${formatISTDate(startOfMonth)}T00:00:00.000+05:30`;
      rangeEnd = todayEnd;
      break;
    }
    case 'PREVIOUS_MONTH': {
      const startOfPrevMonth = new Date(ist.getFullYear(), ist.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(ist.getFullYear(), ist.getMonth(), 0);
      rangeStart = `${formatISTDate(startOfPrevMonth)}T00:00:00.000+05:30`;
      rangeEnd = `${formatISTDate(endOfPrevMonth)}T23:59:59.999+05:30`;
      break;
    }
    case 'CUSTOM': {
      if (customStart && customEnd) {
        rangeStart = `${customStart}T00:00:00.000+05:30`;
        rangeEnd = `${customEnd}T23:59:59.999+05:30`;
      }
      break;
    }
    default:
      rangeStart = '1970-01-01T00:00:00.000+05:30';
      rangeEnd = '2099-12-31T23:59:59.999+05:30';
      break;
  }

  // Compute selected range metrics and top selling products
  let rangeSalesAmount = 0;
  let rangeTransactionsCount = 0;
  let rangeQuantitySold = 0;
  const rangeProductMap: Record<
    string,
    { id: string; name: string; sku: string; unit: string; total_sold_quantity: number; total_sales_amount: number }
  > = {};

  for (const s of allCompletedSales) {
    const createdAt = s.created_at || '';
    if (createdAt >= rangeStart && createdAt <= rangeEnd) {
      rangeTransactionsCount++;
      rangeSalesAmount += Number(s.total_amount) || 0;

      if (s.items && Array.isArray(s.items)) {
        for (const it of s.items) {
          const itQty = Number(it.quantity) || 0;
          const itAmt = Number(it.total_amount) || 0;
          rangeQuantitySold += itQty;

          const pid = it.product_id || it.sku || it.name;
          if (!rangeProductMap[pid]) {
            rangeProductMap[pid] = {
              id: it.product_id || pid,
              name: it.product_name || 'Product',
              sku: it.product_sku || '',
              unit: it.unit || 'Unit',
              total_sold_quantity: 0,
              total_sales_amount: 0,
            };
          }
          rangeProductMap[pid].total_sold_quantity += itQty;
          rangeProductMap[pid].total_sales_amount += itAmt;
        }
      }
    }
  }

  const topSellingProducts = Object.values(rangeProductMap)
    .sort((a, b) => b.total_sales_amount - a.total_sales_amount)
    .slice(0, 5)
    .map((p) => ({
      ...p,
      total_sold_quantity: Math.round(p.total_sold_quantity * 100) / 100,
      total_sales_amount: Math.round(p.total_sales_amount * 100) / 100,
    }));

  // Daily sales chart data for the last 7 days (IST)
  const last7DaysData: { date: string; amount: number; quantity: number; transactions: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(ist.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStr = formatISTDate(day);
    const start = `${dayStr}T00:00:00.000+05:30`;
    const end = `${dayStr}T23:59:59.999+05:30`;

    let dayAmt = 0;
    let dayQty = 0;
    let dayTx = 0;

    for (const s of allCompletedSales) {
      const createdAt = s.created_at || '';
      if (createdAt >= start && createdAt <= end) {
        dayTx++;
        dayAmt += Number(s.total_amount) || 0;
        if (s.items && Array.isArray(s.items)) {
          for (const it of s.items) {
            dayQty += Number(it.quantity) || 0;
          }
        }
      }
    }

    const shortDate = new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(day);

    last7DaysData.push({
      date: shortDate,
      amount: Math.round(dayAmt * 100) / 100,
      quantity: Math.round(dayQty * 100) / 100,
      transactions: dayTx,
    });
  }

  // Stock movement breakdown (limited to recent records)
  let recentMovements: any[] = [];
  const movTypeMap: Record<string, { count: number; total_qty: number }> = {};
  try {
    const movSnap = await getDocs(
      query(collection(firestore, 'stock_movements'), orderBy('created_at', 'desc'), firestoreLimit(25))
    );
    movSnap.forEach((d) => {
      const m = d.data();
      recentMovements.push({ id: d.id, ...m });
      const type = m.movement_type || 'UNKNOWN';
      if (!movTypeMap[type]) movTypeMap[type] = { count: 0, total_qty: 0 };
      movTypeMap[type].count++;
      movTypeMap[type].total_qty += Math.abs(Number(m.quantity) || 0);
    });
  } catch {
    const movSnap = await getDocs(collection(firestore, 'stock_movements'));
    movSnap.forEach((d) => {
      const m = d.data();
      recentMovements.push({ id: d.id, ...m });
      const type = m.movement_type || 'UNKNOWN';
      if (!movTypeMap[type]) movTypeMap[type] = { count: 0, total_qty: 0 };
      movTypeMap[type].count++;
      movTypeMap[type].total_qty += Math.abs(Number(m.quantity) || 0);
    });
    recentMovements.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }

  recentMovements = recentMovements.slice(0, 10);

  const movementBreakdown = Object.entries(movTypeMap).map(([movement_type, val]) => ({
    movement_type,
    count: val.count,
    total_qty: Math.round(val.total_qty * 100) / 100,
  }));

  // Recent sales
  const recentSales = [...allCompletedSales]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 8);

  const totalStockRounded = Math.round(totalPhysicalStock * 100) / 100;
  const inventoryValueRounded = Math.round(totalInventoryValue * 100) / 100;

  return {
    summary: {
      totalProducts,
      totalStock: totalStockRounded,
      totalPhysicalStock: totalStockRounded,
      lowStockCount,
      outOfStockCount,
      inventoryValue: inventoryValueRounded,
      totalInventoryValue: inventoryValueRounded,
      today: {
        salesAmount: Math.round(todaySalesAmount * 100) / 100,
        transactionsCount: todayTransactionsCount,
        quantitySold: Math.round(todayQuantitySold * 100) / 100,
      },
      selectedRange: {
        salesAmount: Math.round(rangeSalesAmount * 100) / 100,
        transactionsCount: rangeTransactionsCount,
        quantitySold: Math.round(rangeQuantitySold * 100) / 100,
      },
      totalSalesRevenue: Math.round(rangeSalesAmount * 100) / 100,
      totalSalesCount: rangeTransactionsCount,
      totalQuantitySold: Math.round(rangeQuantitySold * 100) / 100,
    },
    lowStockProducts,
    lowStockAlerts: lowStockAlerts.slice(0, 6),
    topSellingProducts,
    salesChart: last7DaysData,
    movementBreakdown,
    recentMovements,
    recentSales,
  };
}

// ----------------- DAILY MANAGEMENT -----------------
export async function getDailyManagement(selectedDate?: string) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const todayIST = new Date(now.getTime() + istOffset).toISOString().split('T')[0];
  const dateStr = selectedDate || todayIST;

  // Sales for this day
  const salesSnap = await getDocs(collection(firestore, 'sales'));
  let daySales: any[] = [];
  salesSnap.forEach((d) => {
    const s = d.data();
    if (s.created_at?.startsWith(dateStr) && s.status !== 'CANCELLED') {
      daySales.push(s);
    }
  });

  let totalTransactions = daySales.length;
  let totalSalesAmount = 0;
  let totalQuantitySold = 0;
  const paymentMap: Record<string, { count: number; amount: number }> = {};
  const productMap: Record<string, { name: string; sku: string; unit: string; qty: number; total: number }> = {};

  for (const s of daySales) {
    const amt = Number(s.total_amount) || 0;
    totalSalesAmount += amt;

    const pm = s.payment_method || 'Cash';
    if (!paymentMap[pm]) paymentMap[pm] = { count: 0, amount: 0 };
    paymentMap[pm].count++;
    paymentMap[pm].amount += amt;

    if (s.items && Array.isArray(s.items)) {
      for (const it of s.items) {
        totalQuantitySold += Number(it.quantity) || 0;
        const pKey = it.product_id;
        if (!productMap[pKey]) {
          productMap[pKey] = {
            name: it.product_name,
            sku: it.product_sku,
            unit: it.unit,
            qty: 0,
            total: 0,
          };
        }
        productMap[pKey].qty += Number(it.quantity) || 0;
        productMap[pKey].total += Number(it.total_amount) || 0;
      }
    }
  }

  // Movements for this day
  const movSnap = await getDocs(collection(firestore, 'stock_movements'));
  let dayMovements: any[] = [];
  let stockAdded = 0;
  let stockSold = 0;
  let stockAdjustments = 0;

  movSnap.forEach((d) => {
    const m = d.data();
    if (m.created_at?.startsWith(dateStr)) {
      dayMovements.push({ id: d.id, ...m });
      const q = Number(m.quantity) || 0;
      if (m.movement_type === 'INWARD_PURCHASE') stockAdded += q;
      else if (m.movement_type === 'SALE_CREATED') stockSold += Math.abs(q);
      else if (m.movement_type === 'AUDIT_CORRECTION') stockAdjustments += q;
    }
  });
  dayMovements.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

  return {
    date: dateStr,
    salesSummary: {
      total_transactions: totalTransactions,
      total_sales_amount: Math.round(totalSalesAmount * 100) / 100,
      total_quantity_sold: Math.round(totalQuantitySold * 100) / 100,
    },
    paymentBreakdown: Object.entries(paymentMap).map(([payment_method, data]) => ({
      payment_method,
      count: data.count,
      amount: Math.round(data.amount * 100) / 100,
    })),
    productSales: Object.values(productMap).map((p) => ({
      product_name: p.name,
      sku: p.sku,
      unit: p.unit,
      quantity_sold: Math.round(p.qty * 100) / 100,
      total_amount: Math.round(p.total * 100) / 100,
    })),
    movements: dayMovements,
    stockSummary: {
      stockAdded: Math.round(stockAdded * 100) / 100,
      stockSold: Math.round(stockSold * 100) / 100,
      stockAdjustments: Math.round(stockAdjustments * 100) / 100,
    },
  };
}

// ----------------- REPORTS -----------------
export async function getReportData(
  reportType: string,
  dateFilter = 'THIS_MONTH',
  startDate?: string,
  endDate?: string
) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const todayIST = new Date(now.getTime() + istOffset).toISOString().split('T')[0];

  let start = todayIST;
  let end = todayIST;

  if (dateFilter === 'TODAY') {
    start = todayIST;
    end = todayIST;
  } else if (dateFilter === 'YESTERDAY') {
    const yest = new Date(now.getTime() + istOffset - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    start = yest;
    end = yest;
  } else if (dateFilter === 'LAST_7_DAYS') {
    start = new Date(now.getTime() + istOffset - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    end = todayIST;
  } else if (dateFilter === 'THIS_MONTH') {
    start = todayIST.substring(0, 8) + '01';
    end = todayIST;
  } else if (dateFilter === 'CUSTOM' && startDate && endDate) {
    start = startDate;
    end = endDate;
  } else {
    start = '2020-01-01';
    end = todayIST;
  }

  if (reportType === 'SALES_DETAILED') {
    const salesSnap = await getDocs(collection(firestore, 'sales'));
    let rows: any[] = [];
    salesSnap.forEach((d) => {
      const s = d.data();
      const dStr = s.created_at?.split('T')[0] || '';
      if (dStr >= start && dStr <= end) {
        if (s.items && Array.isArray(s.items)) {
          for (const it of s.items) {
            rows.push({
              transaction_number: s.transaction_number,
              date: s.created_at,
              customer_name: s.customer_name,
              product_name: it.product_name,
              sku: it.product_sku,
              quantity: it.quantity,
              unit: it.unit,
              unit_price: it.selling_price,
              total_amount: it.total_amount,
              payment_method: s.payment_method,
              status: s.status,
            });
          }
        }
      }
    });
    rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return { title: 'Sales Detailed Ledger Report', dateRange: { start, end }, records: rows };
  }

  if (reportType === 'PRODUCT_PERFORMANCE') {
    const salesSnap = await getDocs(collection(firestore, 'sales'));
    const perfMap: Record<string, { name: string; sku: string; unit: string; totalQty: number; revenue: number; txCount: number }> = {};

    salesSnap.forEach((d) => {
      const s = d.data();
      const dStr = s.created_at?.split('T')[0] || '';
      if (dStr >= start && dStr <= end && s.status !== 'CANCELLED') {
        if (s.items && Array.isArray(s.items)) {
          for (const it of s.items) {
            const pId = it.product_id;
            if (!perfMap[pId]) {
              perfMap[pId] = {
                name: it.product_name,
                sku: it.product_sku,
                unit: it.unit,
                totalQty: 0,
                revenue: 0,
                txCount: 0,
              };
            }
            perfMap[pId].totalQty += Number(it.quantity) || 0;
            perfMap[pId].revenue += Number(it.total_amount) || 0;
            perfMap[pId].txCount++;
          }
        }
      }
    });

    const records = Object.values(perfMap).sort((a, b) => b.revenue - a.revenue);
    return { title: 'Product Performance Report', dateRange: { start, end }, records };
  }

  if (reportType === 'LOW_STOCK') {
    const productsSnap = await getDocs(collection(firestore, 'products'));
    let records: any[] = [];
    productsSnap.forEach((d) => {
      const p = d.data();
      const cur = Number(p.current_quantity) || 0;
      const min = Number(p.minimum_stock) || 0;
      if (cur <= min && p.status !== 'ARCHIVED') {
        records.push({
          sku: p.sku,
          name: p.name,
          category: p.category,
          unit: p.unit,
          current_quantity: cur,
          minimum_stock: min,
          deficit: min - cur > 0 ? min - cur : 0,
          status: cur <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          supplier_name: p.supplier_name,
        });
      }
    });
    records.sort((a, b) => a.current_quantity - b.current_quantity);
    return { title: 'Low Stock Deficit & Reorder Report', dateRange: { start, end }, records };
  }

  if (reportType === 'STOCK_FLOW') {
    const movSnap = await getDocs(collection(firestore, 'stock_movements'));
    let records: any[] = [];
    movSnap.forEach((d) => {
      const m = d.data();
      const dStr = m.created_at?.split('T')[0] || '';
      if (dStr >= start && dStr <= end) {
        records.push({
          id: d.id,
          ...m,
        });
      }
    });
    records.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return { title: 'Stock Movement Ledger Report', dateRange: { start, end }, records };
  }

  return { title: 'General Report', dateRange: { start, end }, records: [] };
}

// ----------------- AUDIT LOGS -----------------
export async function getAuditLogs(params: {
  action?: string;
  entityType?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  // If memory buffer hasn't loaded initial logs yet, load them once
  if (!memoryAuditLogsLoaded || memoryAuditLogs.length === 0) {
    try {
      const snap = await getDocs(
        query(collection(firestore, 'audit_logs'), orderBy('created_at', 'desc'), firestoreLimit(150))
      );
      const fetched: any[] = [];
      snap.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
      memoryAuditLogs = fetched;
      memoryAuditLogsLoaded = true;
    } catch {
      try {
        const snap = await getDocs(collection(firestore, 'audit_logs'));
        const fetched: any[] = [];
        snap.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
        fetched.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        memoryAuditLogs = fetched.slice(0, 150);
        memoryAuditLogsLoaded = true;
      } catch {}
    }
  }

  let logs: any[] = [...memoryAuditLogs];

  if (params.action && params.action !== 'ALL') {
    logs = logs.filter((l) => l.action === params.action);
  }
  if (params.entityType && params.entityType !== 'ALL') {
    logs = logs.filter((l) => l.entity_type === params.entityType);
  }
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    logs = logs.filter(
      (l) =>
        (l.reason && l.reason.toLowerCase().includes(q)) ||
        (l.product_name && l.product_name.toLowerCase().includes(q)) ||
        (l.transaction_id && l.transaction_id.toLowerCase().includes(q)) ||
        (l.performed_by && l.performed_by.toLowerCase().includes(q))
    );
  }

  logs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

  const total = logs.length;
  const page = params.page || 1;
  const limit = params.limit || 25;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;

  return {
    logs: logs.slice(offset, offset + limit),
    total,
    page,
    limit,
    totalPages,
  };
}

// ----------------- GLOBAL SEARCH -----------------
export async function globalSearch(queryStr: string) {
  if (!queryStr || !queryStr.trim()) {
    return { products: [], sales: [], movements: [] };
  }
  const q = queryStr.toLowerCase().trim();

  // 1. Search cached products
  const prods = await getProducts();
  const matchedProducts = prods.filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
  );

  // 2. Search cached sales
  const sales = await getAllSalesCached();
  const matchedSales = sales.filter(
    (s) =>
      s.transaction_number?.toLowerCase().includes(q) ||
      s.customer_name?.toLowerCase().includes(q) ||
      s.customer_phone?.toLowerCase().includes(q) ||
      s.customer_address?.toLowerCase().includes(q) ||
      s.items?.some((it: any) => it.product_name?.toLowerCase().includes(q) || it.product_sku?.toLowerCase().includes(q))
  );

  return {
    products: matchedProducts.slice(0, 10),
    sales: matchedSales.slice(0, 10),
    movements: [],
  };
}

// ----------------- SETTINGS & CATEGORIES -----------------
export async function getSettings() {
  const now = Date.now();
  if (memorySettings && now - memorySettingsTime < 60000) {
    return memorySettings;
  }

  const snap = await getDoc(doc(firestore, 'settings', 'shop_profile'));
  if (snap.exists()) {
    memorySettings = snap.data();
    memorySettingsTime = now;
    return memorySettings;
  }
  const defaultSettings = {
    shop_name: 'AK ENTERPRISES',
    currency: '₹',
    timezone: 'Asia/Kolkata',
    phone: '+91 98765 43210',
    email: 'admin@akenterprises.com',
    address: 'Wholesale Market Complex, Main Road',
    default_min_stock: '10',
    invoice_prefix: 'SALE-',
    receipt_footer: 'Thank you for your business with AK ENTERPRISES!',
  };
  memorySettings = defaultSettings;
  memorySettingsTime = now;
  return defaultSettings;
}

export async function updateSettings(input: any, adminEmail: string) {
  const docRef = doc(firestore, 'settings', 'shop_profile');
  const now = getISTTimestamp();
  const updates = {
    ...input,
    updated_at: now,
  };
  await setDoc(docRef, updates, { merge: true });

  memorySettings = updates;
  memorySettingsTime = Date.now();

  logAuditEvent({
    action: 'SETTINGS_UPDATED',
    entity_type: 'SETTINGS',
    entity_id: 'shop_profile',
    reason: 'Store profile settings updated',
    performed_by: adminEmail,
  }).catch(() => {});

  return updates;
}

export async function getCategories() {
  const now = Date.now();
  if (memoryCategories && now - memoryCategoriesTime < 60000) {
    return memoryCategories;
  }

  const snap = await getDocs(collection(firestore, 'categories'));
  const cats: { id: string; name: string }[] = [];
  snap.forEach((d) => {
    const data = d.data();
    cats.push({
      id: data.id || d.id,
      name: data.name || d.id,
    });
  });
  cats.sort((a, b) => a.name.localeCompare(b.name));
  memoryCategories = cats;
  memoryCategoriesTime = now;
  return cats;
}

export async function createCategory(name: string, adminEmail: string = 'admin@akenterprises.com') {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name cannot be blank.');
  const id = 'cat_' + crypto.randomUUID().slice(0, 8);
  const now = getISTTimestamp();
  const catObj = { id, name: trimmed, created_at: now };

  await setDoc(doc(firestore, 'categories', id), catObj);

  if (memoryCategories) {
    memoryCategories.push({ id, name: trimmed });
    memoryCategories.sort((a, b) => a.name.localeCompare(b.name));
    memoryCategoriesTime = Date.now();
  }

  logAuditEvent({
    action: 'CATEGORY_CREATED',
    entity_type: 'CATEGORY',
    entity_id: id,
    old_value: null,
    new_value: JSON.stringify({ name: trimmed }),
    reason: `New product category created: "${trimmed}"`,
    performed_by: adminEmail,
  }).catch(() => {});

  return { id, name: trimmed };
}

// ----------------- DATA PURGE / RESET -----------------
export async function clearAllStoreData(adminEmail: string) {
  const collectionsToClear = ['sales', 'stock_movements', 'products', 'audit_logs'];
  let totalDeleted = 0;
  for (const colName of collectionsToClear) {
    const snap = await getDocs(collection(firestore, colName));
    for (const d of snap.docs) {
      await deleteDoc(doc(firestore, colName, d.id));
      totalDeleted++;
    }
  }

  // Clear all in-memory caches
  memoryProducts = null;
  memorySales = null;
  memoryCategories = null;
  memorySettings = null;
  memoryAuditLogs = [];

  logAuditEvent({
    action: 'STORE_DATA_CLEARED',
    entity_type: 'SYSTEM',
    entity_id: 'all_data',
    reason: 'Store owner initiated full data purge for stock, sales, products, and audit trail',
    performed_by: adminEmail,
  }).catch(() => {});

  return { success: true, count: totalDeleted, message: 'All test products, stock movements, sales, and audit records have been cleared.' };
}
