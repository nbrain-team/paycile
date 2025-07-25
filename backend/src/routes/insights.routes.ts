import { Router } from 'express';
import { getMockData } from '../services/mockData.service';

export const insightsRouter = Router();

insightsRouter.get('/', (req, res) => {
  const { payments, invoices, policies, users, reconciliations } = getMockData();
  const userId = req.query.userId as string;
  const userRole = req.query.userRole as string;
  
  // Get user to determine data scope
  const currentUser = userId ? users.find(u => u.id === userId) : null;
  
  // Filter data based on user role
  let filteredPolicies = policies;
  let filteredInvoices = invoices;
  let filteredPayments = payments;
  let filteredUsers = users;
  
  if (userRole === 'broker' && currentUser) {
    // Get all agents under this broker
    const brokerAgents = users.filter(u => u.role === 'agent' && u.brokerId === currentUser.id);
    const agentIds = brokerAgents.map(a => a.id);
    
    // Filter policies by broker's agents
    filteredPolicies = policies.filter(p => agentIds.includes(p.agentId));
    
    // Filter invoices by broker's policies
    const policyIds = filteredPolicies.map(p => p.id);
    filteredInvoices = invoices.filter(inv => policyIds.includes(inv.policyId));
    
    // Filter payments by broker's invoices/reconciliations
    const invoiceIds = filteredInvoices.map(inv => inv.id);
    filteredPayments = payments.filter(p => {
      const recon = reconciliations.find(r => r.paymentId === p.id);
      return recon && invoiceIds.includes(recon.invoiceId);
    });
    
    // Only show broker's agents in metrics
    filteredUsers = users.filter(u => 
      u.role === 'client' || 
      (u.role === 'agent' && u.brokerId === currentUser.id) ||
      u.id === currentUser.id
    );
  } else if (userRole === 'agent' && currentUser) {
    // Filter by specific agent
    filteredPolicies = policies.filter(p => p.agentId === currentUser.id);
    const policyIds = filteredPolicies.map(p => p.id);
    filteredInvoices = invoices.filter(inv => policyIds.includes(inv.policyId));
    
    const invoiceIds = filteredInvoices.map(inv => inv.id);
    filteredPayments = payments.filter(p => {
      const recon = reconciliations.find(r => r.paymentId === p.id);
      return recon && invoiceIds.includes(recon.invoiceId);
    });
  }
  
  // Calculate metrics
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth());
  
  // Total revenue (only completed payments)
  const totalRevenue = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
    
  // Revenue this month
  const revenueThisMonth = filteredPayments
    .filter(p => p.status === 'completed' && new Date(p.paymentDate) >= thisMonth)
    .reduce((sum, p) => sum + p.amount, 0);
    
  // Revenue last month
  const revenueLastMonth = filteredPayments
    .filter(p => p.status === 'completed' && new Date(p.paymentDate) >= lastMonth && new Date(p.paymentDate) < thisMonth)
    .reduce((sum, p) => sum + p.amount, 0);
    
  const revenueGrowth = revenueLastMonth > 0 
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : 0;
  
  // Active policies
  const activePolicies = filteredPolicies.filter(p => p.status === 'active').length;
  const newPoliciesThisMonth = filteredPolicies.filter(p => 
    new Date(p.createdAt) >= thisMonth
  ).length;
  
  // Collection rate
  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCollected = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const collectionRate = totalInvoiced > 0 
    ? Math.round((totalCollected / totalInvoiced) * 100)
    : 0;
  
  // Overdue amount
  const overdueInvoices = filteredInvoices.filter(inv => 
    inv.status === 'overdue' || 
    (inv.status === 'sent' && new Date(inv.dueDate) < now)
  );
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  // Average days to pay
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid');
  const daysToPay = paidInvoices.map(inv => {
    const payment = filteredPayments.find(p => {
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
    const monthRevenue = filteredPayments
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
  filteredPayments.forEach(p => {
    if (p.paymentMethod in paymentMethodCounts) {
      paymentMethodCounts[p.paymentMethod as keyof typeof paymentMethodCounts]++;
    }
  });
  const paymentMethods = Object.values(paymentMethodCounts);
  
  // Policy types distribution
  const policyTypeCounts: Record<string, number> = {};
  filteredPolicies.forEach(p => {
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
  
  // Agent performance - Get actual agents
  const agents = filteredUsers.filter(u => u.role === 'agent');
  
  // Calculate metrics for each agent based on actual data
  const agentMetrics = agents.map(agent => {
    // Get all policies for this agent
    const agentPolicies = filteredPolicies.filter(p => p.agentId === agent.id);
    
    // Calculate total premium from agent's policies
    const agentPremium = agentPolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
    
    // Get unique clients for this agent
    const uniqueClients = new Set(agentPolicies.map(p => p.clientId)).size;
    
    // Calculate collected amount for this agent's policies
    const agentInvoices = filteredInvoices.filter(inv => 
      agentPolicies.some(p => p.id === inv.policyId)
    );
    const agentCollected = agentInvoices
      .filter(inv => inv.status === 'paid' || inv.status === 'partially_paid')
      .reduce((sum, inv) => {
        // Find payments for this invoice
        const invoicePayments = filteredPayments.filter(p => {
          const recon = reconciliations.find(r => r.invoiceId === inv.id && r.paymentId === p.id);
          return recon && p.status === 'completed';
        });
        return sum + invoicePayments.reduce((psum, p) => psum + p.amount, 0);
      }, 0);
    
    return {
      id: agent.id,
      name: `${agent.firstName} ${agent.lastName}`,
      email: agent.email,
      policies: agentPolicies.length,
      premium: agentPremium,
      collected: agentCollected,
      clients: uniqueClients,
      conversionRate: agentPolicies.length > 0 ? 
        Math.round((agentPolicies.filter(p => p.status === 'active').length / agentPolicies.length) * 100) : 0,
    };
  }).sort((a, b) => b.premium - a.premium);
  
  // Agent performance chart data
  const agentPerformance = {
    labels: agentMetrics.map(a => a.name),
    policies: agentMetrics.map(a => a.policies),
    premiums: agentMetrics.map(a => a.premium),
    collected: agentMetrics.map(a => a.collected),
  };
  
  const topAgent = agentMetrics[0];
  const avgPremiumPerAgent = agents.length > 0
    ? Math.round(agentMetrics.reduce((sum, a) => sum + a.premium, 0) / agents.length)
    : 0;
    
  // Calculate agent retention (mock - but could be based on active status)
  const activeAgents = agents.filter(a => a.isActive).length;
  const agentRetention = agents.length > 0 ? Math.round((activeAgents / agents.length) * 100) : 100;
  
  // Client metrics
  const clients = filteredUsers.filter(u => u.role === 'client');
  const clientSegments = [
    clients.filter(c => !c.companyName).length, // Individual
    clients.filter(c => c.companyName && filteredPolicies.filter(p => p.clientId === c.id).length < 5).length, // Small Business
    clients.filter(c => c.companyName && filteredPolicies.filter(p => p.clientId === c.id).length >= 5).length, // Enterprise
  ];
  
  // Payment behavior based on actual payment data
  const onTimePayments = filteredPayments.filter(p => {
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
  
  const latePayments30 = filteredPayments.filter(p => {
    const recon = reconciliations.find(r => r.paymentId === p.id);
    if (recon?.invoice) {
      const daysDiff = Math.floor(
        (new Date(p.paymentDate).getTime() - new Date(recon.invoice.dueDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      return daysDiff > 0 && daysDiff <= 30;
    }
    return false;
  }).length;
  
  const latePaymentsOver30 = filteredPayments.filter(p => {
    const recon = reconciliations.find(r => r.paymentId === p.id);
    if (recon?.invoice) {
      const daysDiff = Math.floor(
        (new Date(p.paymentDate).getTime() - new Date(recon.invoice.dueDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      return daysDiff > 30;
    }
    return false;
  }).length;
  
  const defaultedPayments = filteredInvoices.filter(inv => 
    inv.status === 'overdue' && 
    Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)) > 90
  ).length;
  
  const paymentBehavior = [onTimePayments, latePayments30, latePaymentsOver30, defaultedPayments];
  
  // Calculate actual client metrics
  const avgPoliciesPerClient = clients.length > 0
    ? filteredPolicies.filter(p => p.status === 'active').length / clients.length
    : 0;
    
  const avgClientValue = clients.length > 0
    ? totalRevenue / clients.length
    : 0;
  
  // AI Insights with actual data
  const generateAIInsights = () => {
    const insights = [];
    
    // Collection performance insight
    if (collectionRate >= 85) {
      insights.push({
        type: 'positive',
        title: 'Strong Collection Performance',
        description: `Your collection rate of ${collectionRate}% is above industry average. Revenue has ${revenueGrowth >= 0 ? 'grown' : 'declined'} ${Math.abs(revenueGrowth)}% month-over-month.`,
        recommendation: 'Maintain current collection strategies and consider offering early payment discounts to further improve cash flow.',
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Collection Rate Needs Improvement',
        description: `Your collection rate of ${collectionRate}% is below industry average. Revenue has ${revenueGrowth >= 0 ? 'grown' : 'declined'} ${Math.abs(revenueGrowth)}% month-over-month.`,
        recommendation: 'Implement automated payment reminders and follow-up procedures to improve collection rates.',
      });
    }
    
    // Overdue payments insight
    if (overdueInvoices.length > 10) {
      insights.push({
        type: 'warning',
        title: 'High Number of Overdue Payments',
        description: `There are ${overdueInvoices.length} overdue invoices totaling $${overdueAmount.toLocaleString()}.`,
        recommendation: 'Prioritize follow-ups on overdue accounts and consider implementing automated payment reminders.',
      });
    } else if (overdueInvoices.length > 0) {
      insights.push({
        type: 'info',
        title: 'Overdue Payments Under Control',
        description: `You have ${overdueInvoices.length} overdue invoices totaling $${overdueAmount.toLocaleString()}.`,
        recommendation: 'Continue monitoring overdue accounts and maintain current collection practices.',
      });
    }
    
    // Top agent insight
    if (topAgent && agentMetrics.length > 1) {
      const secondAgent = agentMetrics[1];
      const performanceGap = topAgent.premium - secondAgent.premium;
      insights.push({
        type: 'info',
        title: 'Top Performing Agent',
        description: `${topAgent.name} leads with ${topAgent.policies} policies and $${topAgent.premium.toLocaleString()} in total premiums, ${Math.round((performanceGap / secondAgent.premium) * 100)}% ahead of the next agent.`,
        recommendation: `Share ${topAgent.name}'s best practices with other agents to improve overall performance.`,
      });
    }
    
    // Payment method optimization
    const achPercentage = filteredPayments.length > 0 ? Math.round((paymentMethodCounts.ach / filteredPayments.length) * 100) : 0;
    if (achPercentage >= 30) {
      insights.push({
        type: 'positive',
        title: 'Efficient Payment Method Mix',
        description: `${achPercentage}% of payments are via ACH, which has lower processing fees than credit cards.`,
        recommendation: 'Good ACH adoption rate. Continue promoting ACH to maximize cost savings.',
      });
    } else {
      insights.push({
        type: 'info',
        title: 'Payment Method Optimization Opportunity',
        description: `Only ${achPercentage}% of payments are via ACH. Credit card fees are reducing your net revenue.`,
        recommendation: 'Encourage more clients to use ACH transfers by offering incentives or highlighting the security benefits.',
      });
    }
    
    // Policy expiration insight
    const expiringPolicies = filteredPolicies.filter(p => {
      const expirationDate = new Date(p.expirationDate);
      const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
    });
    
    if (expiringPolicies.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Policies Expiring Soon',
        description: `${expiringPolicies.length} policies are expiring in the next 30 days, representing $${expiringPolicies.reduce((sum, p) => sum + p.premiumAmount, 0).toLocaleString()} in annual premiums.`,
        recommendation: 'Contact these clients immediately to begin renewal discussions and prevent policy lapses.',
      });
    }
    
    // Add a random insight to make refreshes feel dynamic
    const randomInsights = [
      {
        type: 'info',
        title: 'Seasonal Payment Patterns',
        description: 'Payment delays typically increase by 15% during holiday seasons.',
        recommendation: 'Plan cash flow accordingly and send payment reminders earlier during November-December.',
      },
      {
        type: 'positive',
        title: 'Digital Adoption Success',
        description: 'Online payment adoption has increased client satisfaction scores.',
        recommendation: 'Continue investing in digital payment options and self-service portals.',
      },
      {
        type: 'info',
        title: 'Client Communication Insights',
        description: 'Clients who receive payment reminders 7 days before due date pay 40% faster.',
        recommendation: 'Optimize your reminder schedule to send notifications exactly 7 days before due dates.',
      },
    ];
    
    // Add a random insight occasionally
    if (Math.random() > 0.5 && insights.length < 5) {
      insights.push(randomInsights[Math.floor(Math.random() * randomInsights.length)]);
    }
    
    return insights;
  };
  
  const aiInsights = generateAIInsights();
  
  // Predictive analytics based on trends
  const defaultRisk = overdueInvoices.length > 0 
    ? Math.round((defaultedPayments / filteredInvoices.length) * 100 * 10) / 10
    : 0;
    
  const expectedCollections = filteredInvoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.amount, 0) * (collectionRate / 100);
    
  const churnProbability = clients.length > 0
    ? Math.round((clients.filter(c => {
        const clientPolicies = filteredPolicies.filter(p => p.clientId === c.id);
        return clientPolicies.length > 0 && clientPolicies.every(p => p.status !== 'active');
      }).length / clients.length) * 100 * 10) / 10
    : 0;
  
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
      daysToPayTrend: avgDaysToPay > 20 ? 5 : -5, // Positive if worsening
      
      // Charts data
      revenueTrend,
      paymentMethods,
      policyTypes,
      reconciliationStatus,
      
      // Agent metrics with actual data
      agentPerformance,
      topAgent,
      avgPremiumPerAgent,
      totalAgents: agents.length,
      agentRetention,
      agentMetrics, // Include detailed metrics
      
      // Client metrics
      totalClients: clients.length,
      clientSegments,
      paymentBehavior,
      clientRetention: 88, // Could calculate based on active policies
      avgPoliciesPerClient: Math.round(avgPoliciesPerClient * 10) / 10,
      avgClientValue: Math.round(avgClientValue),
      
      // AI/Predictive
      aiInsights,
      defaultRisk,
      expectedCollections: Math.round(expectedCollections),
      churnProbability,
    },
  });
}); 