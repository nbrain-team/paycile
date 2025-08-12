import { Component, OnInit, signal, computed, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DashboardStats {
  totalPolicies: number;
  totalPremiums: number;
  totalRevenue?: number;
  pendingInvoices: number;
  overduePayments: number;
  overdueInvoices?: number;
  outstandingPayments?: number;
  reconciliationRate?: number;
  totalClients: number;
  totalAgents: number;
  recentPayments: Array<any>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  policyDistribution: Array<{ type: string; count: number }>;
  paymentStatus: { completed: number; pending: number; failed: number };
  topAgents: Array<{ name: string; sales: number }>;
  recentActivities: Array<{ type: string; description: string; time: string }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-sm text-gray-500">Welcome back, {{ user()?.firstName || 'User' }}!</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="card">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Total Clients</p>
              <p class="mt-2 text-3xl font-semibold text-gray-900">
                {{ stats()?.totalClients || 0 }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <div class="p-3 bg-primary-100 rounded-lg">
                <svg class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Active Policies</p>
              <p class="mt-2 text-3xl font-semibold text-gray-900">
                {{ stats()?.totalPolicies || 0 }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <div class="p-3 bg-success-100 rounded-lg">
                <svg class="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Total Revenue</p>
              <p class="mt-2 text-3xl font-semibold text-gray-900">
                {{ '$' + (stats()?.totalRevenue || 0).toLocaleString() }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <div class="p-3 bg-success-100 rounded-lg">
                <svg class="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Reconciliation Rate</p>
              <p class="mt-2 text-3xl font-semibold text-gray-900">
                {{ stats()?.reconciliationRate || 0 }}%
              </p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <div class="p-3 bg-secondary-100 rounded-lg">
                <svg class="h-6 w-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alert Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card border-l-4 border-warning-500">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">
                {{ stats()?.overdueInvoices || 0 }} Overdue Invoices
              </h3>
              <p class="mt-1 text-sm text-gray-600">
                Total outstanding: {{ '$' + (stats()?.outstandingPayments || 0).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>

        <div class="card border-l-4 border-primary-500">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">
                Payment Trends
              </h3>
              <p class="mt-1 text-sm text-gray-600">
                {{ stats()?.recentPayments?.length || 0 }} payments in the last 30 days
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Revenue Trend Chart -->
        <div class="card">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <div style="position: relative; height:300px; width:100%">
            <canvas baseChart
              [data]="revenueChartData"
              [options]="revenueChartOptions"
              [type]="'line'">
            </canvas>
          </div>
        </div>

        <!-- Policy Distribution Chart -->
        <div class="card">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Policy Distribution</h3>
          <div style="position: relative; height:300px; width:100%">
            <canvas baseChart
              [data]="policyChartData"
              [options]="policyChartOptions"
              [type]="'doughnut'">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Second Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Payment Status Chart -->
        <div class="card">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Payment Status</h3>
          <div style="position: relative; height:200px; width:100%">
            <canvas baseChart
              [data]="paymentStatusChartData"
              [options]="paymentStatusChartOptions"
              [type]="'pie'">
            </canvas>
          </div>
          <div class="mt-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Completed</span>
              <span class="font-medium text-green-600">{{ stats()?.paymentStatus?.completed || 0 }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Pending</span>
              <span class="font-medium text-yellow-600">{{ stats()?.paymentStatus?.pending || 0 }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Failed</span>
              <span class="font-medium text-red-600">{{ stats()?.paymentStatus?.failed || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Top Agents Performance -->
        <div class="card">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Top Performing Agents</h3>
          <div style="position: relative; height:200px; width:100%">
            <canvas baseChart
              [data]="agentPerformanceChartData"
              [options]="agentPerformanceChartOptions"
              [type]="'bar'">
            </canvas>
          </div>
        </div>

        <!-- Recent Activities -->
        <div class="card">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
          <div class="flow-root">
            <ul class="-mb-8">
              <li *ngFor="let activity of recentActivities(); let i = index">
                <div class="relative pb-8">
                  <span *ngIf="i !== recentActivities().length - 1" class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                  <div class="relative flex space-x-3">
                    <div>
                      <span [ngClass]="getActivityIconClass(activity.type)" class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white">
                        <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getActivityIcon(activity.type)" />
                        </svg>
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div>
                        <p class="text-sm text-gray-900">{{ activity.description }}</p>
                        <p class="text-xs text-gray-500">{{ activity.time }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
        <div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button
            class="btn-primary btn-md"
            *ngIf="user()?.role !== 'client'"
            (click)="navigateTo('/policies')"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Policy
          </button>
          <button
            class="btn-primary btn-md bg-success-600 hover:bg-success-700"
            (click)="navigateTo('/payments')"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            View Payments
          </button>
          <button
            class="btn-secondary btn-md"
            (click)="navigateTo('/invoices')"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Invoices
          </button>
          <button
            class="btn-primary btn-md bg-secondary-600 hover:bg-secondary-700"
            (click)="navigateTo('/reconciliation')"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v7m12 0a2 2 0 01-2 2H8a2 2 0 01-2-2m12 0l-4-4-4 4" />
            </svg>
            Reconciliation
          </button>
        </div>
      </div>

      <!-- Performance Indicators -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4" *ngIf="user()?.role !== 'client'">
        <div class="card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Client Growth</p>
              <p class="mt-1 text-2xl font-semibold text-gray-900">{{ stats()?.totalClients || 0 }}</p>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="mt-2 text-sm text-green-600">+15% from last month</p>
        </div>

        <div class="bg-white p-4 rounded-lg shadow" *ngIf="user()?.role === 'broker' || user()?.role === 'admin'">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Active Agents</p>
              <p class="mt-1 text-2xl font-semibold text-gray-900">{{ stats()?.totalAgents || 0 }}</p>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p class="mt-2 text-sm text-blue-600">{{ getActiveAgentPercentage() }}% active rate</p>
        </div>

        <div class="bg-white p-4 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Recent Payments</p>
              <p class="mt-1 text-2xl font-semibold text-gray-900">{{ stats()?.recentPayments?.length || 0 }}</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-full">
              <svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <p class="mt-2 text-sm text-purple-600">Last 7 days</p>
        </div>

        <div class="bg-white p-4 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Collection Rate</p>
              <p class="mt-1 text-2xl font-semibold text-gray-900">{{ getCollectionRate() }}%</p>
            </div>
            <div class="p-3 bg-yellow-100 rounded-full">
              <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="mt-2 text-sm text-yellow-600">This month</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit, AfterViewInit {
  // Signals for reactive state
  stats = signal<DashboardStats | null>(null);
  loading = signal(false);
  user = this.authService.user;

  // Chart Data
  revenueChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Monthly Revenue',
      data: [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Revenue: ${this.formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            return '$' + (Number(value) / 1000).toFixed(0) + 'k';
          }
        }
      }
    }
  };

  policyChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(251, 146, 60)',
        'rgb(147, 51, 234)',
        'rgb(236, 72, 153)'
      ]
    }]
  };

  policyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      }
    }
  };

  paymentStatusChartData: ChartData<'pie'> = {
    labels: ['Completed', 'Pending', 'Failed'],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgb(16, 185, 129)',
        'rgb(251, 191, 36)',
        'rgb(239, 68, 68)'
      ]
    }]
  };

  paymentStatusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  agentPerformanceChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Sales',
      data: [],
      backgroundColor: 'rgba(147, 51, 234, 0.8)'
    }]
  };

  agentPerformanceChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Sales: ${this.formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            return '$' + (Number(value) / 1000).toFixed(0) + 'k';
          }
        }
      }
    }
  };

  // Computed values
  pendingAmount = computed(() => {
    const stats = this.stats();
    return stats ? stats.pendingInvoices * 1500 : 0; // Estimated average
  });

  recentActivities = computed(() => {
    const stats = this.stats();
    return stats?.recentActivities || [
      { type: 'payment', description: 'Payment received from John Doe', time: '2 hours ago' },
      { type: 'policy', description: 'New policy created for Jane Smith', time: '4 hours ago' },
      { type: 'invoice', description: 'Invoice sent to ABC Company', time: '6 hours ago' },
      { type: 'alert', description: 'Payment overdue for XYZ Corp', time: '1 day ago' }
    ];
  });

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardStats();
  }

  ngAfterViewInit() {
    // Update charts after view init
    setTimeout(() => {
      this.updateCharts();
    }, 100);
  }

  loadDashboardStats() {
    this.loading.set(true);
    
    // Simulated data for demonstration
    const mockStats: DashboardStats = {
      totalPolicies: 245,
      totalPremiums: 1256890,
      totalRevenue: 1256890,
      pendingInvoices: 42,
      overduePayments: 8,
      overdueInvoices: 8,
      outstandingPayments: 125000,
      reconciliationRate: 94,
      totalClients: 189,
      totalAgents: 24,
      recentPayments: [
        { id: 1, client: { firstName: 'John', lastName: 'Doe' }, amount: 2500, status: 'completed' },
        { id: 2, client: { firstName: 'Jane', lastName: 'Smith' }, amount: 1800, status: 'completed' },
        { id: 3, client: { firstName: 'Bob', lastName: 'Johnson' }, amount: 3200, status: 'pending' },
        { id: 4, client: { firstName: 'Alice', lastName: 'Brown' }, amount: 2100, status: 'completed' },
        { id: 5, client: { firstName: 'Tom', lastName: 'Wilson' }, amount: 2900, status: 'completed' }
      ],
      monthlyRevenue: [
        { month: 'Jan', revenue: 95000 },
        { month: 'Feb', revenue: 105000 },
        { month: 'Mar', revenue: 98000 },
        { month: 'Apr', revenue: 112000 },
        { month: 'May', revenue: 125000 },
        { month: 'Jun', revenue: 135000 }
      ],
      policyDistribution: [
        { type: 'Auto', count: 85 },
        { type: 'Home', count: 62 },
        { type: 'Life', count: 45 },
        { type: 'Health', count: 38 },
        { type: 'Commercial', count: 15 }
      ],
      paymentStatus: {
        completed: 145,
        pending: 42,
        failed: 8
      },
      topAgents: [
        { name: 'John Smith', sales: 45000 },
        { name: 'Jane Doe', sales: 38000 },
        { name: 'Bob Johnson', sales: 32000 },
        { name: 'Alice Brown', sales: 28000 },
        { name: 'Tom Wilson', sales: 25000 }
      ],
      recentActivities: [
        { type: 'payment', description: 'Payment received from John Doe - $2,500', time: '2 hours ago' },
        { type: 'policy', description: 'New auto policy created for Jane Smith', time: '4 hours ago' },
        { type: 'invoice', description: 'Invoice #INV-2024-089 sent to ABC Company', time: '6 hours ago' },
        { type: 'alert', description: 'Payment overdue for XYZ Corp - $5,000', time: '1 day ago' }
      ]
    };

    // Simulate API call
    setTimeout(() => {
      this.stats.set(mockStats);
      this.updateCharts();
      this.loading.set(false);
    }, 500);
  }

  updateCharts() {
    const stats = this.stats();
    if (!stats) return;

    // Update revenue chart
    this.revenueChartData.labels = stats.monthlyRevenue.map(m => m.month);
    this.revenueChartData.datasets[0].data = stats.monthlyRevenue.map(m => m.revenue);

    // Update policy distribution chart
    this.policyChartData.labels = stats.policyDistribution.map(p => p.type);
    this.policyChartData.datasets[0].data = stats.policyDistribution.map(p => p.count);

    // Update payment status chart
    this.paymentStatusChartData.datasets[0].data = [
      stats.paymentStatus.completed,
      stats.paymentStatus.pending,
      stats.paymentStatus.failed
    ];

    // Update agent performance chart
    this.agentPerformanceChartData.labels = stats.topAgents.map(a => a.name);
    this.agentPerformanceChartData.datasets[0].data = stats.topAgents.map(a => a.sales);
  }

  refreshData() {
    this.loadDashboardStats();
  }

  exportDashboard() {
    // TODO: Implement export functionality
    console.log('Exporting dashboard...');
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getCurrentDate(): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date());
  }

  getActiveAgentPercentage(): number {
    const stats = this.stats();
    if (!stats || !stats.totalAgents) return 0;
    return Math.round((stats.totalAgents * 0.85) / stats.totalAgents * 100);
  }

  getCollectionRate(): number {
    const stats = this.stats();
    if (!stats) return 0;
    const total = stats.paymentStatus.completed + stats.paymentStatus.pending + stats.paymentStatus.failed;
    if (total === 0) return 0;
    return Math.round(stats.paymentStatus.completed / total * 100);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'payment':
        return 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z';
      case 'policy':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'invoice':
        return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
      case 'alert':
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getActivityIconClass(type: string): string {
    switch (type) {
      case 'payment':
        return 'bg-green-500';
      case 'policy':
        return 'bg-blue-500';
      case 'invoice':
        return 'bg-purple-500';
      case 'alert':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }
} 