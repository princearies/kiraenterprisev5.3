-- Payments for GHI23456 (Pacific Enterprise Services)
INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-ghi-001', c.id, s.id, 4500.00, '2026-09-03', '2026-09-03', 'paid', 'IT & Penyediaan September 2026 - telah dibayar'
FROM companies c, company_services s WHERE c.code = 'GHI23456' AND s.id = 'svc-ghi-001';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-ghi-002', c.id, s.id, 6000.00, NULL, '2026-10-03', 'unpaid', 'Pembinaan Oktober 2026 - belum dibayar'
FROM companies c, company_services s WHERE c.code = 'GHI23456' AND s.id = 'svc-ghi-002';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-ghi-003', c.id, s.id, 2000.00, NULL, '2026-10-03', 'unpaid', 'Kecil & Sederhana Oktober 2026 - belum dibayar'
FROM companies c, company_services s WHERE c.code = 'GHI23456' AND s.id = 'svc-ghi-003';

-- Payments for JKL34567 (Sunrise Payroll Services)
INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-jkl-001', c.id, s.id, 3000.00, '2026-09-08', '2026-09-08', 'paid', 'Penggajian September 2026 - telah dibayar'
FROM companies c, company_services s WHERE c.code = 'JKL34567' AND s.id = 'svc-jkl-001';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-jkl-002', c.id, s.id, 1200.00, '2026-09-08', '2026-09-08', 'paid', 'KWSP & EPF September 2026 - telah dibayar'
FROM companies c, company_services s WHERE c.code = 'JKL34567' AND s.id = 'svc-jkl-002';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-jkl-003', c.id, s.id, 800.00, NULL, '2026-10-08', 'unpaid', 'Loan & Utiliti Oktober 2026 - belum dibayar'
FROM companies c, company_services s WHERE c.code = 'JKL34567' AND s.id = 'svc-jkl-003';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-jkl-004', c.id, s.id, 500.00, NULL, '2026-10-08', 'unpaid', 'Kepentingan Oktober 2026 - belum dibayar'
FROM companies c, company_services s WHERE c.code = 'JKL34567' AND s.id = 'svc-jkl-004';

-- Payments for MNO45678 (Koperasi Kecil & Sederhana)
INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-mno-001', c.id, s.id, 2500.00, '2026-09-15', '2026-09-15', 'paid', 'Koperasi Maju September 2026 - telah dibayar'
FROM companies c, company_services s WHERE c.code = 'MNO45678' AND s.id = 'svc-mno-001';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-mno-002', c.id, s.id, 4000.00, NULL, '2026-10-15', 'unpaid', 'Eksport Oktober 2026 - belum dibayar'
FROM companies c, company_services s WHERE c.code = 'MNO45678' AND s.id = 'svc-mno-002';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-mno-003', c.id, s.id, 3500.00, NULL, '2026-10-15', 'unpaid', 'Impor Oktober 2026 - belum dibayar'
FROM companies c, company_services s WHERE c.code = 'MNO45678' AND s.id = 'svc-mno-003';
