import { Component, OnInit, signal, computed, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PolicyService } from '../../services/policy.service';
import { Policy, PolicyResponse } from '../../models/policy.model';
import { AuthService } from '../../services/auth.service';
import { DataTableComponent, TableConfig } from '../../components/data-table/data-table.component';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Policies</h1>
        <button
          class="btn-primary btn-md"
          (click)="openNewPolicyModal()"
          *ngIf="user()?.role !== 'client'"
        >
          <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Policy
        </button>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search policies..."
            class="input flex-1"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange()"
          />
          <select
            class="input w-full sm:w-48"
            [(ngModel)]="statusFilter"
            (ngModelChange)="onFilterChange()"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Data Table -->
      <div class="card">
        <app-data-table
          [config]="tableConfig()"
          [cellFormatter]="formatCell"
          [cellClassProvider]="getCellClass"
          (onSortChange)="handleSort($event)"
          (onPageChange)="handlePageChange($event)"
          (onRowClick)="viewPolicy($event.id)">
        </app-data-table>
      </div>

      <!-- Custom Templates -->
      <ng-template #statusTemplate let-row="row" let-value="value">
        <span [ngClass]="getStatusClass(value)">
          {{ value }}
        </span>
      </ng-template>

      <ng-template #clientTemplate let-row="row">
        {{ getClientName(row) }}
      </ng-template>

      <ng-template #premiumTemplate let-row="row">
        {{ formatCurrency(getPremiumAmount(row)) }}/{{ getFrequencyLabel(row.paymentFrequency) }}
      </ng-template>

      <ng-template #actionsTemplate let-row="row">
        <button
          class="text-primary-600 hover:text-primary-900 mr-3"
          (click)="viewPolicy(row.id); $event.stopPropagation()"
        >
          View
        </button>
        <button
          class="text-primary-600 hover:text-primary-900"
          (click)="editPolicy(row.id); $event.stopPropagation()"
          *ngIf="user()?.role !== 'client'"
        >
          Edit
        </button>
      </ng-template>
    </div>
  `,
  styles: []
})
export class PoliciesComponent implements OnInit, AfterViewInit {
  // Template references
  @ViewChild('statusTemplate', { read: TemplateRef }) statusTemplate!: TemplateRef<any>;
  @ViewChild('clientTemplate', { read: TemplateRef }) clientTemplate!: TemplateRef<any>;
  @ViewChild('premiumTemplate', { read: TemplateRef }) premiumTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { read: TemplateRef }) actionsTemplate!: TemplateRef<any>;

  // Signals for reactive state
  policies = signal<Policy[]>([]);
  loading = signal<boolean>(false);
  currentPage = signal<number>(1);
  totalPolicies = signal<number>(0);
  totalPages = signal<number>(1);
  
  // Filter state
  searchTerm = '';
  statusFilter = '';
  sortField = 'policyNumber';
  sortOrder: 'asc' | 'desc' = 'asc';
  pageSize = 20;

  // User info
  user = this.authService.user;

  // Table configuration as computed signal
  tableConfig = computed<TableConfig>(() => ({
    columns: [
      { 
        key: 'policyNumber', 
        label: 'Policy Number', 
        sortable: true 
      },
      { 
        key: 'client', 
        label: 'Client', 
        sortable: true,
        customTemplate: this.clientTemplate
      },
      { 
        key: 'policyType', 
        label: 'Type' 
      },
      { 
        key: 'annualPremium', 
        label: 'Premium', 
        sortable: true,
        customTemplate: this.premiumTemplate
      },
      { 
        key: 'status', 
        label: 'Status',
        customTemplate: this.statusTemplate
      }
    ],
    data: this.policies(),
    totalItems: this.totalPolicies(),
    currentPage: this.currentPage(),
    pageSize: this.pageSize,
    sortField: this.sortField,
    sortOrder: this.sortOrder,
    loading: this.loading(),
    emptyMessage: 'No policies found',
    showPagination: true,
    showActions: true
  }));

  constructor(
    private policyService: PolicyService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPolicies();
  }

  ngAfterViewInit() {
    // Force change detection to update table config with templates
    setTimeout(() => {
      this.policies.set([...this.policies()]);
    });
  }

  loadPolicies() {
    this.loading.set(true);
    
    this.policyService.getPolicies({
      search: this.searchTerm,
      status: this.statusFilter,
      page: this.currentPage(),
      limit: this.pageSize,
      sortBy: this.sortField,
      sortOrder: this.sortOrder
    }).subscribe({
      next: (response: PolicyResponse) => {
        this.policies.set(response.data || response.policies || []);
        this.totalPolicies.set(response.meta?.total || response.total || 0);
        this.totalPages.set(response.meta?.totalPages || response.totalPages || 1);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading policies:', error);
        this.loading.set(false);
      }
    });
  }

  // Custom cell formatter
  formatCell = (column: string, value: any): string => {
    if (column === 'annualPremium') {
      return this.formatCurrency(value);
    }
    return value;
  }

  // Custom cell class provider
  getCellClass = (column: string, row: any): string => {
    if (column === 'status') {
      return this.getStatusClass(row.status);
    }
    return '';
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.loadPolicies();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadPolicies();
  }

  handleSort(event: { field: string; order: 'asc' | 'desc' }) {
    this.sortField = event.field;
    this.sortOrder = event.order;
    this.loadPolicies();
  }

  handlePageChange(page: number) {
    this.currentPage.set(page);
    this.loadPolicies();
  }

  viewPolicy(id: string) {
    this.router.navigate(['/policies', id]);
  }

  editPolicy(id: string) {
    // TODO: Implement edit modal or navigate to edit page
    console.log('Edit policy:', id);
  }

  openNewPolicyModal() {
    // TODO: Implement new policy modal
    console.log('Open new policy modal');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getPremiumAmount(policy: Policy): number {
    const premium = policy.premiumAmount || policy.annualPremium || 0;
    switch (policy.paymentFrequency) {
      case 'monthly':
        return premium / 12;
      case 'quarterly':
        return premium / 4;
      case 'semi-annual':
        return premium / 2;
      case 'annual':
        return premium;
      default:
        return premium;
    }
  }

  getFrequencyLabel(frequency: string): string {
    switch (frequency) {
      case 'monthly': return 'mo';
      case 'quarterly': return 'qtr';
      case 'semi-annual': return '6mo';
      case 'annual': return 'yr';
      default: return frequency;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full';
      case 'pending':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-yellow-800 bg-yellow-100 rounded-full';
      case 'expired':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-red-800 bg-red-100 rounded-full';
      case 'cancelled':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-gray-800 bg-gray-100 rounded-full';
      default:
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-gray-800 bg-gray-100 rounded-full';
    }
  }

  getClientName(policy: Policy): string {
    if (policy.clientName) {
      return policy.clientName;
    }
    if (policy.client) {
      const { firstName, lastName, companyName } = policy.client;
      if (companyName) {
        return companyName;
      }
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return '';
  }
}
