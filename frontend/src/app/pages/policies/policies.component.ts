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
        <div class="flex gap-2">
          <button
            *ngIf="user()?.role !== 'client'"
            (click)="openAddModal()"
            class="btn-primary btn-md"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Policy
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="label">Search</label>
            <input
              type="text"
              [(ngModel)]="filters.search"
              (ngModelChange)="onFilterChange()"
              placeholder="Search policies..."
              class="input"
            >
          </div>
          <div>
            <label class="label">Status</label>
            <select [(ngModel)]="filters.status" (ngModelChange)="onFilterChange()" class="input">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label class="label">Insurance Company</label>
            <select [(ngModel)]="filters.insuranceCompanyId" (ngModelChange)="onFilterChange()" class="input">
              <option value="">All Companies</option>
              <option *ngFor="let company of insuranceCompanies" [value]="company.id">
                {{ company.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">Policy Type</label>
            <select [(ngModel)]="filters.policyType" (ngModelChange)="onFilterChange()" class="input">
              <option value="">All Types</option>
              <option value="auto">Auto</option>
              <option value="home">Home</option>
              <option value="life">Life</option>
              <option value="health">Health</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Policies Table -->
      <div class="card">
        <app-data-table
          [data]="policies()"
          [columns]="columns"
          [loading]="loading()"
          [totalItems]="totalItems()"
          [itemsPerPage]="filters.limit"
          [currentPage]="currentPage()"
          [sortField]="filters.sortBy"
          [sortDirection]="filters.sortOrder"
          (onSort)="handleSort($event)"
          (onPageChange)="handlePageChange($event)"
        >
          <ng-template #cellTemplate let-item="item" let-column="column">
            <span [ngClass]="getCellClass(item, column)" [innerHTML]="formatCell(item, column)"></span>
          </ng-template>
        </app-data-table>
      </div>
    </div>

    <!-- Add/Edit Policy Modal -->
    <app-modal
      [isOpen]="showAddModal()"
      [title]="editingPolicy() ? 'Edit Policy' : 'Add New Policy'"
      [size]="'lg'"
      (onClose)="closeModals()"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Policy Number</label>
            <input
              type="text"
              [(ngModel)]="formData.policyNumber"
              placeholder="POL-XXXXXX"
              class="input"
              [disabled]="!!editingPolicy()"
            >
          </div>
          <div>
            <label class="label">Status</label>
            <select [(ngModel)]="formData.status" class="input">
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Client</label>
            <select [(ngModel)]="formData.clientId" class="input" required>
              <option value="">Select Client</option>
              <option *ngFor="let client of clients" [value]="client.id">
                {{ client.firstName }} {{ client.lastName }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">Insurance Company</label>
            <select [(ngModel)]="formData.insuranceCompanyId" class="input" required>
              <option value="">Select Company</option>
              <option *ngFor="let company of insuranceCompanies" [value]="company.id">
                {{ company.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Policy Type</label>
            <select [(ngModel)]="formData.policyType" class="input" required>
              <option value="">Select Type</option>
              <option value="auto">Auto</option>
              <option value="home">Home</option>
              <option value="life">Life</option>
              <option value="health">Health</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label class="label">Premium Amount</label>
            <input
              type="number"
              [(ngModel)]="formData.premiumAmount"
              placeholder="0.00"
              step="0.01"
              class="input"
              required
            >
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Effective Date</label>
            <input
              type="date"
              [(ngModel)]="formData.effectiveDate"
              class="input"
              required
            >
          </div>
          <div>
            <label class="label">Expiry Date</label>
            <input
              type="date"
              [(ngModel)]="formData.expiryDate"
              class="input"
              required
            >
          </div>
        </div>

        <div>
          <label class="label">Coverage Details</label>
          <textarea
            [(ngModel)]="formData.coverageDetails"
            rows="3"
            placeholder="Enter coverage details..."
            class="input"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <button
            type="button"
            (click)="closeModals()"
            class="btn-outline btn-md"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="savePolicy()"
            [disabled]="loading()"
            class="btn-primary btn-md"
          >
            {{ editingPolicy() ? 'Update' : 'Create' }} Policy
          </button>
        </div>
      </div>
    </app-modal>
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
