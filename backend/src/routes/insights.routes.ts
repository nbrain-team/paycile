import { Router } from 'express';
import { getMockData } from '../services/mockData.service';

export const insightsRouter = Router();

insightsRouter.get('/', (req, res) => {
  const { payments, invoices, policies, users, reconciliations } = getMockData();
  
  // Calculate metrics
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth());
  
  // Total revenue
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
    
  // Revenue this month
  const revenueThisMonth = payments
    .filter(p => p.status === 'completed' && new Date(p.paymentDate) >= thisMonth)
    .reduce((sum, p) => sum + p.amount, 0);
    
  // Revenue last month
  const revenueLastMonth = payments
    .filter(p => p.status === 'completed' && new Date(p.paymentDate) >= lastMonth && new Date(p.paymentDate) < thisMonth)
    .reduce((sum, p) => sum + p.amount, 0);
    
  const revenueGrowth = revenueLastMonth > 0 
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : 0;
  
  // Active policies
  const activePolicies = policies.filter(p => p.status === 'active').length;
  const newPoliciesThisMonth = policies.filter(p => 
    new Date(p.createdAt) >= thisMonth
  ).length;
  
  // Collection rate
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCollected = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const collectionRate = totalInvoiced > 0 
    ? Math.round((totalCollected / totalInvoiced) * 100)
    : 0;
  
  // Overdue amount
  const overdueInvoices = invoices.filter(inv => 
    inv.status === 'overdue' || 
    (inv.status === 'sent' && new Date(inv.dueDate) < now)
  );
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  // Average days to pay
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const daysToPay = paidInvoices.map(inv => {
    const payment = payments.find(p => {
      const recon = reconciliations.find(r => r.invoiceId === inv.id && r.paymentId === p.id);
      return recon;
    });
    if (payment) {
      const daysToPayment = Math.floor(
        (new Date(payment.paymentDate).getTime() - new Date(inv.createdAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      return daysToPayment;
    }
    return 0;
  }).filter(days => days > 0);
  
  const avgDaysToPay = daysToPay.length > 0
    ? Math.round(daysToPay.reduce((sum, days) => sum + days, 0) / daysToPay.length)
    : 0;
  
  // Revenue trend (last 6 months)
  const revenueTrend = {
    labels: [],
    values: [],
  };
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const monthRevenue = payments
      .filter(p => {
        const paymentDate = new Date(p.paymentDate);
        return p.status === 'completed' &&
          paymentDate.getMonth() === date.getMonth() &&
          paymentDate.getFullYear() === date.getFullYear();
      })
      .reduce((sum, p) => sum + p.amount, 0);
    
    revenueTrend.labels.push(monthName);
    revenueTrend.values.push(monthRevenue);
  }
  
  // Payment methods distribution
  const paymentMethodCounts = {
    credit_card: 0,
    ach: 0,
    check: 0,
    wire: 0,
  };
  payments.forEach(p => {
    if (p.paymentMethod in paymentMethodCounts) {
      paymentMethodCounts[p.paymentMethod as keyof typeof paymentMethodCounts]++;
    }
  });
  const paymentMethods = Object.values(paymentMethodCounts);
  
  // Policy types distribution
  const policyTypeCounts: Record<string, number> = {};
  policies.forEach(p => {
    policyTypeCounts[p.policyType] = (policyTypeCounts[p.policyType] || 0) + 1;
  });
  const policyTypes = {
    labels: Object.keys(policyTypeCounts),
    values: Object.values(policyTypeCounts),
  };
  
  // Reconciliation status
  const reconStatusCounts = {
    matched: reconciliations.filter(r => r.status === 'matched').length,
    partially_matched: reconciliations.filter(r => r.status === 'partially_matched').length,
    unmatched: reconciliations.filter(r => r.status === 'unmatched').length,
    disputed: reconciliations.filter(r => r.status === 'disputed').length,
  };
  const reconciliationStatus = Object.values(reconStatusCounts);
  
  // Agent performance
  const agents = users.filter(u => u.role === 'agent');
  const agentMetrics = agents.map(agent => {
    const agentPolicies = policies.filter(p => p.agentId === agent.id);
    const agentPremium = agentPolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
    return {
      name: `${agent.firstName} ${agent.lastName}`,
      policies: agentPolicies.length,
      premium: agentPremium,
    };
  }).sort((a, b) => b.premium - a.premium);
  
  const agentPerformance = {
    labels: agentMetrics.map(a => a.name),
    policies: agentMetrics.map(a => a.policies),
    premiums: agentMetrics.map(a => a.premium),
  };
  
  const topAgent = agentMetrics[0];
  const avgPremiumPerAgent = agents.length > 0
    ? Math.round(agentMetrics.reduce((sum, a) => sum + a.premium, 0) / agents.length)
    : 0;
  
  // Client metrics
  const clients = users.filter(u => u.role === 'client');
  const clientSegments = [
    clients.filter(c => !c.companyName).length, // Individual
    clients.filter(c => c.companyName && policies.filter(p => p.clientId === c.id).length < 5).length, // Small Business
    clients.filter(c => c.companyName && policies.filter(p => p.clientId === c.id).length >= 5).length, // Enterprise
  ];
  
  // Payment behavior
  const onTimePayments = payments.filter(p => {
    const recon = reconciliations.find(r => r.paymentId === p.id);
    if (recon?.invoice) {
      const daysDiff = Math.floor(
        (new Date(p.paymentDate).getTime() - new Date(recon.invoice.dueDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      return daysDiff <= 0;
    }
    return false;
  }).length;
  
  const paymentBehavior = [
    onTimePayments,
    Math.floor(payments.length * 0.2), // Late <30d
    Math.floor(payments.length * 0.08), // Late >30d
    Math.floor(payments.length * 0.02), // Default
  ];
  
  // AI Insights
  const aiInsights = [
    {
      type: 'positive',
      title: 'Strong Collection Performance',
      description: `Your collection rate of ${collectionRate}% is above industry average. Revenue has grown ${revenueGrowth}% month-over-month.`,
      recommendation: 'Maintain current collection strategies and consider offering early payment discounts to further improve cash flow.',
    },
    {
      type: 'warning',
      title: 'Overdue Payments Alert',
      description: `There are ${overdueInvoices.length} overdue invoices totaling $${overdueAmount.toLocaleString()}.`,
      recommendation: 'Prioritize follow-ups on overdue accounts and consider automated payment reminders.',
    },
    {
      type: 'info',
      title: 'Payment Method Optimization',
      description: `${Math.round((paymentMethodCounts.ach / payments.length) * 100)}% of payments are via ACH, which has lower processing fees.`,
      recommendation: 'Encourage more clients to use ACH transfers to reduce transaction costs.',
    },
  ];
  
  res.json({
    success: true,
    data: {
      // Overview metrics
      totalRevenue,
      revenueGrowth,
      activePolicies,
      newPoliciesThisMonth,
      collectionRate,
      overdueAmount,
      avgDaysToPay,
      daysToPayTrend: -5, // Mock improvement
      
      // Charts data
      revenueTrend,
      paymentMethods,
      policyTypes,
      reconciliationStatus,
      
      // Agent metrics
      agentPerformance,
      topAgent,
      avgPremiumPerAgent,
      totalAgents: agents.length,
      agentRetention: 92, // Mock
      
      // Client metrics
      totalClients: clients.length,
      clientSegments,
      paymentBehavior,
      clientRetention: 88, // Mock
      avgPoliciesPerClient: Math.round(policies.filter(p => p.status === 'active').length / clients.length),
      avgClientValue: Math.round(totalRevenue / clients.length),
      
      // AI/Predictive
      aiInsights,
      defaultRisk: 3.2, // Mock
      expectedCollections: Math.round(invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0) * 0.92),
      churnProbability: 7.5, // Mock
    },
  });
}); 