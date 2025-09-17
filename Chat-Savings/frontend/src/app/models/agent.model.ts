export interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'agent' | 'broker';
  isActive: boolean;
  brokerId?: string;
  broker?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  licenseNumber?: string;
  department?: string;
  hireDate?: string;
  // Performance metrics
  totalClients?: number;
  totalPolicies?: number;
  totalRevenue?: number;
  monthlyTarget?: number;
  ytdSales?: number;
  conversionRate?: number;
  avgResponseTime?: number;
  // Activity
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  brokerId?: string;
  isActive?: boolean;
  department?: string;
}

export interface AgentResponse {
  data: Agent[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  avgPoliciesPerAgent: number;
  topPerformer: Agent;
  totalRevenue: number;
  avgConversionRate: number;
}

export interface AgentPerformance {
  agentId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  metrics: {
    newClients: number;
    newPolicies: number;
    revenue: number;
    renewals: number;
    cancellations: number;
    netGrowth: number;
  };
  comparison?: {
    previousPeriod: number;
    percentageChange: number;
  };
} 