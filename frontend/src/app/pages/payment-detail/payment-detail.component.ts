import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

interface WaterfallAllocation {
  type: 'premium' | 'tax' | 'fee';
  description: string;
  required: number;
  allocated: number;
  remaining: number;
}

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="sm:flex sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Payment Details</h1>
        <button
          (click)="navigateBack()"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Payments
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-12">
        <div class="inline-flex items-center">
          <svg class="animate-spin h-5 w-5 mr-3 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading payment details...
        </div>
      </div>

      <!-- No Payment Found -->
      <div *ngIf="!loading() && !payment()" class="text-center py-12">
        <p class="text-gray-500">Payment not found</p>
      </div>

      <!-- Payment Information -->
      <div *ngIf="payment()" class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Payment Information</h2>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Payment Reference</p>
              <p class="font-medium">{{ payment()?.paymentReference }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Status</p>
              <span [ngClass]="getStatusClass(payment()?.status || '')">
                {{ payment()?.status }}
              </span>
            </div>
            <div>
              <p class="text-sm text-gray-500">Client</p>
              <p class="font-medium">
                {{ payment()?.client?.firstName }} {{ payment()?.client?.lastName }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Payment Date</p>
              <p class="font-medium">{{ formatDate(payment()?.paymentDate || '') }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Payment Method</p>
              <p class="font-medium capitalize">{{ formatPaymentMethod(payment()?.paymentMethod || '') }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Amount</p>
              <div class="flex items-center space-x-2">
                <div *ngIf="!isEditing()">
                  <p class="font-medium">{{ formatCurrency(payment()?.amount || 0) }}</p>
                </div>
                <div *ngIf="isEditing()" class="flex items-center space-x-2">
                  <input
                    type="number"
                    [(ngModel)]="editAmount"
                    class="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    step="0.01"
                    min="0"
                  />
                  <button
                    (click)="saveAmount()"
                    [disabled]="savingAmount()"
                    class="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    (click)="cancelEdit()"
                    class="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
                <button
                  *ngIf="!isEditing() && user()?.role !== 'client'"
                  (click)="startEdit()"
                  class="text-primary-600 hover:text-primary-900"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Waterfall Allocation (if payment has reconciliation) -->
      <ng-container *ngIf="hasInvoice()">
        <!-- Underpayment Warning -->
        <div *ngIf="isUnderpayment()" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-yellow-800">Underpayment Detected</h3>
              <div class="mt-2 text-sm text-yellow-700">
                <p>This payment of {{ formatCurrency(getCurrentAmount()) }} is less than the invoice amount of {{ formatCurrency(getInvoiceAmount()) }}.</p>
                <p class="mt-1 font-medium">
                  Remaining balance: {{ formatCurrency(getInvoiceAmount() - getCurrentAmount()) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Waterfall Allocation Chart -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Payment Waterfall Allocation</h2>
            <p class="text-sm text-gray-500 mt-1">
              Shows how the payment is allocated based on priority
            </p>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div *ngFor="let allocation of waterfallAllocations(); let i = index" 
                   class="border rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center space-x-3">
                    <span class="text-lg font-semibold text-gray-500">#{{ i + 1 }}</span>
                    <span [ngClass]="getTypeClass(allocation.type)" 
                          class="px-3 py-1 rounded-full text-sm font-medium border">
                      {{ allocation.type }}
                    </span>
                    <span class="text-gray-700">{{ allocation.description }}</span>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <p class="text-sm text-gray-500">Required</p>
                    <p class="font-medium">{{ formatCurrency(allocation.required) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Allocated</p>
                    <p [ngClass]="allocation.allocated > 0 ? 'text-green-600' : 'text-gray-400'" 
                       class="font-medium">
                      {{ formatCurrency(allocation.allocated) }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Remaining</p>
                    <p [ngClass]="allocation.remaining > 0 ? 'text-red-600' : 'text-gray-400'" 
                       class="font-medium">
                      {{ formatCurrency(allocation.remaining) }}
                    </p>
                  </div>
                </div>
                <!-- Progress bar -->
                <div class="mt-3">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      [ngClass]="getProgressBarClass(allocation.type)"
                      class="h-2 rounded-full"
                      [style.width.%]="getProgressPercentage(allocation)"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary -->
            <div class="mt-6 pt-6 border-t">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Total Invoice Amount</p>
                  <p class="text-lg font-semibold">{{ formatCurrency(getInvoiceAmount()) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Payment Status</p>
                  <p class="text-lg font-semibold">
                    <span *ngIf="!isUnderpayment()" class="text-green-600">Fully Paid</span>
                    <span *ngIf="isUnderpayment()" class="text-yellow-600">Partially Paid</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Related Invoice -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Related Invoice</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Invoice Number</p>
                <p class="font-medium">{{ invoice()?.invoiceNumber }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Policy Number</p>
                <p class="font-medium">{{ invoice()?.policy?.policyNumber }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Policy Type</p>
                <p class="font-medium">{{ invoice()?.policy?.policyType }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Insurance Company</p>
                <p class="font-medium">{{ invoice()?.policy?.insuranceCompany?.name }}</p>
              </div>
            </div>

            <!-- Line Items -->
            <div class="mt-6" *ngIf="invoice()?.lineItems">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Invoice Line Items</h3>
              <div class="space-y-2">
                <div *ngFor="let item of invoice()?.lineItems" class="border rounded-lg p-3">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center space-x-2">
                      <span [ngClass]="getTypeClass(item.type)" 
                            class="px-2 py-1 rounded text-xs font-medium">
                        {{ item.type }}
                      </span>
                      <span class="text-sm text-gray-700">{{ item.description }}</span>
                    </div>
                    <div class="text-right">
                      <span class="text-sm font-medium block">{{ formatCurrency(item.amount) }}</span>
                      <span *ngIf="getItemPaidAmount(item) < item.amount" class="text-xs text-red-600">
                        Paid: {{ formatCurrency(getItemPaidAmount(item)) }}
                      </span>
                    </div>
                  </div>
                  <!-- Payment progress bar -->
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      [ngClass]="getItemProgressClass(item)"
                      class="h-2 rounded-full"
                      [style.width.%]="getItemProgressPercentage(item)"
                    ></div>
                  </div>
                  <div class="mt-1 text-xs text-gray-500">
                    {{ getItemProgressText(item) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: []
})
export class PaymentDetailComponent implements OnInit {
  // Signals
  payment = signal<any>(null);
  invoice = signal<any>(null);
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  savingAmount = signal<boolean>(false);
  waterfallAllocations = signal<WaterfallAllocation[]>([]);
  
  // Form state
  editAmount = 0;
  
  // User info
  user = this.authService.user;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    // Recalculate waterfall when payment or edit amount changes
    effect(() => {
      const p = this.payment();
      if (p?.reconciliation?.invoice) {
        const amount = this.isEditing() ? this.editAmount : p.amount;
        this.calculateWaterfall(amount);
      }
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPaymentDetails(id);
    }
  }

  loadPaymentDetails(id: string) {
    this.loading.set(true);
    
    this.paymentService.getPayment(id).subscribe({
      next: (response) => {
        this.payment.set(response.data);
        if (response.data?.reconciliation?.invoice) {
          this.invoice.set(response.data.reconciliation.invoice);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading payment details:', error);
        this.toastr.error('Failed to load payment details');
        this.loading.set(false);
      }
    });
  }

  calculateWaterfall(paymentAmount: number) {
    const invoice = this.invoice();
    if (!invoice) return;

    // Mock waterfall priority (in real app, this would come from insurance company config)
    const waterfallPriority = [
      { type: 'premium', description: 'Premium Payment', priority: 1 },
      { type: 'tax', description: 'Taxes', priority: 2 },
      { type: 'fee', description: 'Fees', priority: 3 }
    ];

    const lineItems = invoice.lineItems || [];
    let remainingPayment = paymentAmount;
    const allocations: WaterfallAllocation[] = [];

    waterfallPriority.forEach(waterfallItem => {
      // Get all line items of this type
      const itemsOfType = lineItems.filter((item: any) => item.type === waterfallItem.type);
      const requiredAmount = itemsOfType.reduce((sum: number, item: any) => sum + item.amount, 0);

      // Allocate payment
      const allocated = Math.min(remainingPayment, requiredAmount);
      remainingPayment -= allocated;

      allocations.push({
        type: waterfallItem.type as 'premium' | 'tax' | 'fee',
        description: waterfallItem.description,
        required: requiredAmount,
        allocated: allocated,
        remaining: requiredAmount - allocated,
      });
    });

    this.waterfallAllocations.set(allocations);
  }

  startEdit() {
    this.isEditing.set(true);
    this.editAmount = this.payment()?.amount || 0;
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.editAmount = this.payment()?.amount || 0;
  }

  saveAmount() {
    if (this.editAmount <= 0 || !this.payment()) return;

    this.savingAmount.set(true);
    
    this.paymentService.updatePayment(this.payment().id, { amount: this.editAmount }).subscribe({
      next: () => {
        const updatedPayment = { ...this.payment(), amount: this.editAmount };
        this.payment.set(updatedPayment);
        this.isEditing.set(false);
        this.savingAmount.set(false);
        this.toastr.success('Payment amount updated');
      },
      error: (error) => {
        console.error('Error updating payment:', error);
        this.toastr.error('Failed to update payment amount');
        this.savingAmount.set(false);
      }
    });
  }

  getItemPaidAmount(item: any): number {
    const allocation = this.waterfallAllocations().find(a => a.type === item.type);
    if (!allocation) return 0;

    const itemsOfSameType = this.invoice()?.lineItems?.filter((li: any) => li.type === item.type) || [];
    const totalOfType = itemsOfSameType.reduce((sum: number, li: any) => sum + li.amount, 0);
    const itemProportion = totalOfType > 0 ? item.amount / totalOfType : 0;
    
    return allocation.allocated * itemProportion;
  }

  getItemProgressPercentage(item: any): number {
    return item.amount > 0 ? (this.getItemPaidAmount(item) / item.amount) * 100 : 0;
  }

  getItemProgressClass(item: any): string {
    const percentage = this.getItemProgressPercentage(item);
    if (percentage === 100) return 'bg-green-600';
    if (percentage > 0) return 'bg-yellow-600';
    return 'bg-gray-300';
  }

  getItemProgressText(item: any): string {
    const percentage = this.getItemProgressPercentage(item);
    if (percentage === 100) return 'Fully paid';
    if (percentage > 0) return `${percentage.toFixed(0)}% paid`;
    return 'Unpaid';
  }

  hasInvoice(): boolean {
    return !!this.invoice();
  }

  isUnderpayment(): boolean {
    return this.getCurrentAmount() < this.getInvoiceAmount();
  }

  getCurrentAmount(): number {
    return this.isEditing() ? this.editAmount : (this.payment()?.amount || 0);
  }

  getInvoiceAmount(): number {
    return this.invoice()?.amount || 0;
  }

  getProgressPercentage(allocation: WaterfallAllocation): number {
    return allocation.required > 0 ? (allocation.allocated / allocation.required) * 100 : 0;
  }

  navigateBack() {
    this.router.navigate(['/payments']);
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

  formatPaymentMethod(method: string): string {
    return method.replace('_', ' ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full';
      case 'pending':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-yellow-800 bg-yellow-100 rounded-full';
      case 'failed':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-red-800 bg-red-100 rounded-full';
      default:
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-gray-800 bg-gray-100 rounded-full';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'premium':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'tax':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'fee':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getProgressBarClass(type: string): string {
    switch (type) {
      case 'premium':
        return 'bg-gray-600';
      case 'tax':
        return 'bg-blue-600';
      case 'fee':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  }
}
