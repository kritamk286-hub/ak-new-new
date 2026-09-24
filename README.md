# AK ENTERPRISES — Shop & Inventory Management System

A complete, production-ready, fully functional web-based Shop Management & Inventory Control System built for **AK ENTERPRISES**.

## Features

- **Real Admin Authentication**: Session-based authenticated admin portal with encrypted credentials, session expiration, and audit trail.
  - Default Admin Email: `admin@akenterprises.com`
  - Default Admin Password: `admin123` (Can be changed in Settings)
- **Real Relational Database**: Powered by persistent SQL engine with atomic transactions, foreign keys, and indexes. All records survive page refresh, logout, and container restart.
- **Decimal Quantity Support**: Accurately handles any metric unit (`Piece`, `Kg`, `Gram`, `Liter`, `Meter`, `Box`, `Packet`, `Other`) with exact decimal arithmetic (e.g., `10 kg`, `5.5 kg`, `2.250 kg`).
- **Real-Time Stock Reconciliation**:
  - **Stock Addition**: Automatically adds to inventory and records an immutable stock inward movement.
  - **Sell Product**: Validates stock availability, atomically subtracts sold quantity, assigns sequential Transaction ID (`SALE-YYYYMMDD-XXXX`), and records stock movement.
  - **Sale Edit**: Dynamically reconciles stock using the difference between original and updated quantities (either returning or taking stock as required).
  - **Sale Cancellation**: Restores full item quantities back into available inventory with required audit reason.
  - **Stock Adjustment**: Audited positive/negative stock corrections for damages, discrepancies, or returns.
- **Immutable Audit Trail**: All operations (`PRODUCT_CREATED`, `PRODUCT_UPDATED`, `STOCK_ADDED`, `STOCK_ADJUSTED`, `SALE_CREATED`, `SALE_UPDATED`, `SALE_CANCELLED`, `LOGIN`, `LOGOUT`) are permanently recorded with IST timestamps and cannot be deleted.
- **Business Dashboard**: Real-time calculated cards (Total Products, Total Stock, Today's Sales, Today's Sold Quantity, Today's Transactions, Low Stock Products, Inventory Valuation) and interactive trend charts.
- **Day-Wise Business Management**: Select any calendar date to view opening stock, stock added, stock sold, stock adjustments, and product-wise daily revenue.
- **Reports & Real Exports**:
  - Daily, Weekly, Monthly, and Custom Date Range Sales Reports
  - Product-wise Sales Report
  - Stock Movement Journal
  - Payment Method Breakdown
  - Low Stock Warning Report
  - Direct CSV download and formatted Print/PDF receipt generation
- **Receipt / Invoice Generation**: Itemized printable bill with AK ENTERPRISES letterhead, Transaction ID, customer details, and timestamp.
- **Supabase / PostgreSQL Ready**: Includes full SQL migration file at `supabase/migrations/20260921000001_ak_enterprises.sql` with Row Level Security (RLS) policies and triggers.

## Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Motion.
- **Backend**: Node.js, Express, Native SQLite engine (`data/shop.db`) with WAL mode and atomic transactions.
- **Optional Supabase Integration**: Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to connect directly to Supabase.
- **Timezone**: Indian Standard Time (IST, UTC+05:30).

## Default Admin Credentials

- **Email**: `admin@akenterprises.com`
- **Password**: `admin123`

## Running Locally

```bash
# Install dependencies
npm install

# Run full-stack dev server (Express + Vite on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
