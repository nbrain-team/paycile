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
