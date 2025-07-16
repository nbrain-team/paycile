import { Router } from 'express';
import { getMockData } from '../services/mockData.service';

export const userRouter = Router();

userRouter.get('/', (req, res) => {
  const { users, policies } = getMockData();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const role = req.query.role as string;
  const search = req.query.search as string;
  
  // Filter by role if specified
  let filteredUsers = role ? users.filter(u => u.role === role) : [...users];
  
  // Filter by search term if provided
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(u => 
      u.firstName.toLowerCase().includes(searchLower) ||
      u.lastName.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      (u.companyName && u.companyName.toLowerCase().includes(searchLower))
    );
  }
  
  // Calculate policy counts and total premiums for each user
  const usersWithStats = filteredUsers.map(user => {
    const userPolicies = policies.filter(p => p.clientId === user.id);
    const totalPremium = userPolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
    
    return {
      ...user,
      policyCount: userPolicies.length,
      totalPremium
    };
  });
  
  // Sort by created date descending
  usersWithStats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const total = usersWithStats.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = usersWithStats.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedUsers,
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
