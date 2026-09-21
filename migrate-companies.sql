-- ============================================
-- Company Registration & Service Billing System
-- Database: mykira
-- ============================================

-- Step 1: Add missing columns to companies table
-- (SQLite tidak support ADD COLUMN IF NOT EXISTS, jadi kita gunakan ALTER TABLE biasanya)
-- Note: Jika column sudah wujud, command ini akan error. Pastikan run sekali sahaja.

ALTER TABLE companies ADD COLUMN address TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN phone TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN email TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN status TEXT DEFAULT 'active';

-- Step 2: Create company_services table
CREATE TABLE IF NOT EXISTS company_services (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_charge REAL NOT NULL,
  billing_type TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Step 3: Create service_payments table
CREATE TABLE IF NOT EXISTS service_payments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'unpaid',
  notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES company_services(id) ON DELETE CASCADE
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_services_company ON company_services(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON service_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON service_payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due ON service_payments(due_date);
