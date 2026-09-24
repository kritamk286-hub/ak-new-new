import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
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
  limit,
  Firestore,
} from 'firebase/firestore';

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

// Read config safely across ESM / CJS bundlers and Docker container runtimes
let firebaseConfig: any = {};
const possiblePaths = [
  path.resolve(process.cwd(), 'firebase-applet-config.json'),
  path.resolve(baseDir, 'firebase-applet-config.json'),
  path.resolve(baseDir, '..', 'firebase-applet-config.json'),
];
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    try {
      firebaseConfig = JSON.parse(fs.readFileSync(p, 'utf8'));
      break;
    } catch {}
  }
}
export { firebaseConfig };

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL Database ID Rule: Pass database ID if defined and non-empty
export const firestore: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Helper for Indian Standard Time (IST) ISO-like string
export function getISTTimestamp(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  return ist.toISOString().replace('Z', '+05:30');
}

// Password hashing utility with PBKDF2
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex');
  return { hash: `${s}:${h}`, salt: s };
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

// Seed starter data into Firestore on first load
export async function initFirebaseDatabase() {
  try {
    // 1. Check or seed Settings
    const settingsRef = doc(firestore, 'settings', 'shop_profile');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        shop_name: 'AK ENTERPRISES',
        currency: '₹',
        timezone: 'Asia/Kolkata',
        phone: '+91 98765 43210',
        email: 'admin@akenterprises.com',
        address: 'Wholesale Market Complex, Main Road',
        default_min_stock: '10',
        invoice_prefix: 'SALE-',
        receipt_footer: 'Thank you for your business with AK ENTERPRISES!',
        updated_at: getISTTimestamp(),
      });
      console.log('Firebase: Initialized shop settings.');
    }

    // 2. Check or seed Admin (configured for kritamk286@gmail.com)
    const targetEmail = process.env.ADMIN_EMAIL || 'kritamk286@gmail.com';
    const targetPass = process.env.ADMIN_PASSWORD || 'kritam@098only';
    const adminRef = doc(firestore, 'admins', 'admin_default');
    const existingAdminSnap = await getDoc(adminRef);

    if (!existingAdminSnap.exists() || !existingAdminSnap.data()?.password_hash) {
      const { hash } = hashPassword(targetPass);
      await setDoc(
        adminRef,
        {
          id: 'admin_default',
          email: targetEmail,
          name: 'Kritam (AK Enterprises)',
          password_hash: hash,
          role: 'superadmin',
          created_at: getISTTimestamp(),
          updated_at: getISTTimestamp(),
        },
        { merge: true }
      );
      console.log(`Firebase: Initialized secure admin account for ${targetEmail}.`);
    } else {
      console.log(`Firebase: Verified existing admin account for ${targetEmail}.`);
    }

    // Clean up any stale mock or temporary google auth docs
    const allAdmins = await getDocs(collection(firestore, 'admins'));
    for (const d of allAdmins.docs) {
      if (d.id.startsWith('admin_google_')) {
        await deleteDoc(doc(firestore, 'admins', d.id));
      }
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}
