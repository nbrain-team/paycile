import { Router } from 'express';
import { getMockData } from '../services/mockData.service';

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
