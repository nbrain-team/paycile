import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CashFlowService } from '../../services/cash-flow.service';
import { 
  CashFlowTransaction, 
  DailyCashFlow, 
  CashFlowSummary,
  CashFlowProjection,
  CashFlowCategory,
  Budget,
  CashFlowAlert
} from '../../models/cash-flow.model';
import { ModalComponent } from '../../components/modal/modal.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-cash-flow-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent, BaseChartDirective],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Cash Flow Calendar</h1>
          <p class="mt-1 text-sm text-gray-600">
            Track and manage your cash flow with interactive calendar and projections
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex space-x-3">
          <button 
            class="btn-secondary"
            (click)="showProjections = !showProjections"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {{ showProjections ? 'Hide' : 'Show' }} Projections
          </button>
          <button 
            class="btn-primary"
            (click)="openTransactionModal()"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Transaction
          </button>
        </div>
      </div>

      <!-- Alerts -->
      <div *ngIf="(alerts$ | async) as alerts" class="space-y-2">
        <div 
          *ngFor="let alert of alerts"
          [ngClass]="getAlertClass(alert.severity)"
          class="p-4 rounded-lg flex items-start"
        >
          <svg class="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium">{{ alert.message }}</p>
            <p class="text-xs mt-1">{{ alert.date | date:'short' }}</p>
          </div>
          <button 
            class="ml-4 text-sm underline"
            (click)="dismissAlert(alert)"
          >
            Dismiss
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Current Balance</p>
              <p class="mt-1 text-2xl font-semibold" [ngClass]="currentBalance() >= 0 ? 'text-gray-900' : 'text-red-600'">
                {{ formatCurrency(currentBalance()) }}
              </p>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Monthly Income</p>
              <p class="mt-1 text-2xl font-semibold text-green-600">
                {{ formatCurrency(monthlySummary()?.totalIncome || 0) }}
              </p>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Monthly Expenses</p>
              <p class="mt-1 text-2xl font-semibold text-red-600">
                {{ formatCurrency(monthlySummary()?.totalExpenses || 0) }}
              </p>
            </div>
            <div class="p-3 bg-red-100 rounded-full">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Net Cash Flow</p>
              <p class="mt-1 text-2xl font-semibold" [ngClass]="(monthlySummary()?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(monthlySummary()?.netCashFlow || 0) }}
              </p>
            </div>
            <div class="p-3 rounded-full" [ngClass]="(monthlySummary()?.netCashFlow || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'">
              <svg class="h-6 w-6" [ngClass]="(monthlySummary()?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Calendar -->
        <div class="lg:col-span-2">
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <!-- Calendar Navigation -->
              <div class="flex items-center justify-between mb-4">
                <button
                  class="p-2 hover:bg-gray-100 rounded-full"
                  (click)="previousMonth()"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 class="text-lg font-semibold text-gray-900">
                  {{ getMonthYear() }}
                </h2>
                <button
                  class="p-2 hover:bg-gray-100 rounded-full"
                  (click)="nextMonth()"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <!-- Calendar Grid -->
              <div class="grid grid-cols-7 gap-px bg-gray-200">
                <!-- Day Headers -->
                <div *ngFor="let day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" 
                     class="bg-gray-50 py-2 text-center text-xs font-medium text-gray-700">
                  {{ day }}
                </div>

                <!-- Calendar Days -->
                <div 
                  *ngFor="let day of calendarDays()"
                  class="bg-white p-2 min-h-[100px] cursor-pointer hover:bg-gray-50"
                  [class.text-gray-400]="!day.isCurrentMonth"
                  [class.ring-2]="day.isToday"
                  [class.ring-blue-500]="day.isToday"
                  (click)="selectDate(day.date)"
                >
                  <div class="text-sm font-medium">{{ day.date.getDate() }}</div>
                  <div *ngIf="day.cashFlow" class="mt-1 space-y-1">
                    <div *ngIf="day.cashFlow.totalIncome > 0" class="text-xs text-green-600">
                      +{{ formatCompactCurrency(day.cashFlow.totalIncome) }}
                    </div>
                    <div *ngIf="day.cashFlow.totalExpenses > 0" class="text-xs text-red-600">
                      -{{ formatCompactCurrency(day.cashFlow.totalExpenses) }}
                    </div>
                    <div class="text-xs font-medium" [ngClass]="day.cashFlow.endingBalance >= 0 ? 'text-gray-700' : 'text-red-700'">
                      {{ formatCompactCurrency(day.cashFlow.endingBalance) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Day Details -->
          <div *ngIf="selectedDate()" class="mt-6 bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                {{ selectedDate() | date:'EEEE, MMMM d, yyyy' }}
              </h3>
              
              <div *ngIf="selectedDayFlow() as dayFlow" class="space-y-4">
                <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p class="text-sm text-gray-600">Starting Balance</p>
                    <p class="font-semibold">{{ formatCurrency(dayFlow.startingBalance) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Ending Balance</p>
                    <p class="font-semibold" [ngClass]="dayFlow.endingBalance >= 0 ? 'text-gray-900' : 'text-red-600'">
                      {{ formatCurrency(dayFlow.endingBalance) }}
                    </p>
                  </div>
                </div>

                <!-- Transactions -->
                <div>
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Transactions</h4>
                  <div class="space-y-2">
                    <div 
                      *ngFor="let transaction of dayFlow.transactions"
                      class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div class="flex items-center space-x-3">
                        <span class="text-2xl">{{ getCategoryIcon(transaction.category) }}</span>
                        <div>
                          <p class="text-sm font-medium text-gray-900">{{ transaction.description }}</p>
                          <p class="text-xs text-gray-500">{{ transaction.category }}</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold" [ngClass]="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'">
                          {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                        </p>
                        <div class="flex items-center space-x-2 mt-1">
                          <button 
                            class="text-xs text-gray-500 hover:text-gray-700"
                            (click)="editTransaction(transaction)"
                          >
                            Edit
                          </button>
                          <button 
                            class="text-xs text-red-500 hover:text-red-700"
                            (click)="deleteTransaction(transaction)"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    <div *ngIf="dayFlow.transactions.length === 0" class="text-center py-4 text-gray-500">
                      No transactions for this day
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Category Breakdown -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
              
              <!-- Income Categories -->
              <div class="mb-6">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Income</h4>
                <div class="space-y-2">
                  <div 
                    *ngFor="let cat of categoryBreakdown().income"
                    class="flex items-center justify-between"
                  >
                    <div class="flex items-center space-x-2">
                      <span>{{ cat.icon }}</span>
                      <span class="text-sm text-gray-700">{{ cat.name }}</span>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium text-gray-900">{{ formatCurrency(cat.amount) }}</p>
                      <p class="text-xs text-gray-500">{{ cat.percentage.toFixed(1) }}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Expense Categories -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Expenses</h4>
                <div class="space-y-2">
                  <div 
                    *ngFor="let cat of categoryBreakdown().expenses"
                    class="flex items-center justify-between"
                  >
                    <div class="flex items-center space-x-2">
                      <span>{{ cat.icon }}</span>
                      <span class="text-sm text-gray-700">{{ cat.name }}</span>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium text-gray-900">{{ formatCurrency(cat.amount) }}</p>
                      <p class="text-xs text-gray-500">{{ cat.percentage.toFixed(1) }}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Budget Status -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Budget Status</h3>
                <button 
                  class="text-sm text-blue-600 hover:text-blue-700"
                  (click)="openBudgetModal()"
                >
                  Manage
                </button>
              </div>
              
              <div class="space-y-3">
                <div *ngFor="let budget of budgets$ | async" class="space-y-1">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-700">{{ budget.category }}</span>
                    <span class="font-medium">
                      {{ getBudgetSpent(budget) | currency }} / {{ budget.amount | currency }}
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full transition-all"
                      [ngClass]="getBudgetProgressClass(budget)"
                      [style.width.%]="getBudgetProgress(budget)"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Projections Section -->
      <div *ngIf="showProjections" class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">30-Day Cash Flow Projection</h3>
          
          <div class="mb-6">
            <canvas baseChart
              [data]="projectionChartData"
              [options]="projectionChartOptions"
              [type]="'line'"
              style="height: 300px;">
            </canvas>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-sm text-gray-600">Current Balance</p>
              <p class="text-xl font-semibold">{{ formatCurrency(currentBalance()) }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-600">Projected in 30 Days</p>
              <p class="text-xl font-semibold" [ngClass]="projectedBalance30Days() >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(projectedBalance30Days()) }}
              </p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-600">Lowest Point</p>
              <p class="text-xl font-semibold" [ngClass]="lowestProjectedBalance() >= 0 ? 'text-gray-900' : 'text-red-600'">
                {{ formatCurrency(lowestProjectedBalance()) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction Modal -->
    <app-modal
      *ngIf="showTransactionModal"
      [title]="editingTransaction ? 'Edit Transaction' : 'Add Transaction'"
      (close)="closeTransactionModal()"
    >
      <form [formGroup]="transactionForm" (ngSubmit)="saveTransaction()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Type</label>
          <div class="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="px-4 py-2 border rounded-md text-sm font-medium transition-colors"
              [ngClass]="transactionForm.get('type')?.value === 'income' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'"
              (click)="transactionForm.patchValue({ type: 'income' })"
            >
              Income
            </button>
            <button
              type="button"
              class="px-4 py-2 border rounded-md text-sm font-medium transition-colors"
              [ngClass]="transactionForm.get('type')?.value === 'expense' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'"
              (click)="transactionForm.patchValue({ type: 'expense' })"
            >
              Expense
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            formControlName="date"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Category</label>
          <select
            formControlName="category"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select a category</option>
            <option 
              *ngFor="let cat of getFilteredCategories()" 
              [value]="cat.name"
            >
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            formControlName="description"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            formControlName="amount"
            step="0.01"
            min="0"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
        </div>

        <div>
          <label class="flex items-center">
            <input
              type="checkbox"
              formControlName="isRecurring"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            >
            <span class="ml-2 text-sm text-gray-700">Recurring transaction</span>
          </label>
        </div>

        <div *ngIf="transactionForm.get('isRecurring')?.value">
          <label class="block text-sm font-medium text-gray-700">Frequency</label>
          <select
            formControlName="recurringFrequency"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            class="btn-secondary"
            (click)="closeTransactionModal()"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            [disabled]="!transactionForm.valid"
          >
            {{ editingTransaction ? 'Update' : 'Add' }} Transaction
          </button>
        </div>
      </form>
    </app-modal>

    <!-- Budget Modal -->
    <app-modal
      *ngIf="showBudgetModal"
      title="Manage Budgets"
      (close)="closeBudgetModal()"
      size="lg"
    >
      <div class="space-y-6">
        <!-- Add Budget Form -->
        <form [formGroup]="budgetForm" (ngSubmit)="saveBudget()" class="p-4 bg-gray-50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 mb-4">Add New Budget</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Category</label>
              <select
                formControlName="category"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                <option 
                  *ngFor="let cat of categories$ | async" 
                  [value]="cat.name"
                >
                  {{ cat.icon }} {{ cat.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                formControlName="amount"
                step="0.01"
                min="0"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button type="submit" class="btn-primary" [disabled]="!budgetForm.valid">
              Add Budget
            </button>
          </div>
        </form>

        <!-- Existing Budgets -->
        <div>
          <h4 class="text-sm font-medium text-gray-900 mb-4">Current Budgets</h4>
          <div class="space-y-2">
            <div 
              *ngFor="let budget of budgets$ | async"
              class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div>
                <p class="font-medium text-gray-900">{{ budget.category }}</p>
                <p class="text-sm text-gray-500">{{ budget.amount | currency }} per {{ budget.period }}</p>
              </div>
              <button
                class="text-red-600 hover:text-red-700"
                (click)="deleteBudget(budget)"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CashFlowCalendarComponent implements OnInit {
  // Form Groups
  transactionForm: FormGroup;
  budgetForm: FormGroup;

  // UI State
  showTransactionModal = false;
  showBudgetModal = false;
  showProjections = false;
  editingTransaction: CashFlowTransaction | null = null;

  // Calendar State
  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());
  selectedDate = signal<Date | null>(null);

  // Data Observables
  categories$ = this.cashFlowService.getCategories();
  budgets$ = this.cashFlowService.getBudgets();
  alerts$ = this.cashFlowService.getAlerts();

  // Computed Values
  currentBalance = signal(0);
  monthlySummary = signal<CashFlowSummary | null>(null);
  projections = signal<CashFlowProjection[]>([]);

  // Chart Data
  projectionChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Projected Balance',
        data: [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Current Balance',
        data: [],
        borderColor: 'rgb(156, 163, 175)',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        pointRadius: 0
      }
    ]
  };

  projectionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => {
            return '$' + (Number(value) / 1000).toFixed(0) + 'k';
          }
        },
        grid: {
          color: (context) => {
            if (context.tick.value === 0) {
              return 'rgb(239, 68, 68)';
            }
            return 'rgba(0, 0, 0, 0.1)';
          }
        }
      }
    }
  };

  // Computed calendar days
  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startCalendar = new Date(firstDay);
    startCalendar.setDate(startCalendar.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startCalendar);
      date.setDate(date.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        cashFlow: null as DailyCashFlow | null
      });
      
      if (date > lastDay && date.getDay() === 6) break;
    }
    
    // Load cash flow data for each day
    days.forEach(day => {
      this.cashFlowService.getDailyCashFlow(day.date).subscribe(flow => {
        day.cashFlow = flow;
      });
    });
    
    return days;
  });

  selectedDayFlow = computed(() => {
    const date = this.selectedDate();
    if (!date) return null;
    
    let flow: DailyCashFlow | null = null;
    this.cashFlowService.getDailyCashFlow(date).subscribe(f => flow = f);
    return flow;
  });

  categoryBreakdown = computed(() => {
    const summary = this.monthlySummary();
    if (!summary) return { income: [], expenses: [] };

    const income = summary.categoryBreakdown
      .filter(cat => cat.category.includes('(income)'))
      .map(cat => {
        const name = cat.category.replace(' (income)', '');
        const category = this.getCategoryByName(name);
        return {
          name,
          icon: category?.icon || '💰',
          amount: cat.amount,
          percentage: cat.percentage
        };
      });

    const expenses = summary.categoryBreakdown
      .filter(cat => cat.category.includes('(expense)'))
      .map(cat => {
        const name = cat.category.replace(' (expense)', '');
        const category = this.getCategoryByName(name);
        return {
          name,
          icon: category?.icon || '💸',
          amount: cat.amount,
          percentage: cat.percentage
        };
      });

    return { income, expenses };
  });

  projectedBalance30Days = computed(() => {
    const projections = this.projections();
    return projections.length > 0 ? projections[projections.length - 1].projectedBalance : 0;
  });

  lowestProjectedBalance = computed(() => {
    const projections = this.projections();
    return projections.length > 0 
      ? Math.min(...projections.map(p => p.projectedBalance))
      : 0;
  });

  constructor(
    private cashFlowService: CashFlowService,
    private fb: FormBuilder
  ) {
    // Initialize forms
    this.transactionForm = this.fb.group({
      type: ['expense', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      isRecurring: [false],
      recurringFrequency: ['monthly'],
      notes: ['']
    });

    this.budgetForm = this.fb.group({
      category: ['', Validators.required],
      type: ['expense'],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      period: ['monthly']
    });
  }

  ngOnInit() {
    this.loadMonthlySummary();
    this.loadProjections();
    this.updateCurrentBalance();
  }

  // Data Loading
  loadMonthlySummary() {
    this.cashFlowService.getMonthlySummary(this.currentYear(), this.currentMonth())
      .subscribe(summary => {
        this.monthlySummary.set(summary);
      });
  }

  loadProjections() {
    this.cashFlowService.getProjections(30).subscribe(projections => {
      this.projections.set(projections);
      this.updateProjectionChart(projections);
    });
  }

  updateCurrentBalance() {
    // Calculate current balance from all transactions
    this.cashFlowService.getTransactions().subscribe(transactions => {
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      this.currentBalance.set(10000 + income - expenses); // 10000 is starting balance
    });
  }

  updateProjectionChart(projections: CashFlowProjection[]) {
    const currentBal = this.currentBalance();
    
    this.projectionChartData.labels = projections.map(p => 
      new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    
    this.projectionChartData.datasets[0].data = projections.map(p => p.projectedBalance);
    this.projectionChartData.datasets[1].data = projections.map(() => currentBal);
  }

  // Calendar Navigation
  previousMonth() {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.set(this.currentYear() - 1);
    } else {
      this.currentMonth.set(this.currentMonth() - 1);
    }
    this.loadMonthlySummary();
  }

  nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.set(this.currentYear() + 1);
    } else {
      this.currentMonth.set(this.currentMonth() + 1);
    }
    this.loadMonthlySummary();
  }

  selectDate(date: Date) {
    this.selectedDate.set(date);
  }

  getMonthYear(): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[this.currentMonth()]} ${this.currentYear()}`;
  }

  // Transaction Management
  openTransactionModal(transaction?: CashFlowTransaction) {
    if (transaction) {
      this.editingTransaction = transaction;
      this.transactionForm.patchValue({
        type: transaction.type,
        date: new Date(transaction.date).toISOString().split('T')[0],
        category: transaction.category,
        description: transaction.description,
        amount: transaction.amount,
        isRecurring: transaction.isRecurring,
        recurringFrequency: transaction.recurringFrequency || 'monthly',
        notes: transaction.notes || ''
      });
    } else {
      this.editingTransaction = null;
      const selectedDate = this.selectedDate();
      this.transactionForm.reset({
        type: 'expense',
        date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        isRecurring: false,
        recurringFrequency: 'monthly'
      });
    }
    this.showTransactionModal = true;
  }

  closeTransactionModal() {
    this.showTransactionModal = false;
    this.editingTransaction = null;
    this.transactionForm.reset();
  }

  saveTransaction() {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const transaction: CashFlowTransaction = {
        ...formValue,
        date: new Date(formValue.date),
        amount: parseFloat(formValue.amount)
      };

      if (this.editingTransaction) {
        this.cashFlowService.updateTransaction(this.editingTransaction.id!, transaction)
          .subscribe(() => {
            this.closeTransactionModal();
            this.loadMonthlySummary();
            this.loadProjections();
            this.updateCurrentBalance();
          });
      } else {
        this.cashFlowService.addTransaction(transaction)
          .subscribe(() => {
            this.closeTransactionModal();
            this.loadMonthlySummary();
            this.loadProjections();
            this.updateCurrentBalance();
          });
      }
    }
  }

  editTransaction(transaction: CashFlowTransaction) {
    this.openTransactionModal(transaction);
  }

  deleteTransaction(transaction: CashFlowTransaction) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.cashFlowService.deleteTransaction(transaction.id!)
        .subscribe(() => {
          this.loadMonthlySummary();
          this.loadProjections();
          this.updateCurrentBalance();
        });
    }
  }

  // Budget Management
  openBudgetModal() {
    this.showBudgetModal = true;
  }

  closeBudgetModal() {
    this.showBudgetModal = false;
    this.budgetForm.reset();
  }

  saveBudget() {
    if (this.budgetForm.valid) {
      const budget: Budget = {
        ...this.budgetForm.value,
        startDate: new Date()
      };

      this.cashFlowService.addBudget(budget).subscribe(() => {
        this.budgetForm.reset();
      });
    }
  }

  deleteBudget(budget: Budget) {
    if (confirm('Are you sure you want to delete this budget?')) {
      this.cashFlowService.deleteBudget(budget.id!).subscribe();
    }
  }

  getBudgetSpent(budget: Budget): number {
    const summary = this.monthlySummary();
    if (!summary) return 0;

    const categoryData = summary.categoryBreakdown.find(cat => 
      cat.category === `${budget.category} (${budget.type})`
    );

    return categoryData?.amount || 0;
  }

  getBudgetProgress(budget: Budget): number {
    const spent = this.getBudgetSpent(budget);
    return Math.min((spent / budget.amount) * 100, 100);
  }

  getBudgetProgressClass(budget: Budget): string {
    const progress = this.getBudgetProgress(budget);
    if (progress >= 100) return 'bg-red-500';
    if (progress >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  // Alert Management
  dismissAlert(alert: CashFlowAlert) {
    // In a real app, this would update the alert status
    console.log('Dismissing alert:', alert);
  }

  // Helper Methods
  getFilteredCategories(): CashFlowCategory[] {
    const type = this.transactionForm.get('type')?.value;
    let categories: CashFlowCategory[] = [];
    
    this.categories$.subscribe(cats => {
      categories = cats.filter(cat => cat.type === type);
    });
    
    return categories;
  }

  getCategoryByName(name: string): CashFlowCategory | undefined {
    let category: CashFlowCategory | undefined;
    this.categories$.subscribe(cats => {
      category = cats.find(cat => cat.name === name);
    });
    return category;
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.getCategoryByName(categoryName);
    return category?.icon || '💰';
  }

  getAlertClass(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 text-red-800 border border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-blue-50 text-blue-800 border border-blue-200';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatCompactCurrency(amount: number): string {
    if (amount >= 1000000) {
      return '$' + (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
      return '$' + (amount / 1000).toFixed(1) + 'k';
    } else {
      return '$' + amount.toFixed(0);
    }
  }
} 