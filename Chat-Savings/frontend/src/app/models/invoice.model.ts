export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: {
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  policyId: string;
  policy?: {
    policyNumber: string;
  };
  amount: number;
  status: 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  lineItems?: InvoiceLineItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  type: 'premium' | 'tax' | 'fee' | 'other';
  amount: number;
}

export interface InvoiceFilters {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  policyId?: string;
}

export interface InvoiceResponse {
  data: Invoice[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface PaymentRequest {
  invoiceId: string;
  clientId: string;
  amount: number;
  paymentMethod: 'credit_card' | 'ach' | 'check' | 'wire';
  paymentDate: string;
} 