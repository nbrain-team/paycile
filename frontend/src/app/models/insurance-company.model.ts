export interface InsuranceCompany {
  id: string;
  name: string;
  code: string;
  brokerId: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  commissionRate: number;
  claimsEmail?: string;
  claimsPhone?: string;
  policyTypes: string[];
  paymentWaterfall: PaymentWaterfallItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWaterfallItem {
  id: string;
  type: 'premium' | 'tax' | 'fee';
  priority: number;
  description: string;
}

export interface InsuranceCompanyFilters {
  brokerId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InsuranceCompanyResponse {
  success: boolean;
  data: InsuranceCompany[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InsuranceCompanyStats {
  totalCompanies: number;
  activeCompanies: number;
  averageCommissionRate: number;
  totalPolicyTypes: number;
}

export interface CreateInsuranceCompanyRequest {
  name: string;
  code: string;
  brokerId: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  commissionRate: number;
  claimsEmail?: string;
  claimsPhone?: string;
  policyTypes: string[];
  paymentWaterfall?: PaymentWaterfallItem[];
}

export interface UpdateInsuranceCompanyRequest extends Partial<CreateInsuranceCompanyRequest> {
  isActive?: boolean;
} 