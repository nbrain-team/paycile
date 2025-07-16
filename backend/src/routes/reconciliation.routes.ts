import { Router } from 'express';
import { getMockData } from '../services/mockData.service';
import { v4 as uuidv4 } from 'uuid';

export const reconciliationRouter = Router();

reconciliationRouter.get('/', (req, res) => {
  const { reconciliations } = getMockData();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  
  let filteredReconciliations = [...reconciliations];
  
  if (status) {
    filteredReconciliations = filteredReconciliations.filter(r => r.status === status);
  }
  
  // Sort by created date descending
  filteredReconciliations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const total = filteredReconciliations.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedReconciliations = filteredReconciliations.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedReconciliations,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Accept AI Suggestion
reconciliationRouter.post('/:id/accept-suggestion', (req, res) => {
  const { reconciliations } = getMockData();
  const { invoiceId } = req.body;
  
  const reconciliation = reconciliations.find(r => r.id === req.params.id);
  
  if (!reconciliation) {
    return res.status(404).json({
      success: false,
      error: 'Reconciliation not found'
    });
  }
  
  // Update the reconciliation
  reconciliation.status = 'matched';
  reconciliation.invoiceId = invoiceId;
  reconciliation.confidenceScore = 0.95;
  reconciliation.reconciledBy = 'AI';
  reconciliation.reconciledAt = new Date();
  reconciliation.updatedAt = new Date();
  
  res.json({
    success: true,
    data: reconciliation,
    message: 'AI suggestion accepted and reconciliation matched successfully'
  });
});

// Resolve Dispute
reconciliationRouter.post('/:id/resolve-dispute', (req, res) => {
  const { reconciliations } = getMockData();
  const { notes } = req.body;
  
  const reconciliation = reconciliations.find(r => r.id === req.params.id);
  
  if (!reconciliation) {
    return res.status(404).json({
      success: false,
      error: 'Reconciliation not found'
    });
  }
  
  // Update the reconciliation
  reconciliation.status = 'matched';
  reconciliation.manualNotes = notes;
  reconciliation.reconciledBy = 'Manual';
  reconciliation.reconciledAt = new Date();
  reconciliation.updatedAt = new Date();
  
  res.json({
    success: true,
    data: reconciliation,
    message: 'Dispute resolved successfully'
  });
});

// Manual Match
reconciliationRouter.post('/:id/manual-match', (req, res) => {
  const { reconciliations, invoices } = getMockData();
  const { invoiceId } = req.body;
  
  const reconciliation = reconciliations.find(r => r.id === req.params.id);
  const invoice = invoices.find(i => i.id === invoiceId);
  
  if (!reconciliation) {
    return res.status(404).json({
      success: false,
      error: 'Reconciliation not found'
    });
  }
  
  if (!invoice) {
    return res.status(404).json({
      success: false,
      error: 'Invoice not found'
    });
  }
  
  // Update the reconciliation
  reconciliation.status = 'matched';
  reconciliation.invoiceId = invoiceId;
  reconciliation.invoice = invoice;
  reconciliation.confidenceScore = 1.0;
  reconciliation.reconciledBy = 'Manual';
  reconciliation.reconciledAt = new Date();
  reconciliation.updatedAt = new Date();
  
  res.json({
    success: true,
    data: reconciliation,
    message: 'Payment manually matched to invoice successfully'
  });
});
