-- ============================================
-- Additional Dummy Companies
-- ============================================

INSERT OR IGNORE INTO companies (id, code, name, type, tax_rate, address, phone, email, status, created_at) VALUES
  ('company-001', 'ABC12345', 'Kedai Runcit Sabah Maju Sdn Bhd', 'sdn_bhd', 24.0, 'Lot 12, Jalan Gaya, Kota Kinabalu, Sabah 88000', '088-123456', 'admin@sabahmaju.com.my', 'active', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO companies (id, code, name, type, tax_rate, address, phone, email, status, created_at) VALUES
  ('company-002', 'DEF67890', 'Firm Consultancy & Audit Sdn Bhd', 'sdn_bhd', 24.0, 'No. 5, Jalan Tun Ahmad, Likas, Kota Kinabalu, Sabah 88400', '088-987654', 'info@firmaudit.com.my', 'active', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO companies (id, code, name, type, tax_rate, address, phone, email, status, created_at) VALUES
  ('company-003', 'GHI23456', 'Pacific Enterprise Services Sdn Bhd', 'sdn_bhd', 24.0, 'Level 3, Wisma Pacific, Jalan Tun Fuad Stephens, Kota Kinabalu, Sabah 88000', '088-555123', 'contact@pacificsbs.com.my', 'active', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO companies (id, code, name, type, tax_rate, address, phone, email, status, created_at) VALUES
  ('company-004', 'JKL34567', 'Sunrise Payroll Services Sdn Bhd', 'sdn_bhd', 24.0, 'No. 12-1, Persiaran Sungai, Likas, Kota Kinabalu, Sabah 88400', '088-333777', 'support@sunrisepayroll.com.my', 'active', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO companies (id, code, name, type, tax_rate, address, phone, email, status, created_at) VALUES
  ('company-005', 'MNO45678', 'Koperasi Kecil & Sederhana Sabah Berhad', 'coop', 24.0, 'Lot 88, Kawasan Perindustrian Tuaran, Tuaran, Sabah 89000', '089-222333', 'ketua@koperasisks.com.my', 'active', CURRENT_TIMESTAMP);
