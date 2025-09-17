import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';
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
  
  // Cache signals for performance
  private categoriesCache = signal<CashFlowCategory[]>([]);
  private budgetsCache = signal<Budget[]>([]);

  constructor(private http: HttpClient) {}

  // Category Management
  getCategories(): Observable<CashFlowCategory[]> {
    const cached = this.categoriesCache();
    if (cached.length > 0) {
      return of(cached);
    }
    
    return this.http.get<{ data: CashFlowCategory[] }>(`${this.apiUrl}/categories`)
      .pipe(
        map(response => response.data),
        tap(categories => this.categoriesCache.set(categories))
      );
  }

  createCategory(category: Partial<CashFlowCategory>): Observable<CashFlowCategory> {
    return this.http.post<{ data: CashFlowCategory }>(`${this.apiUrl}/categories`, category)
      .pipe(
        map(response => response.data),
        tap(() => this.categoriesCache.set([])) // Clear cache
      );
  }

  // Transaction Management
  getTransactions(startDate?: Date, endDate?: Date, filters?: any): Observable<CashFlowTransaction[]> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString().split('T')[0]);
    }
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    
    return this.http.get<{ data: CashFlowTransaction[] }>(`${this.apiUrl}/transactions`, { params })
      .pipe(map(response => response.data));
  }

  addTransaction(transaction: CashFlowTransaction): Observable<CashFlowTransaction> {
    // Convert camelCase to snake_case for backend
    const payload = {
      categoryId: transaction.category,
      date: transaction.date instanceof Date ? transaction.date.toISOString().split('T')[0] : transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      notes: transaction.notes,
      isRecurring: transaction.isRecurring,
      recurringFrequency: transaction.recurringFrequency,
      recurringEndDate: transaction.recurringEndDate,
      tags: transaction.tags
    };
    
    return this.http.post<{ data: CashFlowTransaction }>(`${this.apiUrl}/transactions`, payload)
      .pipe(map(response => response.data));
  }

  updateTransaction(id: string, transaction: CashFlowTransaction): Observable<CashFlowTransaction> {
    const payload = {
      categoryId: transaction.category,
      date: transaction.date instanceof Date ? transaction.date.toISOString().split('T')[0] : transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      notes: transaction.notes,
      isRecurring: transaction.isRecurring,
      recurringFrequency: transaction.recurringFrequency,
      recurringEndDate: transaction.recurringEndDate,
      tags: transaction.tags
    };
    
    return this.http.put<{ data: CashFlowTransaction }>(`${this.apiUrl}/transactions/${id}`, payload)
      .pipe(map(response => response.data));
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/transactions/${id}`);
  }

  // Daily Cash Flow
  getDailyCashFlow(date: Date): Observable<DailyCashFlow> {
    const dateStr = date.toISOString().split('T')[0];
    return this.http.get<{ data: DailyCashFlow }>(`${this.apiUrl}/daily/${dateStr}`)
      .pipe(map(response => response.data));
  }

  // Monthly Summary
  getMonthlySummary(year: number, month: number): Observable<CashFlowSummary> {
    return this.http.get<{ data: CashFlowSummary }>(`${this.apiUrl}/summary/${year}/${month + 1}`)
      .pipe(map(response => response.data));
  }

  // Projections
  getProjections(days: number = 30): Observable<CashFlowProjection[]> {
    return this.http.get<{ data: CashFlowProjection[] }>(`${this.apiUrl}/projections/${days}`)
      .pipe(map(response => response.data));
  }

  // Budget Management
  getBudgets(): Observable<Budget[]> {
    const cached = this.budgetsCache();
    if (cached.length > 0) {
      return of(cached);
    }
    
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/budgets`)
      .pipe(
        map(response => response.data.map(b => ({
          id: b.id,
          category: b.category_name || b.category,
          type: b.type as 'income' | 'expense',
          amount: b.amount,
          period: b.period,
          startDate: b.start_date || b.startDate,
          endDate: b.end_date || b.endDate,
          isActive: b.is_active !== undefined ? b.is_active : true
        }))),
        tap(budgets => this.budgetsCache.set(budgets))
      );
  }

  addBudget(budget: Budget): Observable<Budget> {
    const payload = {
      categoryId: budget.category,
      amount: budget.amount,
      period: budget.period,
      startDate: budget.startDate instanceof Date ? budget.startDate.toISOString().split('T')[0] : budget.startDate,
      endDate: budget.endDate
    };
    
    return this.http.post<{ data: Budget }>(`${this.apiUrl}/budgets`, payload)
      .pipe(
        map(response => response.data),
        tap(() => this.budgetsCache.set([])) // Clear cache
      );
  }

  updateBudget(id: string, budget: Partial<Budget>): Observable<Budget> {
    return this.http.put<{ data: Budget }>(`${this.apiUrl}/budgets/${id}`, budget)
      .pipe(
        map(response => response.data),
        tap(() => this.budgetsCache.set([])) // Clear cache
      );
  }

  deleteBudget(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/budgets/${id}`)
      .pipe(tap(() => this.budgetsCache.set([]))); // Clear cache
  }

  // Alerts
  getAlerts(): Observable<CashFlowAlert[]> {
    return this.http.get<{ data: CashFlowAlert[] }>(`${this.apiUrl}/alerts`)
      .pipe(map(response => response.data));
  }

  dismissAlert(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/alerts/${id}/dismiss`, {});
  }

  // Helper methods for backward compatibility
  private getDefaultCategories(): CashFlowCategory[] {
    return [
      // Income categories
      { id: '1', name: 'Salary', type: 'income', color: '#10b981', icon: '💵' },
      { id: '2', name: 'Business Income', type: 'income', color: '#3b82f6', icon: '💼' },
      { id: '3', name: 'Investments', type: 'income', color: '#8b5cf6', icon: '📈' },
      { id: '4', name: 'Freelance', type: 'income', color: '#f59e0b', icon: '💻' },
      { id: '5', name: 'Other Income', type: 'income', color: '#6b7280', icon: '💰' },
      // Expense categories
      { id: '6', name: 'Housing', type: 'expense', color: '#ef4444', icon: '🏠' },
      { id: '7', name: 'Transportation', type: 'expense', color: '#f97316', icon: '🚗' },
      { id: '8', name: 'Food & Dining', type: 'expense', color: '#84cc16', icon: '🍽️' },
      { id: '9', name: 'Utilities', type: 'expense', color: '#06b6d4', icon: '💡' },
      { id: '10', name: 'Healthcare', type: 'expense', color: '#ec4899', icon: '🏥' },
      { id: '11', name: 'Entertainment', type: 'expense', color: '#a855f7', icon: '🎬' },
      { id: '12', name: 'Shopping', type: 'expense', color: '#f43f5e', icon: '🛍️' },
      { id: '13', name: 'Other Expenses', type: 'expense', color: '#64748b', icon: '📝' }
    ];
  }
} 