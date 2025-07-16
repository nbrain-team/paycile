// User types
export type UserRole = 'admin' | 'agent' | 'client' | 'superadmin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  companyName?: string;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Insurance Company types
export interface InsuranceCompany {
  id: string;
  name: string;
  code: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo?: {
    phone: string;
    email: string;
    website?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Policy types
export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface Policy {
  id: string;
  policyNumber: string;
  clientId: string;
  client?: User;
  agentId?: string;
  agent?: User;
  insuranceCompanyId: string;
  insuranceCompany?: InsuranceCompany;
  policyType: string;
  premiumAmount: number;
  paymentFrequency: PaymentFrequency;
  effectiveDate: Date;
  expirationDate: Date;
  status: string;
  policyDetails?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  policyId: string;
  policy?: Policy;
  clientId: string;
  client?: User;
  amount: number;
  dueDate: Date;
  status: InvoiceStatus;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Payment types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'ach' | 'credit_card' | 'debit_card' | 'wire' | 'check' | 'cash';

export interface Payment {
  id: string;
  paymentReference: string;
  clientId: string;
  client?: User;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentDate: Date;
  processorReference?: string;
  paymentDetails?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Reconciliation types
export type ReconciliationStatus = 'unmatched' | 'matched' | 'partial' | 'disputed' | 'resolved';

export interface Reconciliation {
  id: string;
  paymentId: string;
  payment?: Payment;
  invoiceId?: string;
  invoice?: Invoice;
  status: ReconciliationStatus;
  confidenceScore?: number;
  aiSuggestions?: {
    suggestedMatches?: Array<{
      invoiceId: string;
      confidence: number;
      reason: string;
    }>;
    anomalies?: string[];
  };
  manualNotes?: string;
  reconciledBy?: string;
  reconciledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard types
export interface DashboardStats {
  totalClients: number;
  totalPolicies: number;
  totalRevenue: number;
  outstandingPayments: number;
  overdueInvoices: number;
  reconciliationRate: number;
  recentPayments: Payment[];
  upcomingInvoices: Invoice[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  companyName?: string;
  phone?: string;
} 