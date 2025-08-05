import { Component, OnInit, signal, computed, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { Payment, PaymentResponse, Reconciliation } from '../../models/payment.model';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { DataTableComponent, TableConfig } from '../../components/data-table/data-table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, DataTableComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="sm:flex sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Payments</h1>
        <button 
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          (click)="openRecordPaymentModal()"
          *ngIf="user()?.role !== 'client'"
        >
          <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Record Payment
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Total Payments</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900">{{ totalPayments() }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Total Amount</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900">
            {{ formatCurrency(totalAmount()) }}
          </p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Completed</p>
          <p class="mt-1 text-2xl font-semibold text-green-600">
            {{ formatCurrency(completedAmount()) }}
          </p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Pending</p>
          <p class="mt-1 text-2xl font-semibold text-yellow-600">
            {{ pendingCount() }}
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <select
          class="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          [(ngModel)]="statusFilter"
          (ngModelChange)="onFilterChange()"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <!-- Data Table -->
      <app-data-table 
        [config]="tableConfig()"
        (onSortChange)="handleSort($event)"
        (onPageChange)="handlePageChange($event)"
        (onRowClick)="viewPaymentDetail($event)"
      >
      </app-data-table>

      <!-- Custom Templates for Table -->
      <ng-template #clientTemplate let-row="row">
        <div>
          <div class="text-sm font-medium text-gray-900">
            {{ row.client?.firstName }} {{ row.client?.lastName }}
          </div>
          <div *ngIf="row.client?.companyName" class="text-sm text-gray-500">
            {{ row.client?.companyName }}
          </div>
        </div>
      </ng-template>

      <ng-template #paymentMethodTemplate let-row="row">
        <div class="flex items-center">
          <span class="mr-2 text-gray-400">
            <ng-container [ngSwitch]="row.paymentMethod">
              <svg *ngSwitchCase="'credit_card'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <svg *ngSwitchCase="'ach'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <svg *ngSwitchCase="'check'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <svg *ngSwitchCase="'wire'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </ng-container>
          </span>
          <span class="capitalize">{{ formatPaymentMethod(row.paymentMethod) }}</span>
        </div>
      </ng-template>

      <ng-template #statusTemplate let-value="value">
        <span [ngClass]="getStatusClass(value)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
          {{ getStatusLabel(value) }}
        </span>
      </ng-template>

      <ng-template #reconciliationTemplate let-row="row">
        <div>
          <span 
            *ngIf="getReconciliationStatus(row.id) !== 'unmatched'"
            [ngClass]="getReconciliationClass(getReconciliationStatus(row.id))"
            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
          >
            {{ getReconciliationStatus(row.id) }}
          </span>
          <span *ngIf="getReconciliationStatus(row.id) === 'unmatched'" class="text-sm text-gray-400">
            Not reconciled
          </span>
        </div>
      </ng-template>

      <ng-template #actionsTemplate let-row="row">
        <div class="flex space-x-3">
          <button 
            (click)="viewPaymentDetail(row); $event.stopPropagation()"
            class="text-primary-600 hover:text-primary-900"
          >
            View
          </button>
          <button 
            *ngIf="getReconciliationStatus(row.id) === 'unmatched' && row.status === 'completed'"
            (click)="openReconcileModal(row); $event.stopPropagation()"
            class="text-green-600 hover:text-green-900"
          >
            Reconcile
          </button>
        </div>
      </ng-template>

      <!-- Reconcile Modal -->
      <app-modal
        *ngIf="showReconcileModal"
        title="Reconcile Payment"
        [isOpen]="showReconcileModal"
        (onClose)="closeReconcileModal()"
        size="md"
      >
        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            Reconcile payment {{ selectedPayment()?.paymentReference }} - {{ formatCurrency(selectedPayment()?.amount || 0) }}
          </p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Invoice ID</label>
            <input
              type="text"
              [(ngModel)]="reconcileInvoiceId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter invoice number..."
            />
          </div>
        </div>
        
        <div slot="footer" class="flex justify-end space-x-3">
          <button
            (click)="closeReconcileModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="handleReconcile()"
            [disabled]="!reconcileInvoiceId"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reconcile
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class PaymentsComponent implements OnInit, AfterViewInit {
  // Template references
  @ViewChild('clientTemplate', { read: TemplateRef }) clientTemplate!: TemplateRef<any>;
  @ViewChild('paymentMethodTemplate', { read: TemplateRef }) paymentMethodTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { read: TemplateRef }) statusTemplate!: TemplateRef<any>;
  @ViewChild('reconciliationTemplate', { read: TemplateRef }) reconciliationTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { read: TemplateRef }) actionsTemplate!: TemplateRef<any>;

  // Signals for reactive state
  payments = signal<Payment[]>([]);
  reconciliations = signal<Reconciliation[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  totalPayments = signal(0);
  totalPages = signal(1);
  selectedPayment = signal<Payment | null>(null);
  user = this.authService.user;
  
  // Modal state
  showReconcileModal = false;
  reconcileInvoiceId = '';
  
  // Filter state
  statusFilter = '';
  sortField = 'paymentDate';
  sortOrder: 'asc' | 'desc' = 'desc';
  pageSize = 10;

  // Computed values
  totalAmount = computed(() => {
    return this.payments().reduce((sum, payment) => sum + payment.amount, 0);
  });

  completedAmount = computed(() => {
    return this.payments()
      .filter(p => p.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0);
  });

  pendingCount = computed(() => {
    return this.payments().filter(p => p.status === 'pending').length;
  });
  
  // Table configuration
  tableConfig = computed<TableConfig>(() => ({
    columns: [
      { 
        key: 'paymentReference', 
        label: 'Reference', 
        sortable: true
      },
      { 
        key: 'client', 
        label: 'Client',
        customTemplate: this.clientTemplate
      },
      { 
        key: 'amount', 
        label: 'Amount',
        sortable: true,
        align: 'right',
        formatter: (value: number) => this.formatCurrency(value)
      },
      { 
        key: 'paymentMethod', 
        label: 'Method',
        customTemplate: this.paymentMethodTemplate
      },
      { 
        key: 'paymentDate', 
        label: 'Date',
        sortable: true,
        formatter: (value: string) => this.formatDate(value)
      },
      { 
        key: 'status', 
        label: 'Status',
        customTemplate: this.statusTemplate,
        align: 'center'
      },
      { 
        key: 'reconciliation', 
        label: 'Reconciliation',
        customTemplate: this.reconciliationTemplate,
        align: 'center'
      }
    ],
    data: this.payments(),
    totalItems: this.totalPayments(),
    currentPage: this.currentPage(),
    pageSize: this.pageSize,
    sortField: this.sortField,
    sortOrder: this.sortOrder,
    loading: this.loading(),
    emptyMessage: this.statusFilter ? `No payments found with status "${this.statusFilter}"` : 'No payments found',
    showPagination: true,
    showActions: true,
    actionsTemplate: this.actionsTemplate
  }));

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadPayments();
  }

  ngAfterViewInit() {
    // Force change detection to update table config with templates
    setTimeout(() => {
      this.payments.set([...this.payments()]);
    });
  }

  loadPayments() {
    this.loading.set(true);
    
    const filters: any = {
      page: this.currentPage(),
      limit: this.pageSize,
      sortBy: this.sortField,
      sortOrder: this.sortOrder
    };
    
    if (this.statusFilter) {
      filters.status = this.statusFilter;
    }
    
    this.paymentService.getPayments(filters).subscribe({
      next: (response: PaymentResponse) => {
        this.payments.set(response.data);
        this.totalPayments.set(response.meta.total);
        this.totalPages.set(response.meta.totalPages);
        this.loading.set(false);
        
        // Load reconciliations for the payments
        this.loadReconciliations();
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.toastr.error('Failed to load payments');
        this.loading.set(false);
      }
    });
  }

  loadReconciliations() {
    const paymentIds = this.payments().map(p => p.id);
    if (paymentIds.length === 0) return;
    
    // Load actual reconciliations from the API
    this.paymentService.getReconciliations().subscribe({
      next: (response) => {
        this.reconciliations.set(response.data);
      },
      error: (error: any) => {
        console.error('Error loading reconciliations:', error);
      }
    });
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadPayments();
  }

  handleSort(event: { field: string; order: 'asc' | 'desc' }) {
    this.sortField = event.field;
    this.sortOrder = event.order;
    this.loadPayments();
  }

  handlePageChange(page: number) {
    this.currentPage.set(page);
    this.loadPayments();
  }

  viewPaymentDetail(payment: Payment) {
    this.router.navigate(['/payments', payment.id]);
  }

  openReconcileModal(payment: Payment) {
    this.selectedPayment.set(payment);
    this.showReconcileModal = true;
  }

  closeReconcileModal() {
    this.showReconcileModal = false;
    this.selectedPayment.set(null);
    this.reconcileInvoiceId = '';
  }

  handleReconcile() {
    const payment = this.selectedPayment();
    if (!payment || !this.reconcileInvoiceId) return;
    
    this.paymentService.createReconciliation(payment.id, this.reconcileInvoiceId).subscribe({
      next: () => {
        this.toastr.success('Payment reconciled successfully');
        this.closeReconcileModal();
        this.loadPayments();
      },
      error: (error: any) => {
        console.error('Error reconciling payment:', error);
        this.toastr.error('Failed to reconcile payment');
      }
    });
  }

  openRecordPaymentModal() {
    // TODO: Implement record payment modal
    this.toastr.info('Record payment feature coming soon');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  }

  formatPaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      'credit_card': 'Credit Card',
      'ach': 'ACH Transfer',
      'check': 'Check',
      'wire': 'Wire Transfer'
    };
    return methods[method] || method;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getReconciliationStatus(paymentId: string): string {
    const reconciliation = this.reconciliations().find(r => r.paymentId === paymentId);
    return reconciliation?.status || 'unmatched';
  }

  getReconciliationClass(status: string): string {
    switch (status) {
      case 'matched':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      case 'unmatched':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
