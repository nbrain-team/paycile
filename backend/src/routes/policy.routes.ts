import { Router } from 'express';
import { getMockData } from '../services/mockData.service';

export const policyRouter = Router();

policyRouter.get('/', (req, res) => {
  const { policies } = getMockData();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const status = req.query.status as string;
  
  let filteredPolicies = [...policies];
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredPolicies = filteredPolicies.filter(p => 
      p.policyNumber.toLowerCase().includes(searchLower) ||
      p.client.firstName.toLowerCase().includes(searchLower) ||
      p.client.lastName.toLowerCase().includes(searchLower) ||
      p.client.companyName?.toLowerCase().includes(searchLower)
    );
  }
  
  if (status) {
    filteredPolicies = filteredPolicies.filter(p => p.status === status);
  }
  
  const total = filteredPolicies.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPolicies = filteredPolicies.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedPolicies,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

policyRouter.get('/:id', (req, res) => {
  const { policies } = getMockData();
  const policy = policies.find(p => p.id === req.params.id);
  
  if (!policy) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Policy not found',
      },
    });
  }
  
  return res.json({
    success: true,
    data: policy,
  });
});
