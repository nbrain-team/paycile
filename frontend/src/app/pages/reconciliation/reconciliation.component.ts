import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReconciliationService } from '../../services/reconciliation.service';
import { InvoiceService } from '../../services/invoice.service';
import { PaymentService } from '../../services/payment.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastrService } from 'ngx-toastr';
import { Reconciliation } from '../../models/reconciliation.model';

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">AI-Powered Reconciliation</h1>
          <p class="mt-1 text-sm text-gray-600">
            Intelligent matching of payments to invoices using AI
          </p>
        </div>
        <button 
          (click)="runAIReconciliation()"
          [disabled]="aiProcessing()"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
        >
          <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span *ngIf="!aiProcessing()">Run AI Reconciliation</span>
          <span *ngIf="aiProcessing()">Processing...</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Total Records</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900">{{ totalRecords() }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Matched</p>
          <p class="mt-1 text-2xl font-semibold text-green-600">{{ matchedCount() }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ matchRate() }}% match rate</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Unmatched</p>
          <p class="mt-1 text-2xl font-semibold text-yellow-600">{{ unmatchedCount() }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Disputed</p>
          <p class="mt-1 text-2xl font-semibold text-red-600">{{ disputedCount() }}</p>
        </div>
      </div>

      <!-- AI Insights Card -->
      <div class="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6" *ngIf="aiInsights()">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-primary-900">AI Insights</h3>
            <div class="mt-2 text-sm text-primary-700">
              <p>{{ aiInsights() }}</p>
              <div class="mt-2 flex items-center text-xs">
                <span class="text-primary-600">Average confidence: </span>
                <span class="ml-2 font-semibold">{{ averageConfidence() }}%</span>
                <div class="ml-4 w-32 bg-primary-200 rounded-full h-2">
                  <div class="bg-primary-600 h-2 rounded-full" [style.width.%]="averageConfidence()"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <select
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          [(ngModel)]="statusFilter"
          (ngModelChange)="onFilterChange()"
        >
          <option value="">All Status</option>
          <option value="matched">Matched</option>
          <option value="unmatched">Unmatched</option>
          <option value="disputed">Disputed</option>
        </select>
        <button
          (click)="exportReconciliations()"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <svg class="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- Loading State -->
            <tr *ngIf="loading()">
              <td colspan="6" class="px-6 py-4 text-center">
                <app-loading-spinner size="md" message="Loading reconciliations..."></app-loading-spinner>
              </td>
            </tr>

            <!-- Empty State -->
            <tr *ngIf="!loading() && reconciliations().length === 0">
              <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                No reconciliation records found
              </td>
            </tr>

            <!-- Data Rows -->
            <tr *ngFor="let rec of reconciliations()" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ rec.payment?.paymentReference || 'Unknown' }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ formatCurrency(rec.payment?.amount || 0) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div *ngIf="rec.invoice">
                  <div class="text-sm font-medium text-gray-900">
                    {{ rec.invoice.invoiceNumber }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ formatCurrency(rec.invoice.amount) }}
                  </div>
                </div>
                <div *ngIf="!rec.invoice && rec.suggestedInvoice" class="bg-yellow-50 p-2 rounded">
                  <div class="text-sm font-medium text-yellow-800">
                    Suggested: {{ rec.suggestedInvoice.invoiceNumber }}
                  </div>
                  <div class="text-xs text-yellow-600">
                    {{ formatCurrency(rec.suggestedInvoice.amount) }}
                  </div>
                </div>
                <div *ngIf="!rec.invoice && !rec.suggestedInvoice" class="text-sm text-gray-500">
                  No match found
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ formatCurrency(rec.matchedAmount) }}
                </div>
                <div *ngIf="hasDiscrepancy(rec)" class="text-xs text-red-600">
                  Discrepancy: {{ formatCurrency(getDiscrepancy(rec)) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [ngClass]="getStatusClass(rec.status)">
                  {{ rec.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div *ngIf="rec.confidence" class="flex items-center">
                  <span class="text-sm font-medium mr-2" [ngClass]="getConfidenceColor(rec.confidence)">
                    {{ rec.confidence }}%
                  </span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div [ngClass]="getConfidenceBarColor(rec.confidence)" 
                         class="h-2 rounded-full" 
                         [style.width.%]="rec.confidence"></div>
                  </div>
                </div>
                <span *ngIf="!rec.confidence" class="text-sm text-gray-500">Manual</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <!-- Accept Suggestion -->
                  <button 
                    *ngIf="rec.status === 'unmatched' && rec.suggestedInvoice"
                    (click)="acceptSuggestion(rec)"
                    class="text-green-600 hover:text-green-900"
                    title="Accept AI suggestion"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  
                  <!-- Manual Match -->
                  <button 
                    *ngIf="rec.status === 'unmatched'"
                    (click)="openManualMatchModal(rec)"
                    class="text-primary-600 hover:text-primary-900"
                    title="Manual match"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                  
                  <!-- Dispute -->
                  <button 
                    *ngIf="rec.status === 'matched'"
                    (click)="openDisputeModal(rec)"
                    class="text-yellow-600 hover:text-yellow-900"
                    title="Dispute match"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  
                  <!-- Resolve Dispute -->
                  <button 
                    *ngIf="rec.status === 'disputed'"
                    (click)="openResolveModal(rec)"
                    class="text-blue-600 hover:text-blue-900"
                    title="Resolve dispute"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  
                  <!-- View Details -->
                  <button 
                    (click)="viewDetails(rec)"
                    class="text-gray-600 hover:text-gray-900"
                    title="View details"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between" *ngIf="totalRecords() > 0">
        <div class="text-sm text-gray-700">
          Showing {{ (currentPage() - 1) * pageSize + 1 }} to {{ Math.min(currentPage() * pageSize, totalRecords()) }} of
          {{ totalRecords() }} results
        </div>
        <div class="flex gap-2">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="currentPage() === 1"
            (click)="goToPage(currentPage() - 1)"
          >
            Previous
          </button>
          <span class="px-4 py-2 text-sm text-gray-700">
            Page {{ currentPage() }} of {{ totalPages() }}
          </span>
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="currentPage() === totalPages()"
            (click)="goToPage(currentPage() + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Manual Match Modal -->
      <app-modal 
        *ngIf="showManualMatchModal"
        title="Manual Match"
        [isOpen]="showManualMatchModal"
        (onClose)="closeManualMatchModal()"
        size="lg"
      >
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-900">Payment Information</h4>
            <div class="mt-2 bg-gray-50 p-3 rounded">
              <p class="text-sm"><span class="font-medium">Reference:</span> {{ selectedReconciliation()?.payment?.paymentReference }}</p>
              <p class="text-sm"><span class="font-medium">Amount:</span> {{ formatCurrency(selectedReconciliation()?.payment?.amount || 0) }}</p>
              <p class="text-sm"><span class="font-medium">Date:</span> {{ formatDate(selectedReconciliation()?.payment?.paymentDate || '') }}</p>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Select Invoice to Match</label>
            <select 
              [(ngModel)]="selectedInvoiceId"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">-- Select an invoice --</option>
              <option *ngFor="let invoice of availableInvoices()" [value]="invoice.id">
                {{ invoice.invoiceNumber }} - {{ formatCurrency(invoice.amount) }} - {{ invoice.client?.companyName || invoice.client?.firstName + ' ' + invoice.client?.lastName }}
              </option>
            </select>
          </div>
        </div>
        
        <div slot="footer" class="flex justify-end space-x-3">
          <button
            (click)="closeManualMatchModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="confirmManualMatch()"
            [disabled]="!selectedInvoiceId"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            Match
          </button>
        </div>
      </app-modal>

      <!-- Dispute Modal -->
      <app-modal 
        *ngIf="showDisputeModal"
        title="Dispute Match"
        [isOpen]="showDisputeModal"
        (onClose)="closeDisputeModal()"
      >
        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            Please provide a reason for disputing this match:
          </p>
          <textarea
            [(ngModel)]="disputeNotes"
            rows="4"
            class="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter dispute reason..."
          ></textarea>
        </div>
        
        <div slot="footer" class="flex justify-end space-x-3">
          <button
            (click)="closeDisputeModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="confirmDispute()"
            [disabled]="!disputeNotes.trim()"
            class="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 disabled:opacity-50"
          >
            Submit Dispute
          </button>
        </div>
      </app-modal>

      <!-- Resolve Dispute Modal -->
      <app-modal 
        *ngIf="showResolveModal"
        title="Resolve Dispute"
        [isOpen]="showResolveModal"
        (onClose)="closeResolveModal()"
      >
        <div class="space-y-4">
          <div class="bg-yellow-50 p-3 rounded">
            <p class="text-sm font-medium text-yellow-800">Current Dispute Notes:</p>
            <p class="text-sm text-yellow-700 mt-1">{{ selectedReconciliation()?.notes }}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Resolution Notes</label>
            <textarea
              [(ngModel)]="resolutionNotes"
              rows="4"
              class="mt-1 block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter resolution details..."
            ></textarea>
          </div>
        </div>
        
        <div slot="footer" class="flex justify-end space-x-3">
          <button
            (click)="closeResolveModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="confirmResolve()"
            [disabled]="!resolutionNotes.trim()"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Resolve
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class ReconciliationComponent implements OnInit {
  // Signals
  reconciliations = signal<Reconciliation[]>([]);
  loading = signal(false);
  aiProcessing = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  selectedReconciliation = signal<Reconciliation | null>(null);
  availableInvoices = signal<any[]>([]);
  
  // Computed signals for stats
  totalRecords = computed(() => this.reconciliations().length);
  matchedCount = computed(() => this.reconciliations().filter(r => r.status === 'matched').length);
  unmatchedCount = computed(() => this.reconciliations().filter(r => r.status === 'unmatched').length);
  disputedCount = computed(() => this.reconciliations().filter(r => r.status === 'disputed').length);
  matchRate = computed(() => {
    const total = this.totalRecords();
    if (total === 0) return 0;
    return Math.round((this.matchedCount() / total) * 100);
  });
  averageConfidence = computed(() => {
    const withConfidence = this.reconciliations().filter(r => r.confidence);
    if (withConfidence.length === 0) return 0;
    const sum = withConfidence.reduce((acc, r) => acc + (r.confidence || 0), 0);
    return Math.round(sum / withConfidence.length);
  });
  aiInsights = computed(() => {
    const rate = this.matchRate();
    if (rate >= 80) return 'Excellent match rate! AI is performing optimally.';
    if (rate >= 60) return 'Good match rate. Consider reviewing unmatched records for patterns.';
    if (rate >= 40) return 'Moderate match rate. AI may need additional training data.';
    return 'Low match rate. Manual review recommended for improved accuracy.';
  });
  
  // Filter state
  statusFilter = '';
  pageSize = 20;
  
  // Modal state
  showManualMatchModal = false;
  showDisputeModal = false;
  showResolveModal = false;
  selectedInvoiceId = '';
  disputeNotes = '';
  resolutionNotes = '';
  
  // Expose Math for template
  Math = Math;
  
  constructor(
    private reconciliationService: ReconciliationService,
    private invoiceService: InvoiceService,
    private paymentService: PaymentService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadReconciliations();
    this.loadAvailableInvoices();
  }

  loadReconciliations() {
    this.loading.set(true);
    
    this.reconciliationService.getReconciliations({
      status: this.statusFilter,
      page: this.currentPage(),
      limit: this.pageSize
    }).subscribe({
      next: (response) => {
        this.reconciliations.set(response.data || []);
        this.totalPages.set(response.meta?.totalPages || 1);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading reconciliations:', error);
        this.toastr.error('Failed to load reconciliations');
        this.loading.set(false);
      }
    });
  }

  loadAvailableInvoices() {
    this.invoiceService.getInvoices({ 
      status: 'pending',
      limit: 100 
    }).subscribe({
      next: (response) => {
        this.availableInvoices.set(response.data || []);
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
      }
    });
  }

  runAIReconciliation() {
    this.aiProcessing.set(true);
    
    this.reconciliationService.runAIReconciliation().subscribe({
      next: () => {
        this.toastr.success('AI reconciliation completed successfully');
        this.loadReconciliations();
        this.aiProcessing.set(false);
      },
      error: (error) => {
        console.error('Error running AI reconciliation:', error);
        this.toastr.error('Failed to run AI reconciliation');
        this.aiProcessing.set(false);
      }
    });
  }

  acceptSuggestion(rec: Reconciliation) {
    if (!rec.suggestedInvoiceId) return;
    
    this.reconciliationService.acceptSuggestion(rec.id, rec.suggestedInvoiceId).subscribe({
      next: () => {
        this.toastr.success('Suggestion accepted successfully');
        this.loadReconciliations();
      },
      error: (error) => {
        console.error('Error accepting suggestion:', error);
        this.toastr.error('Failed to accept suggestion');
      }
    });
  }

  openManualMatchModal(rec: Reconciliation) {
    this.selectedReconciliation.set(rec);
    this.showManualMatchModal = true;
  }

  closeManualMatchModal() {
    this.showManualMatchModal = false;
    this.selectedInvoiceId = '';
    this.selectedReconciliation.set(null);
  }

  confirmManualMatch() {
    const rec = this.selectedReconciliation();
    if (!rec || !this.selectedInvoiceId) return;
    
    this.reconciliationService.manualMatch(rec.paymentId, this.selectedInvoiceId).subscribe({
      next: () => {
        this.toastr.success('Manual match created successfully');
        this.loadReconciliations();
        this.closeManualMatchModal();
      },
      error: (error) => {
        console.error('Error creating manual match:', error);
        this.toastr.error('Failed to create manual match');
      }
    });
  }

  openDisputeModal(rec: Reconciliation) {
    this.selectedReconciliation.set(rec);
    this.showDisputeModal = true;
  }

  closeDisputeModal() {
    this.showDisputeModal = false;
    this.disputeNotes = '';
    this.selectedReconciliation.set(null);
  }

  confirmDispute() {
    const rec = this.selectedReconciliation();
    if (!rec || !this.disputeNotes.trim()) return;
    
    this.reconciliationService.disputeReconciliation(rec.id, this.disputeNotes).subscribe({
      next: () => {
        this.toastr.success('Dispute submitted successfully');
        this.loadReconciliations();
        this.closeDisputeModal();
      },
      error: (error) => {
        console.error('Error submitting dispute:', error);
        this.toastr.error('Failed to submit dispute');
      }
    });
  }

  openResolveModal(rec: Reconciliation) {
    this.selectedReconciliation.set(rec);
    this.showResolveModal = true;
  }

  closeResolveModal() {
    this.showResolveModal = false;
    this.resolutionNotes = '';
    this.selectedReconciliation.set(null);
  }

  confirmResolve() {
    const rec = this.selectedReconciliation();
    if (!rec || !this.resolutionNotes.trim()) return;
    
    this.reconciliationService.resolveDispute(rec.id, this.resolutionNotes).subscribe({
      next: () => {
        this.toastr.success('Dispute resolved successfully');
        this.loadReconciliations();
        this.closeResolveModal();
      },
      error: (error) => {
        console.error('Error resolving dispute:', error);
        this.toastr.error('Failed to resolve dispute');
      }
    });
  }

  viewDetails(rec: Reconciliation) {
    // TODO: Implement detailed view modal or navigate to detail page
    console.log('View details:', rec);
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadReconciliations();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadReconciliations();
  }

  exportReconciliations() {
    this.reconciliationService.exportReconciliations('csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reconciliations-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Export completed successfully');
      },
      error: (error) => {
        console.error('Error exporting reconciliations:', error);
        this.toastr.error('Failed to export reconciliations');
      }
    });
  }

  hasDiscrepancy(rec: Reconciliation): boolean {
    if (!rec.payment || !rec.invoice) return false;
    return Math.abs(rec.payment.amount - rec.invoice.amount) > 0.01;
  }

  getDiscrepancy(rec: Reconciliation): number {
    if (!rec.payment || !rec.invoice) return 0;
    return rec.payment.amount - rec.invoice.amount;
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'matched':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full';
      case 'unmatched':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-yellow-800 bg-yellow-100 rounded-full';
      case 'disputed':
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-red-800 bg-red-100 rounded-full';
      default:
        return 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-gray-800 bg-gray-100 rounded-full';
    }
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    if (confidence >= 40) return 'text-orange-600';
    return 'text-red-600';
  }

  getConfidenceBarColor(confidence: number): string {
    if (confidence >= 80) return 'bg-green-600';
    if (confidence >= 60) return 'bg-yellow-600';
    if (confidence >= 40) return 'bg-orange-600';
    return 'bg-red-600';
  }
}
