import { Router } from 'express';
import { getMockData } from '../services/mockData.service';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

// Generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'default-secret-key',
    { expiresIn: '7d' }
  );
};

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { users } = getMockData();
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password are required',
      },
    });
  }
  
  // Special handling for admin user
  if (email === 'danny@nbrain.ai' && password === 'Tm0bile#88') {
    const adminUser = users.find(u => u.email === 'danny@nbrain.ai');
    if (adminUser) {
      return res.json({
        success: true,
        user: adminUser,
        token: generateToken(adminUser.id),
      });
    }
  }
  
  // For other users, accept any password for demo purposes
  const user = users.find(u => u.email === email);
  if (user) {
    return res.json({
      success: true,
      user,
      token: generateToken(user.id),
    });
  }
  
  res.status(401).json({
    success: false,
    error: {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    },
  });
});

authRouter.post('/register', async (req, res) => {
  const { users } = getMockData();
  const { email, password, firstName, lastName, companyName, phone } = req.body;
  
  // Only allow broker registrations through self-serve
  if (!email || !password || !firstName || !lastName || !companyName) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'All fields are required',
      },
    });
  }
  
  // Check if email already exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'EMAIL_EXISTS',
        message: 'Email already registered',
      },
    });
  }
  
  // Create new broker
  const newBroker = {
    id: uuidv4(),
    email,
    firstName,
    lastName,
    role: 'broker' as const,
    phone: phone || '',
    companyName,
    isActive: true,
    emailVerified: false,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  users.push(newBroker);
  
  res.status(201).json({
    success: true,
    user: newBroker,
    token: generateToken(newBroker.id),
  });
});

authRouter.get('/me', async (req, res) => {
  // This would normally verify the JWT token
  // For now, return a mock response
  res.json({
    success: true,
    user: {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'agent',
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}); 