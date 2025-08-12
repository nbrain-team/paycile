export interface CashFlowTransaction {
  id?: string;
  date: Date;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  recurringEndDate?: Date;
  tags?: string[];
  attachments?: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CashFlowCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  subcategories?: string[];
  budgetAmount?: number;
}

export interface DailyCashFlow {
  date: Date;
  startingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  endingBalance: number;
  transactions: CashFlowTransaction[];
  projectedBalance?: number;
  isProjected?: boolean;
}

export interface CashFlowSummary {
  period: string;
  startDate: Date;
  endDate: Date;
  openingBalance: number;
  closingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  averageDailyBalance: number;
  lowestBalance: number;
  lowestBalanceDate: Date;
  highestBalance: number;
  highestBalanceDate: Date;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }[];
}

export interface CashFlowProjection {
  date: Date;
  projectedBalance: number;
  projectedIncome: number;
  projectedExpenses: number;
  confidence: number;
  assumptions: string[];
}

export interface Budget {
  id?: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  alertThreshold?: number;
  notes?: string;
}

export interface CashFlowAlert {
  id: string;
  type: 'low_balance' | 'budget_exceeded' | 'unusual_activity' | 'payment_due';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  date: Date;
  actionRequired?: boolean;
  dismissed?: boolean;
} 