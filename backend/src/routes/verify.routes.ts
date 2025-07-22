import { Router } from 'express';
import { getMockData } from '../services/mockData.service';

export const verifyRouter = Router();

// Verify data consistency across the platform
verifyRouter.get('/data-consistency', (req, res) => {
  const { users, policies, invoices, payments, reconciliations } = getMockData();
  
  // Get all agents
  const agents = users.filter(u => u.role === 'agent');
  const clients = users.filter(u => u.role === 'client');
  
  // Verify agent metrics
  const agentMetrics = agents.map(agent => {
    // Calculate same metrics as user.routes.ts
    const agentPolicies = policies.filter(p => p.agentId === agent.id);
    const totalPremium = agentPolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
    const totalClients = new Set(agentPolicies.map(p => p.clientId)).size;
    
    // Calculate same metrics as insights.routes.ts
    const agentInvoices = invoices.filter(inv => 
      agentPolicies.some(p => p.id === inv.policyId)
    );
    const agentCollected = agentInvoices
      .filter(inv => inv.status === 'paid' || inv.status === 'partially_paid')
      .reduce((sum, inv) => {
        const invoicePayments = payments.filter(p => {
          const recon = reconciliations.find(r => r.invoiceId === inv.id && r.paymentId === p.id);
          return recon && p.status === 'completed';
        });
        return sum + invoicePayments.reduce((psum, p) => psum + p.amount, 0);
      }, 0);
    
    return {
      agent: `${agent.firstName} ${agent.lastName}`,
      email: agent.email,
      metrics: {
        policyCount: agentPolicies.length,
        totalPremium,
        totalClients,
        collected: agentCollected,
        activePolicies: agentPolicies.filter(p => p.status === 'active').length,
      }
    };
  });
  
  // Verify client counts
  const clientMetrics = {
    totalClients: clients.length,
    clientsWithPolicies: new Set(policies.map(p => p.clientId)).size,
    individualClients: clients.filter(c => !c.companyName).length,
    businessClients: clients.filter(c => c.companyName).length,
  };
  
  // Verify policy counts
  const policyMetrics = {
    totalPolicies: policies.length,
    activePolicies: policies.filter(p => p.status === 'active').length,
    pendingPolicies: policies.filter(p => p.status === 'pending').length,
    expiredPolicies: policies.filter(p => p.status === 'expired').length,
    policiesByType: policies.reduce((acc, p) => {
      acc[p.policyType] = (acc[p.policyType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
  
  // Verify financial metrics
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const collectionRate = totalInvoiced > 0 
    ? Math.round((totalRevenue / totalInvoiced) * 100)
    : 0;
    
  const financialMetrics = {
    totalRevenue,
    totalInvoiced,
    collectionRate,
    totalPayments: payments.length,
    completedPayments: payments.filter(p => p.status === 'completed').length,
    overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length,
    overdueAmount: invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0),
  };
  
  // Cross-reference checks
  const crossChecks = {
    allPoliciesHaveValidAgent: policies.every(p => agents.some(a => a.id === p.agentId)),
    allPoliciesHaveValidClient: policies.every(p => clients.some(c => c.id === p.clientId)),
    allInvoicesHaveValidPolicy: invoices.every(inv => policies.some(p => p.id === inv.policyId)),
    allPaymentsHaveValidClient: payments.every(pay => clients.some(c => c.id === pay.clientId)),
    totalAgentPolicies: agentMetrics.reduce((sum, a) => sum + a.metrics.policyCount, 0),
    actualTotalPolicies: policies.length,
    dataIntegrityCheck: agentMetrics.reduce((sum, a) => sum + a.metrics.policyCount, 0) === policies.length,
  };
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    agentMetrics,
    clientMetrics,
    policyMetrics,
    financialMetrics,
    crossChecks,
    summary: {
      dataConsistent: crossChecks.dataIntegrityCheck && 
                      crossChecks.allPoliciesHaveValidAgent && 
                      crossChecks.allPoliciesHaveValidClient,
      message: crossChecks.dataIntegrityCheck ? 
               'All data is consistent across the platform' : 
               'Data inconsistency detected',
    }
  });
}); 