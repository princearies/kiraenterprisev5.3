-- Verify seed data
SELECT code, name, type, address, phone, email, status FROM companies ORDER BY created_at DESC LIMIT 10;

SELECT cs.id, cs.service_name, cs.service_charge, cs.billing_type, cs.status
FROM company_services cs
WHERE cs.company_id = '134deb69-2609-4b84-8e5c-079aa8d9ba3a';

SELECT sp.id, sp.amount, sp.payment_date, sp.due_date, sp.status, sp.notes
FROM service_payments sp
WHERE sp.company_id = '134deb69-2609-4b84-8e5c-079aa8d9ba3a';
