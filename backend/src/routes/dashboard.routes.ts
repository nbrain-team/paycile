import { Router } from 'express';
import { getMockData } from '../services/mockData.service';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', (req, res) => {
  const { users, policies, invoices, payments, reconciliations } = getMockData();
  
  const clients = users.filter(u => u.role === 'client');
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  const outstandingPayments = invoices
    .filter(inv => ['sent', 'partially_paid', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
  
  const matchedReconciliations = reconciliations.filter(r => r.status === 'matched').length;
  const reconciliationRate = (matchedReconciliations / reconciliations.length) * 100;
  
  const recentPayments = payments
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 10);
  
  const upcomingInvoices = invoices
    .filter(inv => inv.status === 'sent' && new Date(inv.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 10);
  
  res.json({
    totalClients: clients.length,
    totalPolicies: policies.filter(p => p.status === 'active').length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    outstandingPayments: Math.round(outstandingPayments * 100) / 100,
    overdueInvoices,
    reconciliationRate: Math.round(reconciliationRate * 10) / 10,
    recentPayments,
    upcomingInvoices,
  });
});
