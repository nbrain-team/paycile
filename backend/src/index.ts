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
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/policies', policyRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/reconciliations', reconciliationRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/chat', chatRouter);
app.use('/api/insurance-companies', insuranceCompanyRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
}); 