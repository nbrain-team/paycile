import { Component, OnInit, signal, computed, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice, InvoiceResponse, PaymentRequest } from '../../models/invoice.model';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { DataTableComponent, TableConfig } from '../../components/data-table/data-table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, DataTableComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="sm:flex sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Invoices</h1>
        <button 
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          (click)="openGenerateModal()"
          *ngIf="user()?.role !== 'client'"
        >
          <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Generate Invoice
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Total Invoices</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900">{{ totalInvoices() }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Paid</p>
          <p class="mt-1 text-2xl font-semibold text-green-600">{{ paidCount() }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Overdue</p>
          <p class="mt-1 text-2xl font-semibold text-red-600">{{ overdueCount() }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Pending</p>
          <p class="mt-1 text-2xl font-semibold text-yellow-600">{{ pendingCount() }}</p>
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
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <!-- Data Table -->
      <app-data-table 
        [config]="tableConfig()"
        (onSortChange)="handleSort($event)"
        (onPageChange)="handlePageChange($event)"
        (onRowClick)="openDetailModal($event)"
      >
      </app-data-table>

      <!-- Custom Templates for Table -->
      <ng-template #clientTemplate let-row="row">
        <div>
          <div class="text-sm font-medium text-gray-900">
            {{ row.client?.firstName }} {{ row.client?.lastName }}
          </div>
          <div class="text-sm text-gray-500">
            {{ row.client?.email }}
          </div>
        </div>
      </ng-template>

      <ng-template #policyTemplate let-row="row">
        <div>
          <div class="text-sm text-gray-900">{{ row.policy?.policyNumber }}</div>
          <div class="text-sm text-gray-500">{{ row.policy?.policyType }}</div>
        </div>
      </ng-template>

      <ng-template #amountTemplate let-row="row">
        <div class="text-right">
          <div class="text-sm font-medium text-gray-900">
            {{ formatCurrency(row.amount) }}
          </div>
        </div>
      </ng-template>

      <ng-template #dueDateTemplate let-row="row">
        <div>
          <div class="text-sm text-gray-900">{{ formatDate(row.dueDate) }}</div>
          <div *ngIf="isOverdue(row)" class="text-sm text-red-600">
            {{ getDaysOverdue(row) }} days overdue
          </div>
        </div>
      </ng-template>

      <ng-template #statusTemplate let-value="value">
        <span [ngClass]="getStatusClass(value)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
          {{ getStatusLabel(value) }}
        </span>
      </ng-template>

      <ng-template #actionsTemplate let-row="row">
        <div class="flex space-x-3">
          <button 
            (click)="openDetailModal(row); $event.stopPropagation()"
            class="text-primary-600 hover:text-primary-900"
          >
            View
          </button>
          <button 
            *ngIf="row.status !== 'paid'"
            (click)="openPaymentModal(row); $event.stopPropagation()"
            class="text-green-600 hover:text-green-900"
          >
            Pay
          </button>
        </div>
      </ng-template>

      <!-- Payment Modal -->
      <app-modal 
        *ngIf="showPaymentModal"
        title="Record Payment"
        [isOpen]="showPaymentModal"
        (onClose)="closePaymentModal()"
        size="lg"
      >
        <div class="space-y-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="text-sm font-medium text-gray-900">Invoice Details</h4>
            <div class="mt-2 space-y-1">
              <p class="text-sm text-gray-600">
                Invoice #: <span class="font-medium">{{ selectedInvoice()?.invoiceNumber }}</span>
              </p>
              <p class="text-sm text-gray-600">
                Client: <span class="font-medium">{{ selectedInvoice()?.client?.firstName }} {{ selectedInvoice()?.client?.lastName }}</span>
              </p>
              <p class="text-sm text-gray-600">
                Total Amount: <span class="font-medium">{{ formatCurrency(selectedInvoice()?.amount || 0) }}</span>
              </p>
              <p class="text-sm text-gray-600">
                Amount Due: <span class="font-medium">{{ formatCurrency(selectedInvoice()?.amount || 0) }}</span>
              </p>
            </div>
          </div>
          
          <form class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Payment Amount *</label>
              <input
                type="number"
                [(ngModel)]="paymentRequest.amount"
                name="amount"
                step="0.01"
                min="0.01"
                [max]="selectedInvoice()?.amount || 0"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Payment Method *</label>
              <select
                [(ngModel)]="paymentRequest.paymentMethod"
                name="paymentMethod"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select method</option>
                <option value="credit_card">Credit Card</option>
                <option value="ach">ACH Transfer</option>
                <option value="check">Check</option>
                <option value="wire">Wire Transfer</option>
              </select>
            </div>
          </form>
        </div>
        
        <div slot="footer" class="flex justify-end space-x-3">
          <button
            (click)="closePaymentModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="processPayment()"
            [disabled]="!isPaymentValid()"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            Process Payment
          </button>
        </div>
      </app-modal>

      <!-- Detail Modal -->
      <app-modal 
        *ngIf="showDetailModal"
        title="Invoice Details"
        [isOpen]="showDetailModal"
        (onClose)="closeDetailModal()"
        size="xl"
      >
        <div class="space-y-6" *ngIf="selectedInvoice()">
          <!-- Invoice Header -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ selectedInvoice()?.invoiceNumber }}</h3>
                <p class="text-sm text-gray-600">Issued: {{ formatDate(selectedInvoice()?.createdAt) }}</p>
                <p class="text-sm text-gray-600">Due: {{ formatDate(selectedInvoice()?.dueDate) }}</p>
              </div>
              <div class="text-right">
                <span [ngClass]="getStatusClass(selectedInvoice()?.status || '')" class="px-3 py-1 text-sm font-semibold rounded-full">
                  {{ getStatusLabel(selectedInvoice()?.status || '') }}
                </span>
                <p class="mt-2 text-2xl font-bold text-gray-900">{{ formatCurrency(selectedInvoice()?.amount || 0) }}</p>
              </div>
            </div>
          </div>

          <!-- Client & Policy Info -->
          <div class="grid grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-700">Client Information</h4>
              <div class="mt-2 space-y-1">
                <p class="text-sm">{{ selectedInvoice()?.client?.firstName }} {{ selectedInvoice()?.client?.lastName }}</p>
                <p class="text-sm text-gray-600">{{ selectedInvoice()?.client?.companyName || 'N/A' }}</p>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-700">Policy Information</h4>
              <div class="mt-2 space-y-1">
                <p class="text-sm">{{ selectedInvoice()?.policy?.policyNumber }}</p>
                <p class="text-sm text-gray-600">Policy Type</p>
                <p class="text-sm text-gray-600">Premium: {{ formatCurrency(selectedInvoice()?.amount || 0) }}</p>
              </div>
            </div>
          </div>

          <!-- Line Items -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Line Items</h4>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let item of selectedInvoice()?.lineItems">
                  <td class="px-4 py-2 text-sm text-gray-900">{{ item.description }}</td>
                  <td class="px-4 py-2 text-sm text-gray-900 text-right">{{ formatCurrency(item.amount) }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td class="px-4 py-2 text-sm font-medium text-gray-900">Total</td>
                  <td class="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                    {{ formatCurrency(selectedInvoice()?.amount || 0) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div slot="footer" class="flex justify-between">
          <div></div>
          <div class="flex space-x-3">
            <button
              (click)="closeDetailModal()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              *ngIf="selectedInvoice()?.status !== 'paid'"
              (click)="closeDetailModal(); openPaymentModal(selectedInvoice()!)"
              class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
            >
              Record Payment
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class InvoicesComponent implements OnInit, AfterViewInit {
  // Template references
  @ViewChild('clientTemplate', { read: TemplateRef }) clientTemplate!: TemplateRef<any>;
  @ViewChild('policyTemplate', { read: TemplateRef }) policyTemplate!: TemplateRef<any>;
  @ViewChild('amountTemplate', { read: TemplateRef }) amountTemplate!: TemplateRef<any>;
  @ViewChild('dueDateTemplate', { read: TemplateRef }) dueDateTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { read: TemplateRef }) statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { read: TemplateRef }) actionsTemplate!: TemplateRef<any>;

  // Signals
  invoices = signal<Invoice[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  totalInvoices = signal(0);
  totalPages = signal(1);
  selectedInvoice = signal<Invoice | null>(null);
  user = this.authService.user;
  
  // Stats signals
  paidCount = signal(0);
  overdueCount = signal(0);
  pendingCount = signal(0);
  
  // Filter state
  statusFilter = '';
  sortField = 'invoiceNumber';
  sortOrder: 'asc' | 'desc' = 'desc';
  pageSize = 10;
  
  // Modal state
  showPaymentModal = false;
  showDetailModal = false;
  
  // Payment request
  paymentRequest: PaymentRequest = {
    invoiceId: '',
    clientId: '',
    amount: 0,
    paymentMethod: 'credit_card',
    paymentDate: new Date().toISOString()
  };
  
  // Table configuration
  tableConfig = computed<TableConfig>(() => ({
    columns: [
      { 
        key: 'invoiceNumber', 
        label: 'Invoice Number', 
        sortable: true
      },
      { 
        key: 'client', 
        label: 'Client',
        customTemplate: this.clientTemplate
      },
      { 
        key: 'policy', 
        label: 'Policy',
        customTemplate: this.policyTemplate
      },
      { 
        key: 'amount', 
        label: 'Amount',
        customTemplate: this.amountTemplate,
        sortable: true,
        align: 'right'
      },
      { 
        key: 'dueDate', 
        label: 'Due Date',
        customTemplate: this.dueDateTemplate,
        sortable: true
      },
      { 
        key: 'status', 
        label: 'Status',
        customTemplate: this.statusTemplate,
        align: 'center'
      }
    ],
    data: this.invoices(),
    totalItems: this.totalInvoices(),
    currentPage: this.currentPage(),
    pageSize: this.pageSize,
    sortField: this.sortField,
    sortOrder: this.sortOrder,
    loading: this.loading(),
    emptyMessage: this.statusFilter ? `No invoices found with status "${this.statusFilter}"` : 'No invoices found',
    showPagination: true,
    showActions: true,
    actionsTemplate: this.actionsTemplate
  }));
  
  constructor(
    private invoiceService: InvoiceService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}
  
  ngOnInit() {
    this.loadInvoices();
  }

  ngAfterViewInit() {
    // Force change detection to update table config with templates
    setTimeout(() => {
      this.invoices.set([...this.invoices()]);
    });
  }
  
  loadInvoices() {
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
    
    this.invoiceService.getInvoices(filters).subscribe({
      next: (response: InvoiceResponse) => {
        this.invoices.set(response.data);
        this.totalInvoices.set(response.meta.total);
        this.totalPages.set(response.meta.totalPages);
        this.calculateStats(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
        this.toastr.error('Failed to load invoices');
        this.loading.set(false);
      }
    });
  }
  
  calculateStats(invoices: Invoice[]) {
    this.paidCount.set(invoices.filter(i => i.status === 'paid').length);
    this.overdueCount.set(invoices.filter(i => this.isOverdue(i)).length);
    this.pendingCount.set(invoices.filter(i => i.status === 'sent' || i.status === 'partially_paid').length);
  }
  
  onFilterChange() {
    this.currentPage.set(1);
    this.loadInvoices();
  }

  handleSort(event: { field: string; order: 'asc' | 'desc' }) {
    this.sortField = event.field;
    this.sortOrder = event.order;
    this.loadInvoices();
  }

  handlePageChange(page: number) {
    this.currentPage.set(page);
    this.loadInvoices();
  }
  
  openPaymentModal(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.paymentRequest = {
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      amount: invoice.amount,
      paymentMethod: 'credit_card',
      paymentDate: new Date().toISOString()
    };
    this.showPaymentModal = true;
  }
  
  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedInvoice.set(null);
    this.paymentRequest = {
      invoiceId: '',
      clientId: '',
      amount: 0,
      paymentMethod: 'credit_card',
      paymentDate: new Date().toISOString()
    };
  }
  
  openDetailModal(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.showDetailModal = true;
  }
  
  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedInvoice.set(null);
  }
  
  openGenerateModal() {
    // TODO: Implement generate invoice modal
    this.toastr.info('Generate invoice feature coming soon');
  }
  
  isPaymentValid(): boolean {
    return this.paymentRequest.amount > 0 && 
           this.paymentRequest.amount <= (this.selectedInvoice()?.amount || 0) &&
           this.paymentRequest.paymentMethod !== null;
  }
  
  processPayment() {
    if (!this.isPaymentValid() || !this.selectedInvoice()) return;
    
    this.invoiceService.processPayment(this.paymentRequest).subscribe({
      next: () => {
        this.toastr.success('Payment recorded successfully');
        this.closePaymentModal();
        this.loadInvoices();
      },
      error: (error: any) => {
        console.error('Error recording payment:', error);
        this.toastr.error('Failed to record payment');
      }
    });
  }
  
  navigateToPayment() {
    // TODO: Navigate to payment detail
    this.router.navigate(['/payments']);
    this.closeDetailModal();
  }
  
  isOverdue(invoice: Invoice): boolean {
    if (invoice.status === 'paid') return false;
    return new Date(invoice.dueDate) < new Date();
  }
  
  getDaysOverdue(invoice: Invoice): number {
    if (!this.isOverdue(invoice)) return 0;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - dueDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  getStatusLabel(status: string): string {
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
  
  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  }
}
