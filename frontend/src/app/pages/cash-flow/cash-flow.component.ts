import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CashFlowService } from '../../services/cash-flow.service';
import { CashFlowTransaction, DailyCashFlow, CashFlowCategory, CashFlowSummary } from '../../models/cash-flow.model';
import { ModalComponent } from '../../components/modal/modal.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-cash-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent, BaseChartDirective],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Cash Flow Calendar</h1>
          <p class="mt-1 text-sm text-gray-600">
            Track your income and expenses with interactive cash flow analysis
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex space-x-3">
          <button 
            (click)="openTransactionModal()"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Transaction
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Current Balance</dt>
                  <dd class="text-lg font-semibold text-gray-900">{{ formatCurrency(currentBalance()) }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Monthly Income</dt>
                  <dd class="text-lg font-semibold text-green-600">{{ formatCurrency(summary()?.totalIncome || 0) }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Monthly Expenses</dt>
                  <dd class="text-lg font-semibold text-red-600">{{ formatCurrency(summary()?.totalExpenses || 0) }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8" [class]="netCashFlowClass()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Net Cash Flow</dt>
                  <dd class="text-lg font-semibold" [class]="netCashFlowClass()">
                    {{ formatCurrency(summary()?.netCashFlow || 0) }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">30-Day Projection</dt>
                  <dd class="text-lg font-semibold text-gray-900">
                    {{ formatCurrency(summary()?.projectedBalance30Days || 0) }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Warnings -->
      <div *ngIf="summary()?.lowCashWarnings && summary()!.lowCashWarnings.length > 0" 
           class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Cash Flow Warnings</h3>
            <div class="mt-2 text-sm text-yellow-700">
              <ul class="list-disc pl-5 space-y-1">
                <li *ngFor="let warning of summary()?.lowCashWarnings">{{ warning }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            *ngFor="let tab of tabs"
            (click)="activeTab.set(tab.id)"
            [class]="activeTab() === tab.id ? 
              'border-primary-500 text-primary-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm' : 
              'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Calendar View -->
      <div *ngIf="activeTab() === 'calendar'" class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900">
            {{ monthNames[currentMonth()] }} {{ currentYear() }}
          </h2>
          <div class="flex space-x-2">
            <button 
              (click)="previousMonth()"
              class="p-2 hover:bg-gray-100 rounded-md"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              (click)="nextMonth()"
              class="p-2 hover:bg-gray-100 rounded-md"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-px bg-gray-200">
          <!-- Weekday headers -->
          <div *ngFor="let day of weekDays" 
               class="bg-gray-50 py-2 text-center text-xs font-medium text-gray-700">
            {{ day }}
          </div>

          <!-- Calendar days -->
          <div *ngFor="let day of calendarDays()" 
               (click)="selectDay(day)"
               [class]="getDayClass(day)"
               class="bg-white p-2 h-24 cursor-pointer hover:bg-gray-50">
            <div class="font-medium text-sm">{{ day?.date.getDate() || '' }}</div>
            <div *ngIf="day" class="mt-1 space-y-1">
              <div *ngIf="day.income > 0" class="text-xs text-green-600 font-medium">
                +{{ formatCurrency(day.income) }}
              </div>
              <div *ngIf="day.expenses > 0" class="text-xs text-red-600 font-medium">
                -{{ formatCurrency(day.expenses) }}
              </div>
              <div class="text-xs font-medium" 
                   [class]="day.endingBalance >= currentBalance() ? 'text-gray-900' : 'text-orange-600'">
                {{ formatCurrency(day.endingBalance) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions View -->
      <div *ngIf="activeTab() === 'transactions'" class="bg-white shadow rounded-lg p-6">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let transaction of paginatedTransactions()">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(transaction.date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ transaction.description }}
                  <span *ngIf="transaction.isRecurring" 
                        class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {{ transaction.recurringFrequency }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="inline-flex items-center">
                    <span class="mr-2">{{ getCategoryIcon(transaction.category) }}</span>
                    {{ transaction.category }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="transaction.type === 'income' ? 
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800' : 
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'">
                    {{ transaction.type }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium"
                    [class]="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'">
                  {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button (click)="editTransaction(transaction)" 
                          class="text-primary-600 hover:text-primary-900 mr-3">
                    Edit
                  </button>
                  <button (click)="deleteTransaction(transaction.id)" 
                          class="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="mt-4 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage() - 1) * pageSize + 1 }} to 
            {{ Math.min(currentPage() * pageSize, filteredTransactions().length) }} of 
            {{ filteredTransactions().length }} transactions
          </div>
          <div class="flex space-x-2">
            <button 
              (click)="previousPage()"
              [disabled]="currentPage() === 1"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button 
              (click)="nextPage()"
              [disabled]="currentPage() >= totalPages()"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Analytics View -->
      <div *ngIf="activeTab() === 'analytics'" class="space-y-6">
        <!-- Category Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Income by Category</h3>
            <div style="position: relative; height:300px; width:100%">
              <canvas baseChart
                [data]="incomeChartData"
                [options]="pieChartOptions"
                [type]="'pie'">
              </canvas>
            </div>
          </div>

          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
            <div style="position: relative; height:300px; width:100%">
              <canvas baseChart
                [data]="expenseChartData"
                [options]="pieChartOptions"
                [type]="'pie'">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Cash Flow Trend -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Cash Flow Trend</h3>
          <div style="position: relative; height:300px; width:100%">
            <canvas baseChart
              [data]="trendChartData"
              [options]="lineChartOptions"
              [type]="'line'">
            </canvas>
          </div>
        </div>

        <!-- Category Details -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Category Details</h3>
          <div class="space-y-4">
            <div *ngFor="let category of categoryDetails()" 
                 class="flex items-center justify-between p-4 border rounded-lg">
              <div class="flex items-center">
                <span class="text-2xl mr-3">{{ getCategoryIcon(category.category.split(' ')[0]) }}</span>
                <div>
                  <p class="font-medium text-gray-900">{{ category.category }}</p>
                  <p class="text-sm text-gray-500">{{ category.count }} transactions</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-semibold" 
                   [class]="category.category.includes('(income)') ? 'text-green-600' : 'text-red-600'">
                  {{ formatCurrency(category.amount) }}
                </p>
                <p class="text-sm text-gray-500">{{ category.percentage.toFixed(1) }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Day Detail Modal -->
      <app-modal
        *ngIf="showDayDetail()"
        [title]="'Transactions for ' + formatDate(selectedDay()?.date)"
        [size]="'lg'"
        (close)="closeDayDetail()"
      >
        <div class="space-y-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">Starting Balance</p>
                <p class="text-lg font-semibold">{{ formatCurrency(selectedDay()?.startingBalance || 0) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Ending Balance</p>
                <p class="text-lg font-semibold">{{ formatCurrency(selectedDay()?.endingBalance || 0) }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <h4 class="font-medium text-gray-900">Transactions</h4>
            <div *ngIf="selectedDay()?.transactions.length === 0" 
                 class="text-center py-8 text-gray-500">
              No transactions on this day
            </div>
            <div *ngFor="let transaction of selectedDay()?.transactions" 
                 class="flex items-center justify-between p-3 border rounded-lg">
              <div class="flex items-center">
                <span class="text-xl mr-3">{{ getCategoryIcon(transaction.category) }}</span>
                <div>
                  <p class="font-medium">{{ transaction.description }}</p>
                  <p class="text-sm text-gray-500">{{ transaction.category }}</p>
                </div>
              </div>
              <p class="font-semibold" 
                 [class]="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'">
                {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
              </p>
            </div>
          </div>

          <button 
            (click)="openTransactionModalForDay()"
            class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
          >
            + Add Transaction for This Day
          </button>
        </div>
      </app-modal>

      <!-- Transaction Form Modal -->
      <app-modal
        *ngIf="showTransactionModal()"
        [title]="editingTransaction() ? 'Edit Transaction' : 'Add Transaction'"
        [size]="'md'"
        (close)="closeTransactionModal()"
      >
        <form [formGroup]="transactionForm" (ngSubmit)="saveTransaction()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Type</label>
            <div class="mt-1 flex space-x-4">
              <label class="flex items-center">
                <input type="radio" formControlName="type" value="income" class="mr-2">
                <span class="text-sm">Income</span>
              </label>
              <label class="flex items-center">
                <input type="radio" formControlName="type" value="expense" class="mr-2">
                <span class="text-sm">Expense</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Date</label>
            <input 
              type="date" 
              formControlName="date"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Amount</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">$</span>
              </div>
              <input 
                type="number" 
                formControlName="amount"
                step="0.01"
                class="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="0.00"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Category</label>
            <select 
              formControlName="category"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              <option *ngFor="let cat of getFilteredCategories()" [value]="cat.name">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <input 
              type="text" 
              formControlName="description"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Enter description"
            >
          </div>

          <div>
            <label class="flex items-center">
              <input 
                type="checkbox" 
                formControlName="isRecurring"
                class="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
              <span class="ml-2 text-sm text-gray-700">Recurring transaction</span>
            </label>
          </div>

          <div *ngIf="transactionForm.get('isRecurring')?.value">
            <label class="block text-sm font-medium text-gray-700">Recurring Frequency</label>
            <select 
              formControlName="recurringFrequency"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
              (click)="closeTransactionModal()"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              [disabled]="!transactionForm.valid"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ editingTransaction() ? 'Update' : 'Save' }} Transaction
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: []
})
export class CashFlowComponent implements OnInit {
  // State
  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());
  activeTab = signal<'calendar' | 'transactions' | 'analytics'>('calendar');
  showTransactionModal = signal(false);
  showDayDetail = signal(false);
  selectedDay = signal<DailyCashFlow | null>(null);
  editingTransaction = signal<CashFlowTransaction | null>(null);
  currentPage = signal(1);
  pageSize = 10;
  
  // Data
  transactions = signal<CashFlowTransaction[]>([]);
  categories = signal<CashFlowCategory[]>([]);
  monthlySummary = signal<CashFlowSummary | null>(null);
  monthlyDays = signal<DailyCashFlow[]>([]);

  // Form
  transactionForm: FormGroup;

  // Constants
  tabs = [
    { id: 'calendar', name: 'Calendar View' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'analytics', name: 'Analytics' }
  ];

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Computed values
  calendarDays = computed(() => {
    const firstDay = new Date(this.currentYear(), this.currentMonth(), 1);
    const startPadding = firstDay.getDay();
    const days: (DailyCashFlow | null)[] = [];

    // Add padding for start of month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add actual days
    days.push(...this.monthlyDays());

    return days;
  });

  filteredTransactions = computed(() => {
    return this.transactions()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  paginatedTransactions = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredTransactions().slice(start, end);
  });

  totalPages = computed(() => 
    Math.ceil(this.filteredTransactions().length / this.pageSize)
  );

  summary = computed(() => this.monthlySummary());
  
  currentBalance = computed(() => {
    const summary = this.monthlySummary();
    return summary?.closingBalance || 10000;
  });

  categoryDetails = computed(() => {
    const summary = this.monthlySummary();
    return summary?.categoryBreakdown || [];
  });

  // Chart data
  incomeChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: []
    }]
  };

  expenseChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: []
    }]
  };

  trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Balance',
      data: [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      }
    }
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => '$' + Number(value).toLocaleString()
        }
      }
    }
  };

  constructor(
    private cashFlowService: CashFlowService,
    private fb: FormBuilder
  ) {
    this.transactionForm = this.fb.group({
      type: ['expense', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      description: ['', Validators.required],
      isRecurring: [false],
      recurringFrequency: ['monthly']
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    // Load categories
    const categories = await firstValueFrom(this.cashFlowService.getCategories());
    this.categories.set(categories);

    // Load transactions
    const transactions = await firstValueFrom(this.cashFlowService.getTransactions());
    this.transactions.set(transactions);

    // Load current month data
    await this.loadMonthData();
  }

  async loadMonthData() {
    // Get monthly summary
    const summary = await firstValueFrom(
      this.cashFlowService.getMonthlySummary(this.currentYear(), this.currentMonth())
    );
    this.monthlySummary.set(summary);

    // Get daily cash flows for the month
    const daysInMonth = new Date(this.currentYear(), this.currentMonth() + 1, 0).getDate();
    const dailyFlows: DailyCashFlow[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear(), this.currentMonth(), day);
      const dailyFlow = await firstValueFrom(this.cashFlowService.getDailyCashFlow(date));
      dailyFlows.push(dailyFlow);
    }

    this.monthlyDays.set(dailyFlows);
    this.updateCharts();
  }

  updateCharts() {
    const summary = this.monthlySummary();
    if (!summary) return;

    // Income chart
    const incomeData = summary.categoryBreakdown
      .filter(c => c.category.includes('(income)'))
      .map(c => ({
        label: c.category.replace(' (income)', ''),
        value: c.amount
      }));

    this.incomeChartData.labels = incomeData.map(d => d.label);
    this.incomeChartData.datasets[0].data = incomeData.map(d => d.value);
    this.incomeChartData.datasets[0].backgroundColor = [
      '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#6366f1'
    ];

    // Expense chart
    const expenseData = summary.categoryBreakdown
      .filter(c => c.category.includes('(expense)'))
      .map(c => ({
        label: c.category.replace(' (expense)', ''),
        value: c.amount
      }));

    this.expenseChartData.labels = expenseData.map(d => d.label);
    this.expenseChartData.datasets[0].data = expenseData.map(d => d.value);
    this.expenseChartData.datasets[0].backgroundColor = [
      '#ef4444', '#f97316', '#eab308', '#14b8a6', '#ec4899', '#a855f7', '#06b6d4', '#64748b'
    ];

    // Trend chart
    const dailyFlow = this.monthlyDays();
    this.trendChartData.labels = dailyFlow.map(d => d.date.getDate().toString());
    this.trendChartData.datasets[0].data = dailyFlow.map(d => d.endingBalance);
  }

  // Navigation methods
  async previousMonth() {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    await this.loadMonthData();
  }

  async nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    await this.loadMonthData();
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  // UI methods
  getDayClass(day: DailyCashFlow | null): string {
    if (!day) return '';
    
    const baseClass = 'bg-white p-2 h-24 cursor-pointer hover:bg-gray-50 ';
    const today = new Date();
    const isToday = day.date.toDateString() === today.toDateString();
    
    if (isToday) {
      return baseClass + 'ring-2 ring-primary-500';
    }
    
    if (day.endingBalance < 1000) {
      return baseClass + 'bg-red-50';
    }
    
    return baseClass;
  }

  selectDay(day: DailyCashFlow | null) {
    if (day) {
      this.selectedDay.set(day);
      this.showDayDetail.set(true);
    }
  }

  closeDayDetail() {
    this.showDayDetail.set(false);
    this.selectedDay.set(null);
  }

  openTransactionModal() {
    this.editingTransaction.set(null);
    this.transactionForm.reset({
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringFrequency: 'monthly'
    });
    this.showTransactionModal.set(true);
  }

  openTransactionModalForDay() {
    const date = this.selectedDay()?.date;
    if (date) {
      this.openTransactionModal();
      this.transactionForm.patchValue({
        date: date.toISOString().split('T')[0]
      });
    }
  }

  closeTransactionModal() {
    this.showTransactionModal.set(false);
    this.editingTransaction.set(null);
  }

  editTransaction(transaction: CashFlowTransaction) {
    this.editingTransaction.set(transaction);
    this.transactionForm.patchValue({
      type: transaction.type,
      date: new Date(transaction.date).toISOString().split('T')[0],
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      isRecurring: transaction.isRecurring,
      recurringFrequency: transaction.recurringFrequency || 'monthly'
    });
    this.showTransactionModal.set(true);
  }

  async saveTransaction() {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const transaction: CashFlowTransaction = {
        ...formValue,
        date: new Date(formValue.date),
        amount: parseFloat(formValue.amount)
      };

      if (this.editingTransaction()) {
        await firstValueFrom(
          this.cashFlowService.updateTransaction(this.editingTransaction()!.id!, transaction)
        );
      } else {
        await firstValueFrom(this.cashFlowService.addTransaction(transaction));
      }

      await this.loadData();
      this.closeTransactionModal();
    }
  }

  async deleteTransaction(id: string) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await firstValueFrom(this.cashFlowService.deleteTransaction(id));
      await this.loadData();
    }
  }

  getFilteredCategories() {
    const type = this.transactionForm.get('type')?.value;
    return this.categories().filter(c => c.type === type);
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.categories()
      .find(c => c.name === categoryName);
    return category?.icon || '📊';
  }

  // Formatting methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  }

  netCashFlowClass(): string {
    const net = this.summary()?.netCashFlow || 0;
    return net >= 0 ? 'text-green-600' : 'text-red-600';
  }

  Math = Math;
} 