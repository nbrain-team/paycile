import { Router } from 'express';
import { getMockData } from '../services/mockData.service';
import { v4 as uuidv4 } from 'uuid';

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

// Create new payment
paymentRouter.post('/', (req, res) => {
  const { invoiceId, clientId, amount, paymentMethod, paymentDate } = req.body;
  const { payments, invoices, reconciliations, policies } = getMockData();
  
  // Find the invoice if provided
  let invoice = null;
  if (invoiceId) {
    invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
  }
  
  // Create the payment
  const newPayment = {
    id: uuidv4(),
    paymentReference: `PAY-${new Date().getFullYear()}-${String(payments.length + 1).padStart(6, '0')}`,
    clientId: clientId || invoice?.clientId,
    client: invoice?.client,
    amount: parseFloat(amount),
    paymentMethod,
    status: 'completed',
    paymentDate: new Date(paymentDate || new Date()),
    processorReference: `STRIPE-${Math.random().toString(36).substring(7)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  payments.push(newPayment);
  
  // Create reconciliation if invoice is provided
  if (invoice) {
    const newReconciliation = {
      id: uuidv4(),
      paymentId: newPayment.id,
      payment: newPayment,
      invoiceId: invoice.id,
      invoice,
      status: newPayment.amount >= invoice.amount ? 'matched' : 'partially_matched',
      confidenceScore: 1.0, // Manual match has 100% confidence
      manualNotes: `Payment created from invoice ${invoice.invoiceNumber}`,
      reconciledBy: 'manual',
      reconciledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    reconciliations.push(newReconciliation);
    
    // Update invoice status
    if (newPayment.amount >= invoice.amount) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partially_paid';
    }
    invoice.updatedAt = new Date();
  }
  
  res.status(201).json({
    success: true,
    data: newPayment,
    message: 'Payment created successfully'
  });
});
