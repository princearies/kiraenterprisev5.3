SELECT 'COMPANIES' AS tbl, COUNT(*) AS n FROM companies
UNION ALL SELECT 'SERVICES', COUNT(*) FROM company_services
UNION ALL SELECT 'PAYMENTS', COUNT(*) FROM service_payments
UNION ALL SELECT 'PAYMENTS_PAID', COUNT(*) FROM service_payments WHERE status = 'paid'
UNION ALL SELECT 'PAYMENTS_UNPAID', COUNT(*) FROM service_payments WHERE status = 'unpaid';
