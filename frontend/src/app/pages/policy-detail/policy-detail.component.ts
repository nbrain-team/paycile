import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PolicyService } from '../../services/policy.service';
import { InvoiceService } from '../../services/invoice.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    <div class="space-y-6">
      <!-- Loading State -->
      <app-loading-spinner 
        *ngIf="loading()" 
        [fullScreen]="false" 
        size="lg" 
        message="Loading policy details..."
        class="py-12">
      </app-loading-spinner>

      <!-- Not Found State -->
      <div *ngIf="!loading() && !policy()" class="text-center py-12">
        <p class="text-gray-500">Policy not found</p>
        <button 
          (click)="navigateBack()"
          class="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          Back to Policies
        </button>
      </div>

      <!-- Policy Details -->
      <div *ngIf="!loading() && policy()">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <button 
              (click)="navigateBack()"
              class="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-flex items-center"
            >
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Policies
            </button>
            <h1 class="text-2xl font-bold text-gray-900">Policy Details</h1>
            <p class="text-sm text-gray-600">{{ policy()?.policyNumber }}</p>
          </div>
          <span [ngClass]="getStatusClass(policy()?.status || '')">
            {{ policy()?.status }}
          </span>
        </div>

        <!-- Policy Information Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Policy Information Card -->
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Policy Information</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm font-medium text-gray-500">Policy Type</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ policy()?.policyType }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Insurance Company</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ policy()?.insuranceCompany?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Premium Amount</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ formatCurrency(policy()?.premiumAmount || 0) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Payment Frequency</dt>
                <dd class="mt-1 text-sm text-gray-900 capitalize">{{ formatPaymentFrequency(policy()?.paymentFrequency || '') }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Effective Date</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ formatDate(policy()?.effectiveDate || '') }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Expiration Date</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ formatDate(policy()?.expirationDate || '') }}
                </dd>
              </div>
              <div *ngIf="daysUntilExpiration() !== null">
                <dt class="text-sm font-medium text-gray-500">Days Until Expiration</dt>
                <dd class="mt-1 text-sm" [ngClass]="getExpirationClass()">
                  <span *ngIf="daysUntilExpiration()! > 0">{{ daysUntilExpiration() }} days</span>
                  <span *ngIf="daysUntilExpiration()! === 0">Expires today</span>
                  <span *ngIf="daysUntilExpiration()! < 0">Expired {{ Math.abs(daysUntilExpiration()!) }} days ago</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Annual Premium</dt>
                <dd class="mt-1 text-sm text-gray-900 font-semibold">
                  {{ formatCurrency(calculateAnnualPremium()) }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- Client Information Card -->
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm font-medium text-gray-500">Name</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ policy()?.client?.firstName }} {{ policy()?.client?.lastName }}
                </dd>
              </div>
              <div *ngIf="policy()?.client?.companyName">
                <dt class="text-sm font-medium text-gray-500">Company</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ policy()?.client?.companyName }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  <a [href]="'mailto:' + policy()?.client?.email" class="text-primary-600 hover:text-primary-500">
                    {{ policy()?.client?.email }}
                  </a>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Phone</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  <a [href]="'tel:' + policy()?.client?.phone" class="text-primary-600 hover:text-primary-500">
                    {{ policy()?.client?.phone }}
                  </a>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Agent</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ policy()?.agent?.firstName }} {{ policy()?.agent?.lastName }}
                </dd>
              </div>
              <div *ngIf="policy()?.agent?.email">
                <dt class="text-sm font-medium text-gray-500">Agent Email</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  <a [href]="'mailto:' + policy()?.agent?.email" class="text-primary-600 hover:text-primary-500">
                    {{ policy()?.agent?.email }}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Coverage Details (if available) -->
        <div *ngIf="policy()?.coverageDetails" class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Coverage Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let detail of getCoverageDetails()">
              <dt class="text-sm font-medium text-gray-500">{{ detail.label }}</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ detail.value }}</dd>
            </div>
          </div>
        </div>

        <!-- Related Invoices -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Related Invoices</h3>
            <button 
              (click)="generateInvoice()"
              *ngIf="canGenerateInvoice()"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Generate Invoice
            </button>
          </div>
          
          <!-- Invoices Loading -->
          <div *ngIf="invoicesLoading()" class="text-center py-4">
            <app-loading-spinner size="md" message="Loading invoices..."></app-loading-spinner>
          </div>

          <!-- Invoices Table -->
          <div *ngIf="!invoicesLoading() && invoices().length > 0" class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let invoice of invoices()" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ invoice.invoiceNumber }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatCurrency(invoice.amount) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(invoice.dueDate) }}
                    <span *ngIf="isOverdue(invoice)" class="ml-2 text-xs text-red-600">
                      ({{ getDaysOverdue(invoice) }} days overdue)
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [ngClass]="getInvoiceStatusClass(invoice.status)">
                      {{ formatInvoiceStatus(invoice.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      class="text-primary-600 hover:text-primary-900 mr-3"
                      (click)="viewInvoice(invoice.id)"
                    >
                      View
                    </button>
                    <button 
                      *ngIf="invoice.status === 'pending' || invoice.status === 'partially_paid'"
                      class="text-green-600 hover:text-green-900"
                      (click)="payInvoice(invoice)"
                    >
                      Pay
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- No Invoices -->
          <p *ngIf="!invoicesLoading() && invoices().length === 0" class="text-gray-500 text-center py-4">
            No invoices found for this policy
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center pt-6">
          <button
            (click)="editPolicy()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Edit Policy
          </button>
          <div class="space-x-3">
            <button
              *ngIf="policy()?.status === 'active'"
              (click)="renewPolicy()"
              class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Renew Policy
            </button>
            <button
              *ngIf="policy()?.status === 'active'"
              (click)="cancelPolicy()"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Cancel Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PolicyDetailComponent implements OnInit {
  // Signals
  policy = signal<any>(null);
  invoices = signal<any[]>([]);
  loading = signal(false);
  invoicesLoading = signal(false);
  
  // Expose Math to template
  Math = Math;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private policyService: PolicyService,
    private invoiceService: InvoiceService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPolicyDetails(id);
      this.loadRelatedInvoices(id);
    }
  }

  loadPolicyDetails(id: string) {
    this.loading.set(true);
    
    this.policyService.getPolicy(id).subscribe({
      next: (response) => {
        this.policy.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading policy:', error);
        this.toastr.error('Failed to load policy details');
        this.loading.set(false);
      }
    });
  }

  loadRelatedInvoices(policyId: string) {
    this.invoicesLoading.set(true);
    
    this.invoiceService.getInvoices({ policyId, limit: 50 }).subscribe({
      next: (response) => {
        this.invoices.set(response.data || []);
        this.invoicesLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
        this.invoices.set([]);
        this.invoicesLoading.set(false);
      }
    });
  }

  daysUntilExpiration(): number | null {
    const policy = this.policy();
    if (!policy?.expirationDate) return null;
    
    const today = new Date();
    const expiration = new Date(policy.expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  getExpirationClass(): string {
    const days = this.daysUntilExpiration();
    if (days === null) return '';
    
    if (days < 0) return 'text-red-600 font-semibold';
    if (days === 0) return 'text-red-600 font-semibold';
    if (days <= 30) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  }

  calculateAnnualPremium(): number {
    const policy = this.policy();
    if (!policy) return 0;
    
    const multipliers: Record<string, number> = {
      'monthly': 12,
      'quarterly': 4,
      'semi-annually': 2,
      'annually': 1
    };
    
    return policy.premiumAmount * (multipliers[policy.paymentFrequency] || 1);
  }

  getCoverageDetails(): Array<{ label: string; value: string }> {
    const policy = this.policy();
    if (!policy?.coverageDetails) return [];
    
    // Parse coverage details if it's a JSON string or object
    const details = typeof policy.coverageDetails === 'string' 
      ? JSON.parse(policy.coverageDetails) 
      : policy.coverageDetails;
    
    return Object.entries(details).map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: String(value)
    }));
  }

  canGenerateInvoice(): boolean {
    const policy = this.policy();
    return policy?.status === 'active';
  }

  generateInvoice() {
    this.toastr.info('Invoice generation coming soon!');
    // TODO: Implement invoice generation
  }

  isOverdue(invoice: any): boolean {
    return invoice.status === 'pending' && new Date(invoice.dueDate) < new Date();
  }

  getDaysOverdue(invoice: any): number {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  viewInvoice(id: string) {
    this.router.navigate(['/invoices', id]);
  }

  payInvoice(invoice: any) {
    this.router.navigate(['/payments'], { queryParams: { invoiceId: invoice.id } });
  }

  editPolicy() {
    this.toastr.info('Policy editing coming soon!');
    // TODO: Implement policy editing
  }

  renewPolicy() {
    this.toastr.info('Policy renewal coming soon!');
    // TODO: Implement policy renewal
  }

  cancelPolicy() {
    if (confirm('Are you sure you want to cancel this policy?')) {
      this.toastr.info('Policy cancellation coming soon!');
      // TODO: Implement policy cancellation
    }
  }

  navigateBack() {
    this.router.navigate(['/policies']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  formatPaymentFrequency(frequency: string): string {
    return frequency.replace('-', ' ');
  }

  formatInvoiceStatus(status: string): string {
    return status.replace('_', ' ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'inline-flex px-3 py-1 text-sm font-semibold leading-5 text-green-800 bg-green-100 rounded-full';
      case 'expired':
        return 'inline-flex px-3 py-1 text-sm font-semibold leading-5 text-red-800 bg-red-100 rounded-full';
      case 'pending':
        return 'inline-flex px-3 py-1 text-sm font-semibold leading-5 text-yellow-800 bg-yellow-100 rounded-full';
      default:
        return 'inline-flex px-3 py-1 text-sm font-semibold leading-5 text-gray-800 bg-gray-100 rounded-full';
    }
  }

  getInvoiceStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full';
      case 'overdue':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-red-800 bg-red-100 rounded-full';
      case 'partially_paid':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-yellow-800 bg-yellow-100 rounded-full';
      default:
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-gray-800 bg-gray-100 rounded-full';
    }
  }
}
