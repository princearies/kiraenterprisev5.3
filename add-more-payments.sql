-- Payments for ABC12345 (Kedai Runcit Sabah Maju)
INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-abc-001', c.id, s.id, 5000.00, '2026-09-05', '2026-09-05', 'paid', 'Pengilangan September 2026 - telah dibayar'
FROM companies c, company_services s WHERE c.code = 'ABC12345' AND s.id = 'svc-abc-001';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-abc-002', c.id, s.id, 3500.00, '2026-09-05', '2026-09-05', 'paid', 'Pengedaran September 2026 - telah dibayar'
FROM companies c, company_services s WHERE c.code = 'ABC12345' AND s.id = 'svc-abc-002';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-abc-003', c.id, s.id, 2000.00, NULL, '2026-12-31', 'unpaid', 'Consultancy Perniagaan Tahunan - belum dibayar'
FROM companies c, company_services s WHERE c.code = 'ABC12345' AND s.id = 'svc-abc-003';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-abc-004', c.id, s.id, 1800.00, NULL, '2026-10-05', 'unpaid', 'Pengurusan Oktober 2026 - belum dibayar'
FROM companies c, company_services s WHERE c.code = 'ABC12345' AND s.id = 'svc-abc-004';

-- Payments for DEF67890 (Firm Consultancy & Audit)
INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-def-001', c.id, s.id, 8000.00, NULL, '2026-12-31', 'unpaid', 'Audit Tahunan 2026 - belum dibayar'
FROM companies c, company_services s WHERE c.code = 'DEF67890' AND s.id = 'svc-def-001';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-def-002', c.id, s.id, 2500.00, '2026-09-10', '2026-09-10', 'paid', 'Penghasilan Akta September 2026 - telah dibayar'
FROM companies c, company_services s WHERE c.code = 'DEF67890' AND s.id = 'svc-def-002';

INSERT OR IGNORE INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes)
SELECT 'pay-def-003', c.id, s.id, 1500.00, NULL, '2026-10-10', 'unpaid', 'Perniagaan Lain-lain Oktober 2026 - belum dibayar'
FROM companies c, company_services s WHERE c.code = 'DEF67890' AND s.id = 'svc-def-003';
