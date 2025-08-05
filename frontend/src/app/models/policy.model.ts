export interface Policy {
  id: string;
  policyNumber: string;
  clientId: string;
  clientName?: string;
  client?: {
    firstName: string;
    lastName: string; 
    companyName?: string;
    email?: string;
    phone?: string;
  };
  insuranceCompanyId: string;
  insuranceCompany?: {
    id: string;
    name: string;
  };
  policyType: string;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  effectiveDate: string;
  expirationDate: string;
  premiumAmount: number;
  annualPremium?: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  agentId?: string;
  agentName?: string;
  agent?: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  coverageDetails?: any;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PolicyResponse {
  data: Policy[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
  };
  // Legacy format support
  policies?: Policy[];
  total?: number;
  page?: number;
  totalPages?: number;
} 