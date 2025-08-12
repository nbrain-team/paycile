import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export const cashFlowRouter = Router();

// Apply authentication to all routes
cashFlowRouter.use(authenticateToken);

// Get all categories for the user
cashFlowRouter.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    const result = await pool.query(
      `SELECT * FROM cash_flow_categories 
       WHERE user_id = $1 OR is_system = true 
       ORDER BY type, name`,
      [userId]
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Create a custom category
cashFlowRouter.post('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { name, type, color, icon, parentCategoryId } = req.body;
    
    const result = await pool.query(
      `INSERT INTO cash_flow_categories (user_id, name, type, color, icon, parent_category_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, name, type, color || '#6B7280', icon || '💰', parentCategoryId]
    );
    
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get transactions with filters
cashFlowRouter.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, type, categoryId, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM cash_flow_transactions t
      LEFT JOIN cash_flow_categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const params: any[] = [userId];
    let paramCount = 1;
    
    if (startDate) {
      paramCount++;
      query += ` AND t.date >= $${paramCount}`;
      params.push(startDate);
    }
    
    if (endDate) {
      paramCount++;
      query += ` AND t.date <= $${paramCount}`;
      params.push(endDate);
    }
    
    if (type) {
      paramCount++;
      query += ` AND t.type = $${paramCount}`;
      params.push(type);
    }
    
    if (categoryId) {
      paramCount++;
      query += ` AND t.category_id = $${paramCount}`;
      params.push(categoryId);
    }
    
    query += ` ORDER BY t.date DESC, t.created_at DESC`;
    
    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM cash_flow_transactions
      WHERE user_id = $1
    `;
    const countParams: any[] = [userId];
    let countParamCount = 1;
    
    if (startDate) {
      countParamCount++;
      countQuery += ` AND date >= $${countParamCount}`;
      countParams.push(startDate);
    }
    
    if (endDate) {
      countParamCount++;
      countQuery += ` AND date <= $${countParamCount}`;
      countParams.push(endDate);
    }
    
    if (type) {
      countParamCount++;
      countQuery += ` AND type = $${countParamCount}`;
      countParams.push(type);
    }
    
    if (categoryId) {
      countParamCount++;
      countQuery += ` AND category_id = $${countParamCount}`;
      countParams.push(categoryId);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      data: result.rows,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create a transaction
cashFlowRouter.post('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      categoryId,
      date,
      type,
      amount,
      description,
      notes,
      isRecurring,
      recurringFrequency,
      recurringEndDate,
      tags
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO cash_flow_transactions 
       (user_id, category_id, date, type, amount, description, notes, 
        is_recurring, recurring_frequency, recurring_end_date, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId, categoryId, date, type, amount, description, notes,
        isRecurring || false, recurringFrequency, recurringEndDate, tags || []
      ]
    );
    
    // If it's a recurring transaction, create future instances
    if (isRecurring && recurringFrequency) {
      await createRecurringTransactions(result.rows[0], recurringEndDate);
    }
    
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update a transaction
cashFlowRouter.put('/transactions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const {
      categoryId,
      date,
      type,
      amount,
      description,
      notes,
      isRecurring,
      recurringFrequency,
      recurringEndDate,
      tags
    } = req.body;
    
    const result = await pool.query(
      `UPDATE cash_flow_transactions 
       SET category_id = $3, date = $4, type = $5, amount = $6, 
           description = $7, notes = $8, is_recurring = $9, 
           recurring_frequency = $10, recurring_end_date = $11, tags = $12
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id, userId, categoryId, date, type, amount, description, notes,
        isRecurring || false, recurringFrequency, recurringEndDate, tags || []
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete a transaction
cashFlowRouter.delete('/transactions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM cash_flow_transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get daily cash flow
cashFlowRouter.get('/daily/:date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { date } = req.params;
    
    // Get all transactions for the date
    const transactionsResult = await pool.query(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM cash_flow_transactions t
       LEFT JOIN cash_flow_categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.date = $2
       ORDER BY t.created_at DESC`,
      [userId, date]
    );
    
    // Calculate starting balance (sum of all transactions before this date)
    const startingBalanceResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
       FROM cash_flow_transactions
       WHERE user_id = $1 AND date < $2`,
      [userId, date]
    );
    
    const startingBalance = Number(startingBalanceResult.rows[0].balance) + 10000; // Add initial balance
    
    // Calculate daily totals
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactionsResult.rows.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += Number(transaction.amount);
      } else {
        totalExpenses += Number(transaction.amount);
      }
    });
    
    const endingBalance = startingBalance + totalIncome - totalExpenses;
    
    res.json({
      data: {
        date,
        startingBalance,
        endingBalance,
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        transactions: transactionsResult.rows,
        transactionCount: transactionsResult.rows.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get monthly summary
cashFlowRouter.get('/summary/:year/:month', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { year, month } = req.params;
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];
    
    // Get opening balance
    const openingBalanceResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
       FROM cash_flow_transactions
       WHERE user_id = $1 AND date < $2`,
      [userId, startDate]
    );
    
    const openingBalance = Number(openingBalanceResult.rows[0].balance) + 10000;
    
    // Get monthly totals
    const summaryResult = await pool.query(
      `SELECT 
         type,
         SUM(amount) as total,
         COUNT(*) as count
       FROM cash_flow_transactions
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       GROUP BY type`,
      [userId, startDate, endDate]
    );
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    summaryResult.rows.forEach(row => {
      if (row.type === 'income') {
        totalIncome = Number(row.total);
      } else {
        totalExpenses = Number(row.total);
      }
    });
    
    // Get category breakdown
    const categoryBreakdownResult = await pool.query(
      `SELECT 
         c.name as category,
         t.type,
         c.icon,
         c.color,
         SUM(t.amount) as amount,
         COUNT(*) as count
       FROM cash_flow_transactions t
       JOIN cash_flow_categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.date >= $2 AND t.date <= $3
       GROUP BY c.name, t.type, c.icon, c.color
       ORDER BY t.type, amount DESC`,
      [userId, startDate, endDate]
    );
    
    const categoryBreakdown = categoryBreakdownResult.rows.map(row => ({
      category: `${row.category} (${row.type})`,
      amount: Number(row.amount),
      percentage: Number(row.amount) / (row.type === 'income' ? totalIncome : totalExpenses) * 100,
      count: row.count,
      icon: row.icon,
      color: row.color
    }));
    
    const netCashFlow = totalIncome - totalExpenses;
    const closingBalance = openingBalance + netCashFlow;
    
    res.json({
      data: {
        period: `${year}-${month}`,
        startDate,
        endDate,
        openingBalance,
        closingBalance,
        totalIncome,
        totalExpenses,
        netCashFlow,
        averageDailyBalance: closingBalance, // Simplified for now
        lowestBalance: Math.min(openingBalance, closingBalance),
        lowestBalanceDate: closingBalance < openingBalance ? endDate : startDate,
        highestBalance: Math.max(openingBalance, closingBalance),
        highestBalanceDate: closingBalance > openingBalance ? endDate : startDate,
        categoryBreakdown,
        projectedBalance30Days: closingBalance + (netCashFlow / 30 * 30), // Simple projection
        lowCashWarnings: closingBalance < 1000 ? ['Low cash balance warning'] : []
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get projections
cashFlowRouter.get('/projections/:days', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const days = Number(req.params.days) || 30;
    
    // Get current balance
    const currentBalanceResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
       FROM cash_flow_transactions
       WHERE user_id = $1 AND date <= CURRENT_DATE`,
      [userId]
    );
    
    let currentBalance = Number(currentBalanceResult.rows[0].balance) + 10000;
    
    // Get average daily income/expenses from last 90 days
    const avgResult = await pool.query(
      `SELECT 
         type,
         AVG(daily_total) as avg_amount
       FROM (
         SELECT date, type, SUM(amount) as daily_total
         FROM cash_flow_transactions
         WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '90 days'
         GROUP BY date, type
       ) daily_sums
       GROUP BY type`,
      [userId]
    );
    
    let avgDailyIncome = 0;
    let avgDailyExpenses = 0;
    
    avgResult.rows.forEach(row => {
      if (row.type === 'income') {
        avgDailyIncome = Number(row.avg_amount) || 0;
      } else {
        avgDailyExpenses = Number(row.avg_amount) || 0;
      }
    });
    
    // Generate projections
    const projections = [];
    let projectedBalance = currentBalance;
    
    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Simple linear projection
      projectedBalance += avgDailyIncome - avgDailyExpenses;
      
      projections.push({
        date: date.toISOString().split('T')[0],
        projectedBalance,
        confidence: 0.8 - (i / days * 0.3), // Confidence decreases over time
        factors: ['Based on 90-day average']
      });
    }
    
    res.json({ data: projections });
  } catch (error) {
    next(error);
  }
});

// Get budgets
cashFlowRouter.get('/budgets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    const result = await pool.query(
      `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color, c.type
       FROM cash_flow_budgets b
       JOIN cash_flow_categories c ON b.category_id = c.id
       WHERE b.user_id = $1 AND b.is_active = true
       ORDER BY c.type, c.name`,
      [userId]
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Create a budget
cashFlowRouter.post('/budgets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { categoryId, amount, period, startDate, endDate } = req.body;
    
    const result = await pool.query(
      `INSERT INTO cash_flow_budgets (user_id, category_id, amount, period, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, categoryId, amount, period || 'monthly', startDate, endDate]
    );
    
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update a budget
cashFlowRouter.put('/budgets/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { amount, period, endDate, isActive } = req.body;
    
    const result = await pool.query(
      `UPDATE cash_flow_budgets 
       SET amount = $3, period = $4, end_date = $5, is_active = $6
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, amount, period, endDate, isActive]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete a budget
cashFlowRouter.delete('/budgets/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM cash_flow_budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get alerts
cashFlowRouter.get('/alerts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    const result = await pool.query(
      `SELECT * FROM cash_flow_alerts 
       WHERE user_id = $1 AND is_dismissed = false
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Dismiss alert
cashFlowRouter.put('/alerts/:id/dismiss', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE cash_flow_alerts 
       SET is_dismissed = true
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ message: 'Alert dismissed' });
  } catch (error) {
    next(error);
  }
});

// Helper function to create recurring transactions
async function createRecurringTransactions(
  parentTransaction: any,
  endDate?: string
) {
  const { user_id, category_id, type, amount, description, notes, recurring_frequency, tags } = parentTransaction;
  const startDate = new Date(parentTransaction.date);
  const end = endDate ? new Date(endDate) : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
  
  const transactions = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= end) {
    // Calculate next date based on frequency
    switch (recurring_frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'quarterly':
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }
    
    if (currentDate <= end) {
      transactions.push([
        user_id,
        category_id,
        currentDate.toISOString().split('T')[0],
        type,
        amount,
        description,
        notes,
        false, // is_recurring = false for child transactions
        null, // recurring_frequency
        null, // recurring_end_date
        parentTransaction.id,
        tags
      ]);
    }
  }
  
  // Batch insert recurring transactions
  if (transactions.length > 0) {
    const placeholders = transactions.map((_, index) => 
      `($${index * 12 + 1}, $${index * 12 + 2}, $${index * 12 + 3}, $${index * 12 + 4}, $${index * 12 + 5}, $${index * 12 + 6}, $${index * 12 + 7}, $${index * 12 + 8}, $${index * 12 + 9}, $${index * 12 + 10}, $${index * 12 + 11}, $${index * 12 + 12})`
    ).join(', ');
    
    const values = transactions.flat();
    
    await pool.query(
      `INSERT INTO cash_flow_transactions 
       (user_id, category_id, date, type, amount, description, notes, 
        is_recurring, recurring_frequency, recurring_end_date, parent_transaction_id, tags)
       VALUES ${placeholders}`,
      values
    );
  }
} 