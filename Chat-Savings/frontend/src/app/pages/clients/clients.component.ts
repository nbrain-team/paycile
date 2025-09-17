import { Component, OnInit, signal, computed, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { DataTableComponent, TableConfig } from '../../components/data-table/data-table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, DataTableComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="sm:flex sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Clients</h1>
        <div class="mt-4 sm:mt-0 flex gap-2">
          <!-- View Toggle -->
          <div class="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              (click)="viewMode.set('grid')"
              [ngClass]="{
                'bg-primary-600 text-white': viewMode() === 'grid',
                'bg-white text-gray-700': viewMode() !== 'grid'
              }"
              class="px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg hover:bg-gray-100"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              (click)="viewMode.set('table')"
              [ngClass]="{
                'bg-primary-600 text-white': viewMode() === 'table',
                'bg-white text-gray-700': viewMode() !== 'table'
              }"
              class="px-4 py-2 text-sm font-medium border-t border-b border-r border-gray-200 rounded-r-lg hover:bg-gray-100"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          
          <button 
            (click)="openAddClientModal()"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Client
          </button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <input
            type="text"
            placeholder="Search clients..."
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange()"
          />
        </div>
        <button
          (click)="exportClients()"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <svg class="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>

      <!-- Grid View -->
      <div *ngIf="viewMode() === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Loading State -->
        <div *ngIf="loading()" class="col-span-full flex justify-center py-12">
          <app-loading-spinner size="lg" message="Loading clients..."></app-loading-spinner>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && clients().length === 0" class="col-span-full text-center py-12">
          <p class="text-gray-500">
            {{ searchTerm ? 'No clients found matching "' + searchTerm + '"' : 'No clients found' }}
          </p>
        </div>

        <!-- Client Cards -->
        <div 
          *ngFor="let client of clients()" 
          class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
          (click)="viewClientDetails(client)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <div class="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-lg font-medium text-primary-600">
                    {{ getInitials(client) }}
                  </span>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ client.firstName }} {{ client.lastName }}
                  </h3>
                  <p *ngIf="client.companyName" class="text-sm font-medium text-gray-700">
                    {{ client.companyName }}
                  </p>
                </div>
              </div>
              
              <div class="mt-4 space-y-1">
                <p class="text-sm text-gray-600 flex items-center">
                  <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {{ client.email }}
                </p>
                <p class="text-sm text-gray-600 flex items-center">
                  <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {{ client.phone }}
                </p>
              </div>
            </div>
            
            <div class="flex-shrink-0 ml-4">
              <span [ngClass]="getStatusBadgeClass(client.isActive)">
                {{ client.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-medium text-gray-500">Policies</p>
              <p class="mt-1 text-lg font-semibold text-gray-900">{{ client.policyCount || 0 }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500">Total Premium</p>
              <p class="mt-1 text-lg font-semibold text-gray-900">
                {{ formatCurrency(client.totalPremium || 0) }}
              </p>
            </div>
          </div>
          
          <div class="mt-4 flex justify-between items-center">
            <p class="text-xs text-gray-500">
              Last activity: {{ getRelativeTime(client.lastActivity) }}
            </p>
            <div class="flex space-x-2" (click)="$event.stopPropagation()">
              <button 
                (click)="sendMessage(client)"
                class="text-primary-600 hover:text-primary-900"
                title="Send message"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button 
                (click)="viewPolicies(client)"
                class="text-primary-600 hover:text-primary-900"
                title="View policies"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div *ngIf="viewMode() === 'table'">
        <app-data-table 
          [config]="tableConfig()"
          (onSortChange)="handleSort($event)"
          (onPageChange)="handlePageChange($event)"
          (onRowClick)="viewClientDetails($event)"
        >
        </app-data-table>
      </div>

      <!-- Custom Templates for Table -->
      <ng-template #nameTemplate let-row="row">
        <div class="flex items-center">
          <div class="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
            <span class="text-sm font-medium text-primary-600">
              {{ getInitials(row) }}
            </span>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900">
              {{ row.firstName }} {{ row.lastName }}
            </div>
            <div *ngIf="row.companyName" class="text-sm text-gray-500">
              {{ row.companyName }}
            </div>
          </div>
        </div>
      </ng-template>

      <ng-template #contactTemplate let-row="row">
        <div>
          <div class="text-sm text-gray-900">{{ row.email }}</div>
          <div class="text-sm text-gray-500">{{ row.phone }}</div>
        </div>
      </ng-template>

      <ng-template #statusTemplate let-value="value">
        <span [ngClass]="getStatusBadgeClass(value)">
          {{ value ? 'Active' : 'Inactive' }}
        </span>
      </ng-template>

      <ng-template #actionsTemplate let-row="row">
        <div class="flex space-x-3">
          <button 
            (click)="viewClientDetails(row); $event.stopPropagation()"
            class="text-primary-600 hover:text-primary-900"
          >
            View
          </button>
          <button 
            (click)="editClient(row); $event.stopPropagation()"
            class="text-primary-600 hover:text-primary-900"
          >
            Edit
          </button>
          <button 
            (click)="sendMessage(row); $event.stopPropagation()"
            class="text-gray-600 hover:text-gray-900"
          >
            Message
          </button>
        </div>
      </ng-template>

      <!-- Pagination for Grid View -->
      <div *ngIf="viewMode() === 'grid' && totalPages() > 1" class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Showing {{ (currentPage() - 1) * pageSize + 1 }} to {{ Math.min(currentPage() * pageSize, totalClients()) }} of
          {{ totalClients() }} results
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

      <!-- Add Client Modal -->
      <app-modal 
        *ngIf="showAddModal"
        title="Add New Client"
        [isOpen]="showAddModal"
        (onClose)="closeAddModal()"
        size="lg"
      >
        <form class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                [(ngModel)]="newClient.firstName"
                name="firstName"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                [(ngModel)]="newClient.lastName"
                name="lastName"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              [(ngModel)]="newClient.companyName"
              name="companyName"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                [(ngModel)]="newClient.email"
                name="email"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Phone *</label>
              <input
                type="tel"
                [(ngModel)]="newClient.phone"
                name="phone"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              [(ngModel)]="newClient.dateOfBirth"
              name="dateOfBirth"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Address</h4>
            <div class="space-y-3">
              <input
                type="text"
                [(ngModel)]="newClient.address.street"
                name="street"
                placeholder="Street Address"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              <div class="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  [(ngModel)]="newClient.address.city"
                  name="city"
                  placeholder="City"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <input
                  type="text"
                  [(ngModel)]="newClient.address.state"
                  name="state"
                  placeholder="State"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <input
                  type="text"
                  [(ngModel)]="newClient.address.zipCode"
                  name="zipCode"
                  placeholder="ZIP"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </form>
        
        <div slot="footer" class="flex justify-end space-x-3">
          <button
            (click)="closeAddModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="saveClient()"
            [disabled]="!isFormValid()"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            Save Client
          </button>
        </div>
      </app-modal>

      <!-- Message Modal -->
      <app-modal 
        *ngIf="showMessageModal"
        title="Send Message"
        [isOpen]="showMessageModal"
        (onClose)="closeMessageModal()"
        size="lg"
      >
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-600">
              To: <span class="font-medium">{{ selectedClient()?.firstName }} {{ selectedClient()?.lastName }}</span>
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              [(ngModel)]="messageData.subject"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Enter message subject..."
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              [(ngModel)]="messageData.body"
              rows="6"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Enter your message..."
            ></textarea>
          </div>
        </div>
        
        <div slot="footer" class="flex justify-end space-x-3">
          <button
            (click)="closeMessageModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="sendMessageToClient()"
            [disabled]="!messageData.subject || !messageData.body"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            Send Message
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class ClientsComponent implements OnInit, AfterViewInit {
  // Template references
  @ViewChild('nameTemplate', { read: TemplateRef }) nameTemplate!: TemplateRef<any>;
  @ViewChild('contactTemplate', { read: TemplateRef }) contactTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { read: TemplateRef }) statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { read: TemplateRef }) actionsTemplate!: TemplateRef<any>;

  // Signals
  clients = signal<Client[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  totalClients = signal(0);
  totalPages = signal(1);
  viewMode = signal<'grid' | 'table'>('grid');
  selectedClient = signal<Client | null>(null);
  
  // Filter state
  searchTerm = '';
  sortField = 'lastName';
  sortOrder: 'asc' | 'desc' = 'asc';
  pageSize = 12;
  
  // Modal state
  showAddModal = false;
  showMessageModal = false;
  
  // Form data
  newClient = {
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  };
  
  messageData = {
    subject: '',
    body: ''
  };
  
  // Table configuration
  tableConfig = computed<TableConfig>(() => ({
    columns: [
      { 
        key: 'name', 
        label: 'Name', 
        sortable: true,
        customTemplate: this.nameTemplate
      },
      { 
        key: 'contact', 
        label: 'Contact',
        customTemplate: this.contactTemplate
      },
      { 
        key: 'policyCount', 
        label: 'Policies',
        sortable: true,
        align: 'center'
      },
      { 
        key: 'totalPremium', 
        label: 'Total Premium',
        sortable: true,
        align: 'right'
      },
      { 
        key: 'lastActivity', 
        label: 'Last Activity',
        sortable: true
      },
      { 
        key: 'isActive', 
        label: 'Status',
        customTemplate: this.statusTemplate,
        align: 'center'
      }
    ],
    data: this.clients(),
    totalItems: this.totalClients(),
    currentPage: this.currentPage(),
    pageSize: this.pageSize,
    sortField: this.sortField,
    sortOrder: this.sortOrder,
    loading: this.loading(),
    emptyMessage: this.searchTerm ? `No clients found matching "${this.searchTerm}"` : 'No clients found',
    showPagination: true,
    showActions: true
  }));
  
  // Expose Math for template
  Math = Math;
  
  constructor(
    private clientService: ClientService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadClients();
  }

  ngAfterViewInit() {
    // Force change detection to update table config with templates
    setTimeout(() => {
      this.clients.set([...this.clients()]);
    });
  }

  loadClients() {
    this.loading.set(true);
    
    this.clientService.getClients({
      search: this.searchTerm,
      page: this.currentPage(),
      limit: this.pageSize,
      sortBy: this.sortField,
      sortOrder: this.sortOrder
    }).subscribe({
      next: (response) => {
        this.clients.set(response.data || []);
        this.totalClients.set(response.meta?.total || 0);
        this.totalPages.set(response.meta?.totalPages || 1);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.toastr.error('Failed to load clients');
        this.loading.set(false);
      }
    });
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.loadClients();
  }

  handleSort(event: { field: string; order: 'asc' | 'desc' }) {
    this.sortField = event.field;
    this.sortOrder = event.order;
    this.loadClients();
  }

  handlePageChange(page: number) {
    this.currentPage.set(page);
    this.loadClients();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadClients();
  }

  viewClientDetails(client: Client) {
    this.router.navigate(['/clients', client.id]);
  }

  viewPolicies(client: Client) {
    this.router.navigate(['/policies'], { queryParams: { clientId: client.id } });
  }

  editClient(client: Client) {
    // TODO: Implement edit functionality
    console.log('Edit client:', client);
    this.toastr.info('Edit functionality coming soon');
  }

  openAddClientModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.resetForm();
  }

  resetForm() {
    this.newClient = {
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    };
  }

  isFormValid(): boolean {
    return !!(
      this.newClient.firstName &&
      this.newClient.lastName &&
      this.newClient.email &&
      this.newClient.phone
    );
  }

  saveClient() {
    if (!this.isFormValid()) return;
    
    this.clientService.createClient(this.newClient).subscribe({
      next: () => {
        this.toastr.success('Client added successfully');
        this.loadClients();
        this.closeAddModal();
      },
      error: (error) => {
        console.error('Error creating client:', error);
        this.toastr.error('Failed to add client');
      }
    });
  }

  sendMessage(client: Client) {
    this.selectedClient.set(client);
    this.showMessageModal = true;
  }

  closeMessageModal() {
    this.showMessageModal = false;
    this.messageData = { subject: '', body: '' };
    this.selectedClient.set(null);
  }

  sendMessageToClient() {
    const client = this.selectedClient();
    if (!client || !this.messageData.subject || !this.messageData.body) return;
    
    this.clientService.sendMessage(client.id, this.messageData).subscribe({
      next: () => {
        this.toastr.success('Message sent successfully');
        this.closeMessageModal();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.toastr.error('Failed to send message');
      }
    });
  }

  exportClients() {
    this.clientService.exportClients('csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Export completed successfully');
      },
      error: (error) => {
        console.error('Error exporting clients:', error);
        this.toastr.error('Failed to export clients');
      }
    });
  }

  getInitials(client: Client): string {
    return `${client.firstName[0]}${client.lastName[0]}`.toUpperCase();
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive
      ? 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full'
      : 'inline-flex px-2 py-1 text-xs font-semibold leading-5 text-gray-800 bg-gray-100 rounded-full';
  }

  getRelativeTime(date?: string): string {
    if (!date) return 'Never';
    
    const now = new Date();
    const activity = new Date(date);
    const diffMs = now.getTime() - activity.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
