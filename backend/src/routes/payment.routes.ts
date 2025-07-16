import { Router } from 'express';
import { getMockData } from '../services/mockData.service';

export const paymentRouter = Router();

paymentRouter.get('/', (req, res) => {
  const { payments } = getMockData();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  
  let filteredPayments = [...payments];
  
  if (status) {
    filteredPayments = filteredPayments.filter(p => p.status === status);
  }
  
  // Sort by payment date descending
  filteredPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  
  const total = filteredPayments.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedPayments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get single payment by ID
paymentRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const { payments, reconciliations } = getMockData();
  
  const payment = payments.find(p => p.id === id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found'
    });
  }
  
  // Find reconciliation for this payment
  const reconciliation = reconciliations.find(r => r.paymentId === id);
  
  res.json({
    success: true,
    data: {
      ...payment,
      reconciliation
    }
  });
});

// Update payment amount
paymentRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const { payments } = getMockData();
  
  const paymentIndex = payments.findIndex(p => p.id === id);
  if (paymentIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found'
    });
  }
  
  // Update payment amount
  payments[paymentIndex] = {
    ...payments[paymentIndex],
    amount: parseFloat(amount),
    updatedAt: new Date()
  };
  
  res.json({
    success: true,
    data: payments[paymentIndex]
  });
});
