export interface Payment {
  id: string;
  paymentReference: string;
  clientId: string;
  client?: {
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  invoiceId?: string;
  amount: number;
  paymentMethod: 'credit_card' | 'ach' | 'check' | 'wire';
  paymentDate: string;
  status: 'completed' | 'pending' | 'failed';
  allocations?: PaymentAllocation[];
  notes?: string;
  reconciliation?: {
    invoice?: {
      id: string;
      invoiceNumber: string;
      amount: number;
      lineItems?: Array<{
        id: string;
        type: 'premium' | 'tax' | 'fee';
        description: string;
        amount: number;
      }>;
      policy?: {
        policyNumber: string;
        policyType: string;
        insuranceCompany?: {
          name: string;
          paymentWaterfall?: Array<{
            type: string;
            description: string;
            priority: number;
          }>;
        };
      };
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocation {
  id: string;
  recipientType: 'broker' | 'agent' | 'insurance_company';
  recipientId: string;
  recipientName: string;
  amount: number;
  percentage: number;
  allocationType: 'commission' | 'premium' | 'fee';
}

export interface Reconciliation {
  id: string;
  paymentId: string;
  invoiceId: string;
  status: 'matched' | 'disputed' | 'unmatched';
  matchedAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFilters {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface PaymentResponse {
  data: Payment[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface ReconciliationResponse {
  data: Reconciliation[];
  meta?: {
    total: number;
    page: number;
    totalPages: number;
  };
} 