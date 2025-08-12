-- Cash Flow Feature Schema
-- Extends Paycile Database with Cash Flow Management

-- Transaction type enum
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Recurring frequency enum
CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');

-- Budget period enum
CREATE TYPE budget_period AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');

-- Alert severity enum
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

-- Cash Flow Categories table
CREATE TABLE cash_flow_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type transaction_type NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    icon VARCHAR(10) DEFAULT '💰',
    is_system BOOLEAN DEFAULT false,
    parent_category_id UUID REFERENCES cash_flow_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name, type)
);

-- Cash Flow Transactions table
CREATE TABLE cash_flow_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES cash_flow_categories(id),
    date DATE NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description VARCHAR(500) NOT NULL,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency recurring_frequency,
    recurring_end_date DATE,
    parent_transaction_id UUID REFERENCES cash_flow_transactions(id),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cash Flow Budgets table
CREATE TABLE cash_flow_budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES cash_flow_categories(id),
    amount DECIMAL(15, 2) NOT NULL,
    period budget_period NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id, period, start_date)
);

-- Cash Flow Alerts table
CREATE TABLE cash_flow_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    severity alert_severity NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_cash_flow_transactions_user_date ON cash_flow_transactions(user_id, date);
CREATE INDEX idx_cash_flow_transactions_category ON cash_flow_transactions(category_id);
CREATE INDEX idx_cash_flow_transactions_recurring ON cash_flow_transactions(is_recurring) WHERE is_recurring = true;
CREATE INDEX idx_cash_flow_budgets_user_active ON cash_flow_budgets(user_id, is_active);
CREATE INDEX idx_cash_flow_alerts_user_unread ON cash_flow_alerts(user_id, is_read) WHERE is_read = false;

-- Insert default system categories
INSERT INTO cash_flow_categories (name, type, color, icon, is_system) VALUES
-- Income categories
('Salary', 'income', '#10b981', '💵', true),
('Business Income', 'income', '#3b82f6', '💼', true),
('Investments', 'income', '#8b5cf6', '📈', true),
('Freelance', 'income', '#f59e0b', '💻', true),
('Other Income', 'income', '#6b7280', '💰', true),
-- Expense categories
('Housing', 'expense', '#ef4444', '🏠', true),
('Transportation', 'expense', '#f97316', '🚗', true),
('Food & Dining', 'expense', '#84cc16', '🍽️', true),
('Utilities', 'expense', '#06b6d4', '💡', true),
('Healthcare', 'expense', '#ec4899', '🏥', true),
('Entertainment', 'expense', '#a855f7', '🎬', true),
('Shopping', 'expense', '#f43f5e', '🛍️', true),
('Education', 'expense', '#6366f1', '📚', true),
('Insurance', 'expense', '#0ea5e9', '🛡️', true),
('Savings', 'expense', '#14b8a6', '💎', true),
('Debt Payments', 'expense', '#dc2626', '💳', true),
('Other Expenses', 'expense', '#64748b', '📝', true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_cash_flow_categories_updated_at BEFORE UPDATE ON cash_flow_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_flow_transactions_updated_at BEFORE UPDATE ON cash_flow_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_flow_budgets_updated_at BEFORE UPDATE ON cash_flow_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 