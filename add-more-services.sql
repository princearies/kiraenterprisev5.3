-- ============================================
-- Additional Dummy Services
-- ============================================

-- Services for ABC12345 (Kedai Runcit Sabah Maju)
INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-abc-001', (SELECT id FROM companies WHERE code = 'ABC12345'), 'Perkhidmatan Pengilangan', 5000.00, 'bulanan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-abc-002', (SELECT id FROM companies WHERE code = 'ABC12345'), 'Perkhidmatan Pengedaran', 3500.00, 'bulanan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-abc-003', (SELECT id FROM companies WHERE code = 'ABC12345'), 'Consultancy Perniagaan', 2000.00, 'tahunan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-abc-004', (SELECT id FROM companies WHERE code = 'ABC12345'), 'Perkhidmatan Pengurusan', 1800.00, 'bulanan', 'active');

-- Services for DEF67890 (Firm Consultancy & Audit)
INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-def-001', (SELECT id FROM companies WHERE code = 'DEF67890'), 'Audit Percuma Tahunan', 8000.00, 'tahunan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-def-002', (SELECT id FROM companies WHERE code = 'DEF67890'), 'Perkhidmatan Penghasilan Akta', 2500.00, 'bulanan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-def-003', (SELECT id FROM companies WHERE code = 'DEF67890'), 'Perniagaan Lain-lain', 1500.00, 'bulanan', 'active');

-- Services for GHI23456 (Pacific Enterprise Services)
INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-ghi-001', (SELECT id FROM companies WHERE code = 'GHI23456'), 'Perkhidmatan IT & Penyediaan', 4500.00, 'bulanan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-ghi-002', (SELECT id FROM companies WHERE code = 'GHI23456'), 'Perkhidmatan Pembinaan', 6000.00, 'bulanan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-ghi-003', (SELECT id FROM companies WHERE code = 'GHI23456'), 'Perkhidmatan Kecil & Sederhana', 2000.00, 'bulanan', 'active');

-- Services for JKL34567 (Sunrise Payroll Services)
INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-jkl-001', (SELECT id FROM companies WHERE code = 'JKL34567'), 'Perkhidmatan Penggajian', 3000.00, 'bulanan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-jkl-002', (SELECT id FROM companies WHERE code = 'JKL34567'), 'Perkhidmatan KWSP & EPF', 1200.00, 'bulanan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-jkl-003', (SELECT id FROM companies WHERE code = 'JKL34567'), 'Perkhidmatan Loan & Utiliti', 800.00, 'bulanan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-jkl-004', (SELECT id FROM companies WHERE code = 'JKL34567'), 'Perkhidmatan Kepentingan', 500.00, 'bulanan', 'active');

-- Services for MNO45678 (Koperasi Kecil & Sederhana)
INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-mno-001', (SELECT id FROM companies WHERE code = 'MNO45678'), 'Perkhidmatan Koperasi Maju', 2500.00, 'bulanan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-mno-002', (SELECT id FROM companies WHERE code = 'MNO45678'), 'Perkhidmatan Eksport', 4000.00, 'bulanan', 'active');

INSERT OR IGNORE INTO company_services (id, company_id, service_name, service_charge, billing_type, status) VALUES
  ('svc-mno-003', (SELECT id FROM companies WHERE code = 'MNO45678'), 'Perkhidmatan Impor', 3500.00, 'bulanan', 'active');
