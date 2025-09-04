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

// Get single reconciliation by ID
reconciliationRouter.get('/:id', (req, res) => {
  const { reconciliations } = getMockData();
  const reconciliation = reconciliations.find(r => r.id === req.params.id);
  if (!reconciliation) {
    return res.status(404).json({ success: false, error: 'Reconciliation not found' });
  }
  res.json({ success: true, data: reconciliation });
});

// Run AI reconciliation over current data
reconciliationRouter.post('/run-ai', (req, res) => {
  const { payments, invoices, reconciliations } = getMockData();

  // Build quick lookup maps
  const invoiceById: Record<string, any> = {};
  invoices.forEach((inv: any) => { invoiceById[inv.id] = inv; });

  // Helper to score closeness by amount and date
  const scoreMatch = (payment: any, invoice: any) => {
    const amountDiff = Math.abs((payment.amount || 0) - (invoice.amount || 0));
    const amountScore = Math.max(0, 1 - (amountDiff / Math.max(1, invoice.amount)));
    const dateDiffDays = Math.abs(new Date(payment.paymentDate).getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24);
    const dateScore = Math.max(0, 1 - (dateDiffDays / 60)); // within ~2 months
    return (amountScore * 0.7 + dateScore * 0.3);
  };

  // Detect duplicates for anomaly flagging
  const paymentsByClientAndAmount: Record<string, any[]> = {};
  payments.forEach((p: any) => {
    const key = `${p.clientId}|${p.amount}`;
    if (!paymentsByClientAndAmount[key]) paymentsByClientAndAmount[key] = [];
    paymentsByClientAndAmount[key].push(p);
  });

  reconciliations.forEach((rec: any) => {
    const payment = rec.payment;
    const candidates = invoices.filter((inv: any) => inv.clientId === payment.clientId);
    const ranked = candidates
      .map((inv: any) => ({ inv, score: scoreMatch(payment, inv) }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3);

    const suggestedMatches = ranked.map((r: any) => ({
      invoiceId: r.inv.id,
      confidence: Math.round(r.score * 100),
      reason: `Amount diff $${Math.abs((payment.amount||0)-(r.inv.amount||0)).toFixed(2)}; Due ${new Date(r.inv.dueDate).toLocaleDateString()}`,
    }));

    const anomalies: string[] = [];
    if (rec.invoiceId) {
      const inv = invoiceById[rec.invoiceId];
      if (inv) {
        const diff = (payment.amount || 0) - (inv.amount || 0);
        if (Math.abs(diff) >= 1) {
          anomalies.push(diff > 0 ? 'Overpayment vs invoice amount' : 'Underpayment vs invoice amount');
        }
        if (new Date(payment.paymentDate) < new Date(inv.billingPeriodStart) || new Date(payment.paymentDate) > new Date(inv.billingPeriodEnd)) {
          anomalies.push('Payment date outside billing period');
        }
        if (inv.status === 'paid') {
          anomalies.push('Invoice already marked paid (possible duplicate)');
        }
      }
    } else {
      anomalies.push('No matched invoice');
    }

    const duplicateKey = `${payment.clientId}|${payment.amount}`;
    if (paymentsByClientAndAmount[duplicateKey]?.length > 1) {
      anomalies.push('Possible duplicate payment detected');
    }

    // If unmatched but there are good suggestions, keep unmatched but add suggestions
    // Update confidenceScore as the best suggestion score or existing match score
    const bestConfidence = suggestedMatches.length > 0 ? suggestedMatches[0].confidence : (rec.confidenceScore ? Math.round(rec.confidenceScore * 100) : 0);
    rec.aiSuggestions = { suggestedMatches, anomalies };
    rec.confidenceScore = Math.min(0.99, Math.max(0.3, bestConfidence / 100));
    rec.confidence = Math.round((rec.confidenceScore || 0) * 100);
    // Promote top suggestion for UI convenience
    if (!rec.invoiceId && suggestedMatches[0]) {
      const top = suggestedMatches[0];
      const inv = invoiceById[top.invoiceId];
      rec.suggestedInvoiceId = top.invoiceId;
      rec.suggestedInvoice = {
        invoiceNumber: inv?.invoiceNumber,
        amount: inv?.amount,
        confidence: top.confidence,
      };
    } else {
      rec.suggestedInvoiceId = null;
      rec.suggestedInvoice = null;
    }
    rec.updatedAt = new Date();
  });

  return res.json({ success: true, data: { updated: reconciliations.length } });
});

// Accept AI Suggestion
reconciliationRouter.post('/:id/accept-suggestion', (req, res) => {
  const { reconciliations, invoices } = getMockData();
  const { invoiceId } = req.body;
  
  const reconciliation = reconciliations.find(r => r.id === req.params.id);
  
  if (!reconciliation) {
    return res.status(404).json({
      success: false,
      error: 'Reconciliation not found'
    });
  }
  
  // Update the reconciliation
  const invoice = invoices.find((i: any) => i.id === invoiceId);
  reconciliation.status = 'matched';
  reconciliation.invoiceId = invoiceId;
  reconciliation.invoice = invoice || reconciliation.invoice;
  if (invoice && reconciliation.payment) {
    reconciliation.matchedAmount = Math.min(reconciliation.payment.amount || 0, invoice.amount || 0);
  }
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

// Create a dispute for a reconciliation
reconciliationRouter.post('/:id/dispute', (req, res) => {
  const { reconciliations } = getMockData();
  const { notes } = req.body;
  const reconciliation = reconciliations.find(r => r.id === req.params.id);
  if (!reconciliation) {
    return res.status(404).json({ success: false, error: 'Reconciliation not found' });
  }
  reconciliation.status = 'disputed';
  reconciliation.manualNotes = notes;
  reconciliation.reconciledBy = null;
  reconciliation.reconciledAt = null;
  reconciliation.updatedAt = new Date();
  res.json({ success: true, data: reconciliation, message: 'Dispute created successfully' });
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

// Manual Match (alternate endpoint without path param to match frontend service)
reconciliationRouter.post('/manual-match', (req, res) => {
  const { reconciliations, invoices, payments } = getMockData();
  const { paymentId, invoiceId } = req.body;

  const payment = payments.find((p: any) => p.id === paymentId);
  const invoice = invoices.find((i: any) => i.id === invoiceId);
  if (!payment || !invoice) {
    return res.status(404).json({ success: false, error: 'Payment or invoice not found' });
  }

  let reconciliation = reconciliations.find((r: any) => r.paymentId === paymentId);
  if (!reconciliation) {
    reconciliation = {
      id: uuidv4(),
      paymentId: payment.id,
      payment,
      invoiceId: invoice.id,
      invoice,
      status: 'matched',
      confidenceScore: 1.0,
      aiSuggestions: null,
      manualNotes: null,
      reconciledBy: 'Manual',
      reconciledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    reconciliations.push(reconciliation);
  } else {
    reconciliation.status = 'matched';
    reconciliation.invoiceId = invoice.id;
    reconciliation.invoice = invoice;
    reconciliation.confidenceScore = 1.0;
    reconciliation.reconciledBy = 'Manual';
    reconciliation.reconciledAt = new Date();
    reconciliation.updatedAt = new Date();
  }

  res.json({ success: true, data: reconciliation, message: 'Payment manually matched to invoice successfully' });
});

// Export reconciliations (CSV)
reconciliationRouter.get('/export', (req, res) => {
  const { reconciliations } = getMockData();
  const headers = [
    'id', 'paymentReference', 'paymentAmount', 'paymentDate',
    'invoiceNumber', 'invoiceAmount', 'invoiceDueDate', 'status', 'confidence'
  ];
  const rows = reconciliations.map((r: any) => [
    r.id,
    r.payment?.paymentReference || '',
    r.payment?.amount ?? '',
    r.payment?.paymentDate || '',
    r.invoice?.invoiceNumber || '',
    r.invoice?.amount ?? '',
    r.invoice?.dueDate || '',
    r.status,
    r.confidenceScore ? Math.round(r.confidenceScore * 100) : ''
  ]);
  const csv = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="reconciliations.csv"');
  res.send(csv);
});
