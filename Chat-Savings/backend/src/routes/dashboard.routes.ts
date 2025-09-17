import { Router } from 'express';
import { getMockData } from '../services/mockData.service';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', (req, res) => {
  const { users, policies, invoices, payments, reconciliations } = getMockData();
  const userId = req.query.userId as string;
  const userRole = req.query.userRole as string;
  
  // Get user to determine data scope
  const currentUser = userId ? users.find(u => u.id === userId) : null;
  
  // Filter data based on user role
  let filteredPolicies = policies;
  let filteredInvoices = invoices;
  let filteredPayments = payments;
  
  if (userRole === 'broker' && currentUser) {
    // Get all agents under this broker
    const brokerAgents = users.filter(u => u.role === 'agent' && u.brokerId === currentUser.id);
    const agentIds = brokerAgents.map(a => a.id);
    
    // Filter policies by broker's agents
    filteredPolicies = policies.filter(p => agentIds.includes(p.agentId));
    
    // Filter invoices by broker's policies
    const policyIds = filteredPolicies.map(p => p.id);
    filteredInvoices = invoices.filter(inv => policyIds.includes(inv.policyId));
    
    // Filter payments by broker's clients
    const clientIds = new Set(filteredPolicies.map(p => p.clientId));
    filteredPayments = payments.filter(p => clientIds.has(p.clientId));
  } else if (userRole === 'agent' && currentUser) {
    // Filter by specific agent
    filteredPolicies = policies.filter(p => p.agentId === currentUser.id);
    const policyIds = filteredPolicies.map(p => p.id);
    filteredInvoices = invoices.filter(inv => policyIds.includes(inv.policyId));
    const clientIds = new Set(filteredPolicies.map(p => p.clientId));
    filteredPayments = payments.filter(p => clientIds.has(p.clientId));
  }
  
  // Calculate revenue from completed payments (consistent with insights)
  const totalRevenue = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const clients = userRole === 'admin' 
    ? users.filter(u => u.role === 'client')
    : [...new Set(filteredPolicies.map(p => p.client))];
    
  const totalClients = userRole === 'admin' 
    ? clients.length 
    : new Set(filteredPolicies.map(p => p.clientId)).size;
  
  const outstandingPayments = filteredInvoices
    .filter(inv => ['sent', 'partially_paid', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  const overdueInvoices = filteredInvoices.filter(inv => inv.status === 'overdue').length;
  
  // Filter reconciliations based on filtered payments
  const paymentIds = filteredPayments.map(p => p.id);
  const filteredReconciliations = reconciliations.filter(r => paymentIds.includes(r.paymentId));
  const matchedReconciliations = filteredReconciliations.filter(r => r.status === 'matched').length;
  const reconciliationRate = filteredReconciliations.length > 0 
    ? (matchedReconciliations / filteredReconciliations.length) * 100 
    : 0;
  
  const recentPayments = filteredPayments
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 10);
  
  const upcomingInvoices = filteredInvoices
    .filter(inv => inv.status === 'sent' && new Date(inv.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 10);
  
  res.json({
    totalClients,
    totalPolicies: filteredPolicies.filter(p => p.status === 'active').length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    outstandingPayments: Math.round(outstandingPayments * 100) / 100,
    overdueInvoices,
    reconciliationRate: Math.round(reconciliationRate * 10) / 10,
    recentPayments,
    upcomingInvoices,
  });
});
