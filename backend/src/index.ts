import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { policyRouter } from './routes/policy.routes';
import { invoiceRouter } from './routes/invoice.routes';
import { paymentRouter } from './routes/payment.routes';
import { reconciliationRouter } from './routes/reconciliation.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { chatRouter } from './routes/chat.routes';
import { insuranceCompanyRouter } from './routes/insurance-company.routes';
import { insightsRouter } from './routes/insights.routes';
import { aiRouter } from './routes/ai.routes';
import { verifyRouter } from './routes/verify.routes';
import { cashFlowRouter } from './routes/cash-flow.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://paycile-frontend.onrender.com'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (for Render)
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Paycile API is running',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/policies', policyRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/reconciliations', reconciliationRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/chat', chatRouter);
app.use('/api/insurance-companies', insuranceCompanyRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/cash-flow', cashFlowRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
}); 