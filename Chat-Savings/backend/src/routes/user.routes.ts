import { Router } from 'express';
import { getMockData } from '../services/mockData.service';
import { v4 as uuidv4 } from 'uuid';

export const userRouter = Router();

userRouter.get('/', (req, res) => {
  const { users, policies } = getMockData();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const role = req.query.role as string;
  const brokerId = req.query.brokerId as string;
  const search = req.query.search as string;
  
  let filteredUsers = [...users];
  
  if (role) {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }
  
  if (brokerId) {
    filteredUsers = filteredUsers.filter(u => u.brokerId === brokerId);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(u => 
      u.firstName.toLowerCase().includes(searchLower) ||
      u.lastName.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  }
  
  const total = filteredUsers.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  
  // If fetching agents, include policy data
  const usersWithPolicyData = paginatedUsers.map(user => {
    if (user.role === 'agent') {
      const agentPolicies = policies.filter(p => p.agentId === user.id);
      const totalPremium = agentPolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
      
      return {
        ...user,
        policyCount: agentPolicies.length,
        totalPremium,
        totalClients: new Set(agentPolicies.map(p => p.clientId)).size,
      };
    }
    return user;
  });
  
  res.json({
    success: true,
    data: usersWithPolicyData,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

userRouter.get('/:id', (req, res) => {
  const { users, policies } = getMockData();
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  // Get user's policies
  const userPolicies = policies.filter(p => p.clientId === user.id);
  const totalPremium = userPolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
  
  res.json({
    success: true,
    data: {
      ...user,
      policies: userPolicies,
      policyCount: userPolicies.length,
      totalPremium
    }
  });
});

// Create new agent (for brokers)
userRouter.post('/agents', (req, res) => {
  const { users } = getMockData();
  const { firstName, lastName, email, phone, brokerId } = req.body;
  
  // Check if email already exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      error: 'Email already exists'
    });
  }
  
  const newAgent = {
    id: uuidv4(),
    email,
    firstName,
    lastName,
    role: 'agent',
    brokerId,
    phone,
    companyName: 'Paycile Insurance Agency',
    isActive: true,
    emailVerified: false,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  users.push(newAgent);
  
  res.status(201).json({
    success: true,
    data: newAgent,
    message: 'Agent created successfully'
  });
});

// Update agent status
userRouter.patch('/:id/status', (req, res) => {
  const { users } = getMockData();
  const { isActive } = req.body;
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  user.isActive = isActive;
  user.updatedAt = new Date();
  
  res.json({
    success: true,
    data: user,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
  });
});
