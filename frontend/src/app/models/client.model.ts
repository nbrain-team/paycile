export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  dateOfBirth?: string;
  role: 'client';
  isActive: boolean;
  policyCount?: number;
  totalPremium?: number;
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
  // Relationships
  policies?: any[];
  invoices?: any[];
  payments?: any[];
  agentId?: string;
  agent?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ClientFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  agentId?: string;
  isActive?: boolean;
}

export interface ClientResponse {
  data: Client[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  totalPremiumValue: number;
  averagePoliciesPerClient: number;
} 