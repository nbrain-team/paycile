import { Component, OnInit, signal, computed, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface InsightMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    forecast: number;
  };
  policies: {
    active: number;
    new: number;
    renewals: number;
    cancellations: number;
  };
  clients: {
    total: number;
    new: number;
    retention: number;
    churnRate: number;
  };
  performance: {
    avgPremium: number;
    claimsRatio: number;
    profitMargin: number;
    operatingRatio: number;
  };
}

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Business Insights</h1>
          <p class="mt-1 text-sm text-gray-600">
            Advanced analytics and predictive insights for {{ selectedPeriod }}
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex space-x-3">
          <select
            [(ngModel)]="selectedPeriod"
            (ngModelChange)="onPeriodChange()"
            class="block w-40 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Year">This Year</option>
            <option value="Last Year">Last Year</option>
          </select>
          <button 
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            (click)="exportInsights()"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      <!-- Key Performance Indicators -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Revenue Growth</p>
              <p class="mt-2 text-3xl font-bold text-gray-900">{{ formatCurrency(metrics().revenue.current) }}</p>
              <p class="mt-2 flex items-center text-sm">
                <span [ngClass]="metrics().revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'" class="flex items-center">
                  <svg *ngIf="metrics().revenue.growth >= 0" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <svg *ngIf="metrics().revenue.growth < 0" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  {{ Math.abs(metrics().revenue.growth) }}%
                </span>
                <span class="ml-2 text-gray-500">vs last period</span>
              </p>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Forecast</span>
              <span class="font-medium">{{ formatCurrency(metrics().revenue.forecast) }}</span>
            </div>
            <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div class="bg-green-600 h-2 rounded-full" [style.width.%]="getProgressPercentage()"></div>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Client Retention</p>
              <p class="mt-2 text-3xl font-bold text-gray-900">{{ metrics().clients.retention }}%</p>
              <p class="mt-2 text-sm text-gray-500">
                {{ metrics().clients.total }} total clients
              </p>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-gray-600">New</span>
              <p class="font-medium">+{{ metrics().clients.new }}</p>
            </div>
            <div>
              <span class="text-gray-600">Churn</span>
              <p class="font-medium text-red-600">{{ metrics().clients.churnRate }}%</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Policy Performance</p>
              <p class="mt-2 text-3xl font-bold text-gray-900">{{ metrics().policies.active }}</p>
              <p class="mt-2 text-sm text-gray-500">
                Active policies
              </p>
            </div>
            <div class="p-3 bg-purple-100 rounded-full">
              <svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div>
              <span class="text-gray-600">New</span>
              <p class="font-medium text-green-600">+{{ metrics().policies.new }}</p>
            </div>
            <div>
              <span class="text-gray-600">Renewals</span>
              <p class="font-medium">{{ metrics().policies.renewals }}</p>
            </div>
            <div>
              <span class="text-gray-600">Cancelled</span>
              <p class="font-medium text-red-600">-{{ metrics().policies.cancellations }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Profit Margin</p>
              <p class="mt-2 text-3xl font-bold text-gray-900">{{ metrics().performance.profitMargin }}%</p>
              <p class="mt-2 text-sm text-gray-500">
                Operating ratio: {{ metrics().performance.operatingRatio }}%
              </p>
            </div>
            <div class="p-3 bg-yellow-100 rounded-full">
              <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-gray-600">Avg Premium</span>
              <p class="font-medium">{{ formatCurrency(metrics().performance.avgPremium) }}</p>
            </div>
            <div>
              <span class="text-gray-600">Claims Ratio</span>
              <p class="font-medium">{{ metrics().performance.claimsRatio }}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Analytics Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Revenue Trend Analysis -->
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Revenue Trend Analysis</h3>
            <span class="text-sm text-gray-500">Monthly comparison</span>
          </div>
          <canvas baseChart
            [data]="revenueTrendData"
            [options]="revenueTrendOptions"
            [type]="'line'"
            height="100">
          </canvas>
        </div>

        <!-- Policy Distribution -->
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Premium Distribution</h3>
            <span class="text-sm text-gray-500">By policy type</span>
          </div>
          <canvas baseChart
            [data]="premiumDistributionData"
            [options]="premiumDistributionOptions"
            [type]="'doughnut'"
            height="100">
          </canvas>
        </div>
      </div>

      <!-- Advanced Analytics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Conversion Funnel -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Conversion Funnel</h3>
          <div class="space-y-4">
            <div *ngFor="let stage of conversionFunnel()">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">{{ stage.name }}</span>
                <span class="text-sm text-gray-500">{{ stage.count }}</span>
              </div>
              <div class="mt-1 relative">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div [ngClass]="stage.color" class="h-2 rounded-full transition-all duration-300"
                       [style.width.%]="stage.percentage"></div>
                </div>
              </div>
              <p class="mt-1 text-xs text-gray-500">{{ stage.percentage }}% conversion</p>
            </div>
          </div>
        </div>

        <!-- Agent Performance Ranking -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
          <div class="space-y-3">
            <div *ngFor="let agent of topAgents(); let i = index" 
                 class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span class="text-sm font-medium text-gray-600">{{ i + 1 }}</span>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">{{ agent.name }}</p>
                  <p class="text-xs text-gray-500">{{ agent.policies }} policies</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(agent.revenue) }}</p>
                <p class="text-xs" [ngClass]="agent.growth >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ agent.growth >= 0 ? '+' : '' }}{{ agent.growth }}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Analysis -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Risk Analysis</h3>
          <canvas baseChart
            [data]="riskAnalysisData"
            [options]="riskAnalysisOptions"
            [type]="'radar'"
            height="100">
          </canvas>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Overall Risk Score</span>
              <span class="font-medium" [ngClass]="getRiskScoreClass()">{{ riskScore() }}/100</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Trend</span>
              <span class="font-medium text-green-600">Improving ↓</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Predictive Insights -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Predictive Insights & Recommendations</h3>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div *ngFor="let insight of predictiveInsights()" 
               class="p-4 rounded-lg border" 
               [ngClass]="getInsightBorderClass(insight.priority)">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6" [ngClass]="getInsightIconClass(insight.priority)" 
                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        [attr.d]="getInsightIcon(insight.type)" />
                </svg>
              </div>
              <div class="ml-3">
                <h4 class="text-sm font-medium text-gray-900">{{ insight.title }}</h4>
                <p class="mt-1 text-sm text-gray-600">{{ insight.description }}</p>
                <div class="mt-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="getInsightBadgeClass(insight.impact)">
                    {{ insight.impact }} impact
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comparative Analysis -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Year over Year Comparison -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Year over Year Comparison</h3>
          <canvas baseChart
            [data]="yearOverYearData"
            [options]="yearOverYearOptions"
            [type]="'bar'"
            height="100">
          </canvas>
        </div>

        <!-- Client Segmentation -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Client Segmentation</h3>
          <canvas baseChart
            [data]="clientSegmentationData"
            [options]="clientSegmentationOptions"
            [type]="'polarArea'"
            height="100">
          </canvas>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class InsightsComponent implements OnInit, AfterViewInit {
  // State
  metrics = signal<InsightMetrics>({
    revenue: {
      current: 1456789,
      previous: 1234567,
      growth: 18.2,
      forecast: 1678900
    },
    policies: {
      active: 3456,
      new: 234,
      renewals: 189,
      cancellations: 45
    },
    clients: {
      total: 2890,
      new: 156,
      retention: 94.5,
      churnRate: 5.5
    },
    performance: {
      avgPremium: 2456,
      claimsRatio: 68.5,
      profitMargin: 23.4,
      operatingRatio: 76.6
    }
  });

  selectedPeriod = 'This Month';
  loading = signal(false);
  riskScore = signal(72);

  // Computed values
  conversionFunnel = computed(() => [
    { name: 'Leads', count: 450, percentage: 100, color: 'bg-blue-600' },
    { name: 'Qualified', count: 320, percentage: 71, color: 'bg-indigo-600' },
    { name: 'Quoted', count: 280, percentage: 62, color: 'bg-purple-600' },
    { name: 'Negotiation', count: 180, percentage: 40, color: 'bg-pink-600' },
    { name: 'Closed', count: 145, percentage: 32, color: 'bg-green-600' }
  ]);

  topAgents = computed(() => [
    { name: 'Sarah Johnson', policies: 45, revenue: 125000, growth: 23.5 },
    { name: 'Michael Chen', policies: 42, revenue: 118000, growth: 18.2 },
    { name: 'Emily Davis', policies: 38, revenue: 105000, growth: 15.7 },
    { name: 'Robert Wilson', policies: 35, revenue: 98000, growth: -5.3 },
    { name: 'Jessica Brown', policies: 32, revenue: 89000, growth: 12.1 }
  ]);

  predictiveInsights = computed(() => [
    {
      type: 'revenue',
      priority: 'high',
      impact: 'High',
      title: 'Revenue Opportunity',
      description: 'Based on current trends, focusing on auto insurance could increase revenue by 15% next quarter.'
    },
    {
      type: 'risk',
      priority: 'medium',
      impact: 'Medium',
      title: 'Risk Alert',
      description: 'Claims ratio trending upward in home insurance segment. Consider reviewing underwriting criteria.'
    },
    {
      type: 'growth',
      priority: 'low',
      impact: 'Low',
      title: 'Growth Potential',
      description: 'Small business segment shows 25% YoY growth. Consider expanding marketing efforts.'
    }
  ]);

  // Chart Data
  revenueTrendData: ChartData<'line'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'This Year',
        data: [120000, 135000, 128000, 142000, 155000, 168000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Last Year',
        data: [100000, 110000, 115000, 118000, 125000, 130000],
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4
      }
    ]
  };

  revenueTrendOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  premiumDistributionData: ChartData<'doughnut'> = {
    labels: ['Auto', 'Home', 'Life', 'Health', 'Commercial'],
    datasets: [{
      data: [35, 25, 20, 15, 5],
      backgroundColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(251, 146, 60)',
        'rgb(147, 51, 234)',
        'rgb(236, 72, 153)'
      ]
    }]
  };

  premiumDistributionOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };

  riskAnalysisData: ChartData<'radar'> = {
    labels: ['Underwriting', 'Claims', 'Compliance', 'Market', 'Operational'],
    datasets: [{
      label: 'Current',
      data: [65, 75, 85, 60, 70],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.2)'
    }]
  };

  riskAnalysisOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  yearOverYearData: ChartData<'bar'> = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'This Year',
        data: [380000, 420000, 460000, 500000],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: 'Last Year',
        data: [320000, 350000, 380000, 400000],
        backgroundColor: 'rgba(156, 163, 175, 0.8)'
      }
    ]
  };

  yearOverYearOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  clientSegmentationData: ChartData<'polarArea'> = {
    labels: ['Individual', 'Family', 'Small Business', 'Enterprise', 'Government'],
    datasets: [{
      data: [45, 30, 15, 8, 2],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ]
    }]
  };

  clientSegmentationOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };

  ngOnInit() {
    this.loadInsights();
  }

  ngAfterViewInit() {
    // Charts will auto-render
  }

  loadInsights() {
    this.loading.set(true);
    // Simulate API call
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  onPeriodChange() {
    this.loadInsights();
  }

  exportInsights() {
    console.log('Exporting insights report...');
  }

  getProgressPercentage(): number {
    const metrics = this.metrics();
    return (metrics.revenue.current / metrics.revenue.forecast) * 100;
  }

  getRiskScoreClass(): string {
    const score = this.riskScore();
    if (score < 40) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  getInsightBorderClass(priority: string): string {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200';
    }
  }

  getInsightIconClass(priority: string): string {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }

  getInsightBadgeClass(impact: string): string {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getInsightIcon(type: string): string {
    switch (type) {
      case 'revenue':
        return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'risk':
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'growth':
        return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // TypeScript Math workaround
  Math = Math;
}
