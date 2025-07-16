import { Router } from 'express';
import { getMockData } from '../services/mockData.service';

export const invoiceRouter = Router();

invoiceRouter.get('/', (req, res) => {
  const { invoices } = getMockData();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  
  let filteredInvoices = [...invoices];
  
  if (status) {
    filteredInvoices = filteredInvoices.filter(i => i.status === status);
  }
  
  // Sort by due date
  filteredInvoices.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  
  const total = filteredInvoices.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedInvoices,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
