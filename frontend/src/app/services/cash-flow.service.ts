import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CashFlowTransaction,
  CashFlowCategory,
  DailyCashFlow,
  CashFlowSummary,
  CashFlowProjection,
  Budget,
  CashFlowAlert
} from '../models/cash-flow.model';

@Injectable({
  providedIn: 'root'
})
export class CashFlowService {
  private apiUrl = `${environment.apiUrl}/cash-flow`;
  
  // Local storage for demo purposes
  private transactions = signal<CashFlowTransaction[]>([]);
  private categories = signal<CashFlowCategory[]>(this.getDefaultCategories());
  private budgets = signal<Budget[]>([]);
  private currentBalance = signal<number>(10000); // Starting balance

  constructor(private http: HttpClient) {
    this.loadFromLocalStorage();
  }

  // Transaction Management
  getTransactions(startDate?: Date, endDate?: Date): Observable<CashFlowTransaction[]> {
    let filtered = this.transactions();
    
    if (startDate && endDate) {
      filtered = filtered.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
      });
    }
    
    return of(filtered);
  }

  addTransaction(transaction: CashFlowTransaction): Observable<CashFlowTransaction> {
    const newTransaction = {
      ...transaction,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.transactions.update(transactions => [...transactions, newTransaction]);
    this.saveToLocalStorage();
    
    return of(newTransaction);
  }

  updateTransaction(id: string, transaction: Partial<CashFlowTransaction>): Observable<CashFlowTransaction> {
    const updated = { ...transaction, updatedAt: new Date() };
    
    this.transactions.update(transactions => 
      transactions.map(t => t.id === id ? { ...t, ...updated } : t)
    );
    this.saveToLocalStorage();
    
    const updatedTransaction = this.transactions().find(t => t.id === id);
    return of(updatedTransaction!);
  }

  deleteTransaction(id: string): Observable<void> {
    this.transactions.update(transactions => 
      transactions.filter(t => t.id !== id)
    );
    this.saveToLocalStorage();
    return of(void 0);
  }

  // Daily Cash Flow
  getDailyCashFlow(date: Date): Observable<DailyCashFlow> {
    const transactions = this.transactions().filter(t => {
      const tDate = new Date(t.date);
      return tDate.toDateString() === date.toDateString();
    });

    const previousBalance = this.calculateBalanceUpTo(date);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyFlow: DailyCashFlow = {
      date,
      startingBalance: previousBalance,
      totalIncome,
      totalExpenses,
      endingBalance: previousBalance + totalIncome - totalExpenses,
      transactions
    };

    return of(dailyFlow);
  }

  // Monthly Summary
  getMonthlySummary(year: number, month: number): Observable<CashFlowSummary> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const monthTransactions = this.transactions().filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });

    const openingBalance = this.calculateBalanceUpTo(startDate);
    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netCashFlow = totalIncome - totalExpenses;
    const closingBalance = openingBalance + netCashFlow;

    // Calculate daily balances for the month
    const dailyBalances: number[] = [];
    let runningBalance = openingBalance;
    
    for (let day = 1; day <= endDate.getDate(); day++) {
      const dayDate = new Date(year, month, day);
      const dayTransactions = monthTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getDate() === day;
      });
      
      const dayIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const dayExpenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      runningBalance += dayIncome - dayExpenses;
      dailyBalances.push(runningBalance);
    }

    const lowestBalance = Math.min(...dailyBalances);
    const highestBalance = Math.max(...dailyBalances);
    const lowestBalanceDay = dailyBalances.indexOf(lowestBalance) + 1;
    const highestBalanceDay = dailyBalances.indexOf(highestBalance) + 1;

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    monthTransactions.forEach(t => {
      const key = `${t.type}-${t.category}`;
      const existing = categoryMap.get(key) || { amount: 0, count: 0 };
      categoryMap.set(key, {
        amount: existing.amount + t.amount,
        count: existing.count + 1
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([key, data]) => {
      const [type, category] = key.split('-');
      return {
        category: `${category} (${type})`,
        amount: data.amount,
        percentage: (data.amount / (type === 'income' ? totalIncome : totalExpenses)) * 100,
        count: data.count
      };
    }).sort((a, b) => b.amount - a.amount);

    const summary: CashFlowSummary = {
      period: `${this.getMonthName(month)} ${year}`,
      startDate,
      endDate,
      openingBalance,
      closingBalance,
      totalIncome,
      totalExpenses,
      netCashFlow,
      averageDailyBalance: dailyBalances.reduce((sum, b) => sum + b, 0) / dailyBalances.length,
      lowestBalance,
      lowestBalanceDate: new Date(year, month, lowestBalanceDay),
      highestBalance,
      highestBalanceDate: new Date(year, month, highestBalanceDay),
      categoryBreakdown
    };

    return of(summary);
  }

  // Projections
  getProjections(days: number = 30): Observable<CashFlowProjection[]> {
    const projections: CashFlowProjection[] = [];
    const today = new Date();
    let projectedBalance = this.calculateCurrentBalance();

    // Calculate average daily income/expense from past 90 days
    const past90Days = new Date();
    past90Days.setDate(past90Days.getDate() - 90);
    
    const recentTransactions = this.transactions().filter(t => {
      const tDate = new Date(t.date);
      return tDate >= past90Days && tDate <= today;
    });

    const dailyAverageIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) / 90;
    
    const dailyAverageExpense = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) / 90;

    // Generate projections
    for (let i = 1; i <= days; i++) {
      const projectionDate = new Date();
      projectionDate.setDate(projectionDate.getDate() + i);
      
      // Add recurring transactions
      const recurringIncome = this.calculateRecurringAmount('income', projectionDate);
      const recurringExpense = this.calculateRecurringAmount('expense', projectionDate);
      
      const projectedIncome = dailyAverageIncome + recurringIncome;
      const projectedExpenses = dailyAverageExpense + recurringExpense;
      
      projectedBalance += projectedIncome - projectedExpenses;
      
      projections.push({
        date: projectionDate,
        projectedBalance,
        projectedIncome,
        projectedExpenses,
        confidence: Math.max(0.5, 1 - (i / days) * 0.5), // Confidence decreases over time
        assumptions: [
          'Based on 90-day average',
          'Includes recurring transactions',
          'Does not account for seasonal variations'
        ]
      });
    }

    return of(projections);
  }

  // Categories
  getCategories(): Observable<CashFlowCategory[]> {
    return of(this.categories());
  }

  addCategory(category: CashFlowCategory): Observable<CashFlowCategory> {
    this.categories.update(categories => [...categories, category]);
    this.saveToLocalStorage();
    return of(category);
  }

  // Budgets
  getBudgets(): Observable<Budget[]> {
    return of(this.budgets());
  }

  addBudget(budget: Budget): Observable<Budget> {
    const newBudget = {
      ...budget,
      id: this.generateId()
    };
    
    this.budgets.update(budgets => [...budgets, newBudget]);
    this.saveToLocalStorage();
    return of(newBudget);
  }

  updateBudget(id: string, budget: Partial<Budget>): Observable<Budget> {
    this.budgets.update(budgets => 
      budgets.map(b => b.id === id ? { ...b, ...budget } : b)
    );
    this.saveToLocalStorage();
    
    const updated = this.budgets().find(b => b.id === id);
    return of(updated!);
  }

  deleteBudget(id: string): Observable<void> {
    this.budgets.update(budgets => budgets.filter(b => b.id !== id));
    this.saveToLocalStorage();
    return of(void 0);
  }

  // Alerts
  getAlerts(): Observable<CashFlowAlert[]> {
    const alerts: CashFlowAlert[] = [];
    const currentBalance = this.calculateCurrentBalance();
    
    // Low balance alert
    if (currentBalance < 1000) {
      alerts.push({
        id: '1',
        type: 'low_balance',
        severity: currentBalance < 500 ? 'critical' : 'warning',
        message: `Low balance warning: $${currentBalance.toFixed(2)}`,
        date: new Date(),
        actionRequired: true
      });
    }

    // Budget alerts
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    this.budgets().forEach(budget => {
      if (budget.type === 'expense') {
        const spent = this.calculateCategorySpending(budget.category, currentMonth, currentYear);
        const budgetAmount = budget.amount;
        
        if (spent > budgetAmount * 0.9) {
          alerts.push({
            id: this.generateId(),
            type: 'budget_exceeded',
            severity: spent > budgetAmount ? 'critical' : 'warning',
            message: `${budget.category} budget ${spent > budgetAmount ? 'exceeded' : 'nearly exceeded'}: $${spent.toFixed(2)} of $${budgetAmount.toFixed(2)}`,
            date: new Date(),
            actionRequired: spent > budgetAmount
          });
        }
      }
    });

    return of(alerts);
  }

  // Helper Methods
  private calculateBalanceUpTo(date: Date): number {
    const relevantTransactions = this.transactions().filter(t => {
      const tDate = new Date(t.date);
      return tDate < date;
    });

    const totalIncome = relevantTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = relevantTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return this.currentBalance() + totalIncome - totalExpenses;
  }

  private calculateCurrentBalance(): number {
    const totalIncome = this.transactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = this.transactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return this.currentBalance() + totalIncome - totalExpenses;
  }

  private calculateRecurringAmount(type: 'income' | 'expense', date: Date): number {
    return this.transactions()
      .filter(t => t.type === type && t.isRecurring)
      .reduce((sum, t) => {
        if (this.shouldIncludeRecurring(t, date)) {
          return sum + t.amount;
        }
        return sum;
      }, 0);
  }

  private shouldIncludeRecurring(transaction: CashFlowTransaction, date: Date): boolean {
    if (!transaction.isRecurring || !transaction.recurringFrequency) return false;
    
    const tDate = new Date(transaction.date);
    const daysDiff = Math.floor((date.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (transaction.recurringFrequency) {
      case 'daily': return true;
      case 'weekly': return daysDiff % 7 === 0;
      case 'biweekly': return daysDiff % 14 === 0;
      case 'monthly': return date.getDate() === tDate.getDate();
      case 'quarterly': return daysDiff % 90 === 0;
      case 'yearly': return daysDiff % 365 === 0;
      default: return false;
    }
  }

  private calculateCategorySpending(category: string, month: number, year: number): number {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    return this.transactions()
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && 
               t.category === category &&
               tDate >= startDate && 
               tDate <= endDate;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDefaultCategories(): CashFlowCategory[] {
    return [
      // Income Categories
      { id: '1', name: 'Salary', type: 'income', color: '#10b981', icon: '💰' },
      { id: '2', name: 'Freelance', type: 'income', color: '#3b82f6', icon: '💻' },
      { id: '3', name: 'Investments', type: 'income', color: '#8b5cf6', icon: '📈' },
      { id: '4', name: 'Business', type: 'income', color: '#f59e0b', icon: '🏢' },
      { id: '5', name: 'Other Income', type: 'income', color: '#6366f1', icon: '💵' },
      
      // Expense Categories
      { id: '6', name: 'Housing', type: 'expense', color: '#ef4444', icon: '🏠', 
        subcategories: ['Rent', 'Mortgage', 'Utilities', 'Maintenance'] },
      { id: '7', name: 'Transportation', type: 'expense', color: '#f97316', icon: '🚗',
        subcategories: ['Fuel', 'Maintenance', 'Insurance', 'Public Transit'] },
      { id: '8', name: 'Food & Dining', type: 'expense', color: '#eab308', icon: '🍔',
        subcategories: ['Groceries', 'Restaurants', 'Coffee', 'Delivery'] },
      { id: '9', name: 'Healthcare', type: 'expense', color: '#14b8a6', icon: '🏥',
        subcategories: ['Insurance', 'Medications', 'Doctor Visits'] },
      { id: '10', name: 'Entertainment', type: 'expense', color: '#ec4899', icon: '🎮',
        subcategories: ['Movies', 'Games', 'Subscriptions', 'Hobbies'] },
      { id: '11', name: 'Shopping', type: 'expense', color: '#a855f7', icon: '🛍️',
        subcategories: ['Clothing', 'Electronics', 'Home Goods'] },
      { id: '12', name: 'Education', type: 'expense', color: '#06b6d4', icon: '📚',
        subcategories: ['Tuition', 'Books', 'Courses', 'Training'] },
      { id: '13', name: 'Other Expenses', type: 'expense', color: '#64748b', icon: '📝' }
    ];
  }

  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem('cashFlowData');
    if (saved) {
      const data = JSON.parse(saved);
      this.transactions.set(data.transactions || []);
      this.budgets.set(data.budgets || []);
      this.currentBalance.set(data.currentBalance || 10000);
    } else {
      // Add sample transactions for demo
      this.addSampleTransactions();
    }
  }

  private saveToLocalStorage(): void {
    const data = {
      transactions: this.transactions(),
      budgets: this.budgets(),
      currentBalance: this.currentBalance()
    };
    localStorage.setItem('cashFlowData', JSON.stringify(data));
  }

  private addSampleTransactions(): void {
    const sampleTransactions: CashFlowTransaction[] = [
      {
        date: new Date(new Date().setDate(new Date().getDate() - 5)),
        type: 'income',
        category: 'Salary',
        description: 'Monthly Salary',
        amount: 5000,
        isRecurring: true,
        recurringFrequency: 'monthly'
      },
      {
        date: new Date(new Date().setDate(new Date().getDate() - 3)),
        type: 'expense',
        category: 'Housing',
        subcategory: 'Rent',
        description: 'Monthly Rent',
        amount: 1500,
        isRecurring: true,
        recurringFrequency: 'monthly'
      },
      {
        date: new Date(new Date().setDate(new Date().getDate() - 2)),
        type: 'expense',
        category: 'Food & Dining',
        subcategory: 'Groceries',
        description: 'Weekly Grocery Shopping',
        amount: 250,
        isRecurring: false
      },
      {
        date: new Date(new Date().setDate(new Date().getDate() - 1)),
        type: 'expense',
        category: 'Transportation',
        subcategory: 'Fuel',
        description: 'Gas Station',
        amount: 60,
        isRecurring: false
      }
    ];

    sampleTransactions.forEach(t => this.addTransaction(t).subscribe());
  }
} 