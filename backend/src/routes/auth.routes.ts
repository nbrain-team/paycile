import { Router } from 'express';

export const authRouter = Router();

// Mock auth routes for now
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication - accept any login for testing
  if (email && password) {
    res.json({
      success: true,
      user: {
        id: '1',
        email,
        firstName: 'Test',
        lastName: 'User',
        role: 'agent',
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'mock-jwt-token',
    });
  } else {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }
});

authRouter.post('/register', async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Registration not implemented yet',
    },
  });
});

authRouter.get('/me', async (req, res) => {
  // Mock user data
  res.json({
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
  });
}); 