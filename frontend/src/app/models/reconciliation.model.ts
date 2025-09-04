export interface Reconciliation {
  id: string;
  paymentId: string;
  payment?: {
    paymentReference: string;
    amount: number;
    paymentDate: string;
    client?: {
      firstName: string;
      lastName: string;
      companyName?: string;
    };
  };
  invoiceId?: string;
  invoice?: {
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    status: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
    lineItems?: Array<{
      id: string;
      description: string;
      type: 'premium' | 'tax' | 'fee';
      amount: number;
    }>;
  };
  status: 'matched' | 'unmatched' | 'disputed';
  matchedAmount: number;
  confidence?: number; // percentage 0-100
  suggestedInvoiceId?: string;
  suggestedInvoice?: {
    invoiceNumber: string;
    amount: number;
    confidence: number;
  };
  notes?: string;
  aiSuggestions?: {
    suggestedMatches?: Array<{
      invoiceId: string;
      confidence: number;
      reason: string;
    }>;
    anomalies?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AISuggestion {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  confidence: number;
  reasons: string[];
}

export interface ReconciliationFilters {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface ReconciliationResponse {
  data: Reconciliation[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface ReconciliationStats {
  total: number;
  matched: number;
  unmatched: number;
  disputed: number;
  matchRate: number;
  totalAmount: number;
  reconciledAmount: number;
} 