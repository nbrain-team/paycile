-- Seed data for Paycile
-- Password for all users is hashed version of 'password123'

-- Insurance Companies
INSERT INTO insurance_companies (id, name, code, address, contact_info) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Acme Insurance Co', 'ACME', 
 '{"street": "123 Main St", "city": "New York", "state": "NY", "zipCode": "10001", "country": "USA"}',
 '{"phone": "1-800-555-0100", "email": "contact@acmeinsurance.com", "website": "www.acmeinsurance.com"}'),
('550e8400-e29b-41d4-a716-446655440002', 'Shield Insurance Group', 'SHIELD',
 '{"street": "456 Oak Ave", "city": "Chicago", "state": "IL", "zipCode": "60601", "country": "USA"}',
 '{"phone": "1-800-555-0200", "email": "info@shieldinsurance.com", "website": "www.shieldinsurance.com"}'),
('550e8400-e29b-41d4-a716-446655440003', 'Premier Coverage LLC', 'PREMIER',
 '{"street": "789 Pine Blvd", "city": "Los Angeles", "state": "CA", "zipCode": "90001", "country": "USA"}',
 '{"phone": "1-800-555-0300", "email": "support@premiercoverage.com", "website": "www.premiercoverage.com"}');

-- Users (password: password123)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, company_name, email_verified) VALUES
-- Admin
('550e8400-e29b-41d4-a716-446655440010', 'admin@paycile.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'User', 'admin', '555-0001', 'Paycile', true),
-- Agents
('550e8400-e29b-41d4-a716-446655440011', 'john.agent@paycile.com', '$2a$10$YourHashedPasswordHere', 'John', 'Smith', 'agent', '555-1001', 'Smith Insurance Agency', true),
('550e8400-e29b-41d4-a716-446655440012', 'sarah.agent@paycile.com', '$2a$10$YourHashedPasswordHere', 'Sarah', 'Johnson', 'agent', '555-1002', 'Johnson & Associates', true),
-- Clients
('550e8400-e29b-41d4-a716-446655440020', 'client1@example.com', '$2a$10$YourHashedPasswordHere', 'Michael', 'Brown', 'client', '555-2001', 'Brown Enterprises', true),
('550e8400-e29b-41d4-a716-446655440021', 'client2@example.com', '$2a$10$YourHashedPasswordHere', 'Jennifer', 'Davis', 'client', '555-2002', NULL, true),
('550e8400-e29b-41d4-a716-446655440022', 'client3@example.com', '$2a$10$YourHashedPasswordHere', 'Robert', 'Wilson', 'client', '555-2003', 'Wilson Tech', true);

-- Policies
INSERT INTO policies (id, policy_number, client_id, agent_id, insurance_company_id, policy_type, premium_amount, payment_frequency, effective_date, expiration_date, status) VALUES
('550e8400-e29b-41d4-a716-446655440030', 'POL-2024-001', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'General Liability', 2500.00, 'monthly', '2024-01-01', '2025-01-01', 'active'),
('550e8400-e29b-41d4-a716-446655440031', 'POL-2024-002', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Auto Insurance', 1200.00, 'monthly', '2024-01-15', '2025-01-15', 'active'),
('550e8400-e29b-41d4-a716-446655440032', 'POL-2024-003', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 'Property Insurance', 3500.00, 'quarterly', '2024-02-01', '2025-02-01', 'active');

-- Invoices
INSERT INTO invoices (id, invoice_number, policy_id, client_id, amount, due_date, status, billing_period_start, billing_period_end) VALUES
('550e8400-e29b-41d4-a716-446655440040', 'INV-2024-001', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 2500.00, '2024-01-31', 'paid', '2024-01-01', '2024-01-31'),
('550e8400-e29b-41d4-a716-446655440041', 'INV-2024-002', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', 1200.00, '2024-01-31', 'overdue', '2024-01-15', '2024-02-14'),
('550e8400-e29b-41d4-a716-446655440042', 'INV-2024-003', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022', 3500.00, '2024-04-30', 'sent', '2024-02-01', '2024-04-30');

-- Payments
INSERT INTO payments (id, payment_reference, client_id, amount, payment_method, status, payment_date) VALUES
('550e8400-e29b-41d4-a716-446655440050', 'PAY-2024-001', '550e8400-e29b-41d4-a716-446655440020', 2500.00, 'ach', 'completed', '2024-01-25 10:30:00'),
('550e8400-e29b-41d4-a716-446655440051', 'PAY-2024-002', '550e8400-e29b-41d4-a716-446655440021', 600.00, 'credit_card', 'completed', '2024-02-05 14:15:00'),
('550e8400-e29b-41d4-a716-446655440052', 'PAY-2024-003', '550e8400-e29b-41d4-a716-446655440022', 3500.00, 'check', 'pending', '2024-02-10 09:00:00');

-- Payment Allocations
INSERT INTO payment_allocations (payment_id, invoice_id, allocated_amount) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440040', 2500.00);

-- Reconciliations
INSERT INTO reconciliations (payment_id, invoice_id, status, confidence_score, ai_suggestions) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440040', 'matched', 0.98, '{"suggestedMatches": [], "anomalies": []}'),
('550e8400-e29b-41d4-a716-446655440051', NULL, 'unmatched', 0.65, '{"suggestedMatches": [{"invoiceId": "550e8400-e29b-41d4-a716-446655440041", "confidence": 0.65, "reason": "Partial payment amount matches 50% of invoice"}], "anomalies": ["Payment amount is less than invoice total"]}');

-- Notifications
INSERT INTO notifications (user_id, type, title, message, read) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'payment_confirmed', 'Payment Received', 'Your payment of $2,500.00 has been received and processed.', true),
('550e8400-e29b-41d4-a716-446655440021', 'invoice_overdue', 'Invoice Overdue', 'Your invoice INV-2024-002 for $1,200.00 is now overdue.', false),
('550e8400-e29b-41d4-a716-446655440022', 'invoice_created', 'New Invoice', 'A new invoice INV-2024-003 for $3,500.00 has been created.', false); 