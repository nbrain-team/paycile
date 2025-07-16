import { Router } from 'express';
import { getMockData } from '../services/mockData.service';
import { v4 as uuidv4 } from 'uuid';

export const insuranceCompanyRouter = Router();

// Get insurance companies (filtered by brokerId)
insuranceCompanyRouter.get('/', (req, res) => {
  const { insuranceCompanies } = getMockData();
  const brokerId = req.query.brokerId as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  let filteredCompanies = [...insuranceCompanies];
  
  // Filter by brokerId if provided
  if (brokerId) {
    filteredCompanies = filteredCompanies.filter(c => c.brokerId === brokerId);
  }
  
  // Sort by name
  filteredCompanies.sort((a, b) => a.name.localeCompare(b.name));
  
  const total = filteredCompanies.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedCompanies,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get single insurance company
insuranceCompanyRouter.get('/:id', (req, res) => {
  const { insuranceCompanies } = getMockData();
  const company = insuranceCompanies.find(c => c.id === req.params.id);
  
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Insurance company not found'
    });
  }
  
  res.json({
    success: true,
    data: company
  });
});

// Create new insurance company
insuranceCompanyRouter.post('/', (req, res) => {
  const { insuranceCompanies } = getMockData();
  const { 
    name, 
    code, 
    brokerId,
    contactEmail,
    contactPhone,
    address,
    commissionRate,
    claimsEmail,
    claimsPhone,
    policyTypes,
    paymentWaterfall
  } = req.body;
  
  // Check if code already exists
  if (insuranceCompanies.find(c => c.code === code)) {
    return res.status(400).json({
      success: false,
      error: 'Company code already exists'
    });
  }
  
  const newCompany = {
    id: uuidv4(),
    name,
    code,
    brokerId,
    contactEmail,
    contactPhone,
    address,
    commissionRate,
    claimsEmail,
    claimsPhone,
    policyTypes,
    paymentWaterfall: paymentWaterfall || [
      { id: uuidv4(), type: 'premium', priority: 1, description: 'Base Premium' },
      { id: uuidv4(), type: 'tax', priority: 2, description: 'State & Municipal Taxes' },
      { id: uuidv4(), type: 'fee', priority: 3, description: 'Policy & Service Fees' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  insuranceCompanies.push(newCompany);
  
  res.status(201).json({
    success: true,
    data: newCompany,
    message: 'Insurance company created successfully'
  });
});

// Update insurance company
insuranceCompanyRouter.put('/:id', (req, res) => {
  const { insuranceCompanies } = getMockData();
  const company = insuranceCompanies.find(c => c.id === req.params.id);
  
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Insurance company not found'
    });
  }
  
  // Update fields
  Object.assign(company, {
    ...req.body,
    id: company.id, // Prevent ID change
    updatedAt: new Date()
  });
  
  res.json({
    success: true,
    data: company,
    message: 'Insurance company updated successfully'
  });
});

// Update payment waterfall order
insuranceCompanyRouter.put('/:id/waterfall', (req, res) => {
  const { insuranceCompanies } = getMockData();
  const { waterfall } = req.body;
  const company = insuranceCompanies.find(c => c.id === req.params.id);
  
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Insurance company not found'
    });
  }
  
  // Update waterfall priorities based on new order
  company.paymentWaterfall = waterfall.map((item: any, index: number) => ({
    ...item,
    priority: index + 1
  }));
  company.updatedAt = new Date();
  
  res.json({
    success: true,
    data: company,
    message: 'Payment waterfall updated successfully'
  });
});

// Toggle company status
insuranceCompanyRouter.patch('/:id/status', (req, res) => {
  const { insuranceCompanies } = getMockData();
  const { isActive } = req.body;
  const company = insuranceCompanies.find(c => c.id === req.params.id);
  
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Insurance company not found'
    });
  }
  
  company.isActive = isActive;
  company.updatedAt = new Date();
  
  res.json({
    success: true,
    data: company,
    message: `Insurance company ${isActive ? 'activated' : 'deactivated'} successfully`
  });
}); 