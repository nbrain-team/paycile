import { Router } from 'express';
export const dashboardRouter = Router();
dashboardRouter.get('/stats', (req, res) => res.json({ 
  totalClients: 0,
  totalPolicies: 0,
  totalRevenue: 0,
  outstandingPayments: 0,
  overdueInvoices: 0,
  reconciliationRate: 0,
  recentPayments: [],
  upcomingInvoices: []
}));
