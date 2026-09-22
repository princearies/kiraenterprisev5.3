-- Seed data for Company Registration System
-- Run SELECTI setelah migration selesai

-- Seed company: 134deb69-2609-4b84-8e5c-079aa8d9ba3a
INSERT OR IGNORE INTO companies (id, code, name, type, tax_rate, address, phone, email, status, created_at) VALUES (
  '134deb69-2609-4b84-8e5c-079aa8d9ba3a',
  '134deb69',
  'Contoh Syarikat Berdaftar Sdn Bhd',
  'sdn_bhd_normal',
  24.0,
  'Lot 123, Jalan Contoh, Kota Kinabalu, Sabah 88000',
  '088-123456',
  'info@contoh.syarikat.my',
  'active',
  CURRENT_TIMESTAMP
);

-- Seed company services
INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-001', '134deb69-2609-4b84-8e5c-079aa8d9ba3a', 'Perkhidmatan Consultancy', 1500.00, 'bulanan', 'active'),
  ('svc-002', '134deb69-2609-4b84-8e5c-079aa8d9ba3a', 'Perkhidmatan Audit', 3000.00, 'tahunan', 'active'),
  ('svc-003', '134deb69-2609-4b84-8e5c-079aa8d9ba3a', 'Perkhidmatan Pembukuan', 800.00, 'bulanan', 'active'),
  ('svc-004', '134deb69-2609-4b84-8e5c-079aa8d9ba3a', 'Perkhidmatan Perundingan Pajak', 2000.00, 'tahunan', 'active');

-- Seed service payments (mix of paid and unpaid)
INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes) VALUES
  ('pay-001', '134deb69-2609-4b84-8e5c-079aa8d9ba3a', 'svc-001', 1500.00, '2026-09-01', '2026-09-01', 'paid', 'Pembayaran bulan September 2026'),
  ('pay-002', '134deb69-2609-4b84-8e5c-079aa8d9ba3a', 'svc-002', 3000.00, NULL, '2026-12-31', 'unpaid', 'Audit tahunan - belum dibayar'),
  ('pay-003', '134deb69-2609-4b84-8e5c-079aa8d9ba3a', 'svc-003', 800.00, '2026-08-15', '2026-08-15', 'paid', 'Pembukuan bulan Ogos 2026'),
  ('pay-004', '134deb69-2609-4b84-8e5c-079aa8d9ba3a', 'svc-001', 1500.00, NULL, '2026-10-01', 'unpaid', 'Consultancy Oktober 2026 - belum dibayar'),
  ('pay-005', '134deb69-2609-4b84-8e5c-079aa8d9ba3a', 'svc-004', 2000.00, NULL, '2027-01-31', 'unpaid', 'Perundingan Pajak tahunan 2027');
