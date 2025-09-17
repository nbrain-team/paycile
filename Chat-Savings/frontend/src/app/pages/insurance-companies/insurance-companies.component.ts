import { Component, OnInit, signal, computed, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InsuranceCompanyService } from '../../services/insurance-company.service';
import { InsuranceCompany, InsuranceCompanyResponse, CreateInsuranceCompanyRequest, PaymentWaterfallItem } from '../../models/insurance-company.model';
import { AuthService } from '../../services/auth.service';
import { DataTableComponent, TableConfig } from '../../components/data-table/data-table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-insurance-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="sm:flex sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Insurance Companies</h1>
        <div class="mt-4 sm:mt-0 flex space-x-3">
          <button 
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            (click)="exportData()"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
          <button 
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            (click)="openAddModal()"
            *ngIf="user()?.role === 'broker' || user()?.role === 'admin'"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Company
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Total Companies</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900">{{ stats().totalCompanies }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Active Companies</p>
          <p class="mt-1 text-2xl font-semibold text-green-600">{{ stats().activeCompanies }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Avg Commission Rate</p>
          <p class="mt-1 text-2xl font-semibold text-blue-600">{{ stats().averageCommissionRate.toFixed(1) }}%</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <p class="text-sm font-medium text-gray-600">Policy Types</p>
          <p class="mt-1 text-2xl font-semibold text-purple-600">{{ stats().totalPolicyTypes }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search companies..."
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          [(ngModel)]="searchTerm"
          (ngModelChange)="onSearchChange()"
        />
        <select
          class="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          [(ngModel)]="statusFilter"
          (ngModelChange)="onFilterChange()"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
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
      <ng-template #nameTemplate let-row="row">
        <div>
          <div class="text-sm font-medium text-gray-900">{{ row.name }}</div>
          <div class="text-sm text-gray-500">Code: {{ row.code }}</div>
        </div>
      </ng-template>

      <ng-template #contactTemplate let-row="row">
        <div>
          <div class="text-sm text-gray-900">{{ row.contactEmail }}</div>
          <div class="text-sm text-gray-500">{{ row.contactPhone }}</div>
        </div>
      </ng-template>

      <ng-template #commissionTemplate let-value="value">
        <span class="text-sm font-medium text-gray-900">{{ value }}%</span>
      </ng-template>

      <ng-template #policyTypesTemplate let-row="row">
        <div class="flex flex-wrap gap-1">
          <span *ngFor="let type of row.policyTypes.slice(0, 3)" 
                class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            {{ type }}
          </span>
          <span *ngIf="row.policyTypes.length > 3" 
                class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
            +{{ row.policyTypes.length - 3 }}
          </span>
        </div>
      </ng-template>

      <ng-template #statusTemplate let-row="row">
        <button 
          (click)="toggleStatus(row); $event.stopPropagation()"
          [ngClass]="row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
          class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80"
        >
          {{ row.isActive ? 'Active' : 'Inactive' }}
        </button>
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
            (click)="openEditModal(row); $event.stopPropagation()"
            class="text-blue-600 hover:text-blue-900"
            *ngIf="user()?.role === 'broker' || user()?.role === 'admin'"
          >
            Edit
          </button>
        </div>
      </ng-template>

      <!-- Add/Edit Modal -->
      <app-modal
        *ngIf="showFormModal"
        [title]="editingCompany ? 'Edit Insurance Company' : 'Add Insurance Company'"
        [isOpen]="showFormModal"
        (onClose)="closeFormModal()"
        size="xl"
      >
        <form class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Company Name *</label>
              <input
                type="text"
                [(ngModel)]="formData.name"
                name="name"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Company Code *</label>
              <input
                type="text"
                [(ngModel)]="formData.code"
                name="code"
                required
                [disabled]="!!editingCompany"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Contact Email *</label>
              <input
                type="email"
                [(ngModel)]="formData.contactEmail"
                name="contactEmail"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Contact Phone *</label>
              <input
                type="tel"
                [(ngModel)]="formData.contactPhone"
                name="contactPhone"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Address *</label>
            <textarea
              [(ngModel)]="formData.address"
              name="address"
              rows="2"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            ></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Claims Email</label>
              <input
                type="email"
                [(ngModel)]="formData.claimsEmail"
                name="claimsEmail"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Claims Phone</label>
              <input
                type="tel"
                [(ngModel)]="formData.claimsPhone"
                name="claimsPhone"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Commission Rate (%) *</label>
            <input
              type="number"
              [(ngModel)]="formData.commissionRate"
              name="commissionRate"
              step="0.1"
              min="0"
              max="100"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Policy Types</label>
            <div class="mt-2 grid grid-cols-3 gap-2">
              <label *ngFor="let type of availablePolicyTypes" class="flex items-center">
                <input
                  type="checkbox"
                  [checked]="formData.policyTypes.includes(type)"
                  (change)="togglePolicyType(type)"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span class="ml-2 text-sm text-gray-700">{{ type }}</span>
              </label>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Waterfall</label>
            <div class="space-y-2">
              <div *ngFor="let item of formData.paymentWaterfall; let i = index" 
                   class="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <span class="text-sm font-medium text-gray-600 w-8">{{ i + 1 }}.</span>
                <select
                  [(ngModel)]="item.type"
                  [name]="'waterfall-type-' + i"
                  class="flex-1 rounded-md border-gray-300 text-sm"
                >
                  <option value="premium">Premium</option>
                  <option value="tax">Tax</option>
                  <option value="fee">Fee</option>
                </select>
                <input
                  type="text"
                  [(ngModel)]="item.description"
                  [name]="'waterfall-desc-' + i"
                  placeholder="Description"
                  class="flex-2 rounded-md border-gray-300 text-sm"
                />
                <button
                  type="button"
                  (click)="removeWaterfallItem(i)"
                  class="text-red-600 hover:text-red-800"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                (click)="addWaterfallItem()"
                class="text-sm text-primary-600 hover:text-primary-800"
              >
                + Add Item
              </button>
            </div>
          </div>
        </form>
        
        <div slot="footer" class="flex justify-end space-x-3">
          <button
            (click)="closeFormModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="saveCompany()"
            [disabled]="!isFormValid()"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {{ editingCompany ? 'Update' : 'Create' }}
          </button>
        </div>
      </app-modal>

      <!-- Detail Modal -->
      <app-modal
        *ngIf="showDetailModal"
        title="Insurance Company Details"
        [isOpen]="showDetailModal"
        (onClose)="closeDetailModal()"
        size="xl"
      >
        <div class="space-y-6" *ngIf="selectedCompany()">
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ selectedCompany()?.name }}</h3>
                <p class="text-sm text-gray-600">Code: {{ selectedCompany()?.code }}</p>
              </div>
              <div class="text-right">
                <span [ngClass]="selectedCompany()?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                      class="px-3 py-1 text-sm font-semibold rounded-full">
                  {{ selectedCompany()?.isActive ? 'Active' : 'Inactive' }}
                </span>
                <p class="mt-2 text-lg font-semibold text-gray-900">{{ selectedCompany()?.commissionRate }}% Commission</p>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-700">Contact Information</h4>
              <div class="mt-2 space-y-1">
                <p class="text-sm">Email: {{ selectedCompany()?.contactEmail }}</p>
                <p class="text-sm">Phone: {{ selectedCompany()?.contactPhone }}</p>
                <p class="text-sm">Address: {{ selectedCompany()?.address }}</p>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-700">Claims Contact</h4>
              <div class="mt-2 space-y-1">
                <p class="text-sm">Email: {{ selectedCompany()?.claimsEmail || 'N/A' }}</p>
                <p class="text-sm">Phone: {{ selectedCompany()?.claimsPhone || 'N/A' }}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Policy Types</h4>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let type of selectedCompany()?.policyTypes" 
                    class="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                {{ type }}
              </span>
            </div>
          </div>
          
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Payment Waterfall</h4>
            <div class="space-y-2">
              <div *ngFor="let item of selectedCompany()?.paymentWaterfall; let i = index" 
                   class="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <span class="text-sm font-semibold text-gray-600">{{ i + 1 }}.</span>
                <span class="px-2 py-1 text-xs font-medium rounded"
                      [ngClass]="{
                        'bg-green-100 text-green-800': item.type === 'premium',
                        'bg-yellow-100 text-yellow-800': item.type === 'tax',
                        'bg-blue-100 text-blue-800': item.type === 'fee'
                      }">
                  {{ item.type }}
                </span>
                <span class="text-sm text-gray-700">{{ item.description }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div slot="footer" class="flex justify-end space-x-3">
          <button
            (click)="closeDetailModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            (click)="closeDetailModal(); openEditModal(selectedCompany()!)"
            *ngIf="user()?.role === 'broker' || user()?.role === 'admin'"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
          >
            Edit
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class InsuranceCompaniesComponent implements OnInit, AfterViewInit {
  // Template references
  @ViewChild('nameTemplate', { read: TemplateRef }) nameTemplate!: TemplateRef<any>;
  @ViewChild('contactTemplate', { read: TemplateRef }) contactTemplate!: TemplateRef<any>;
  @ViewChild('commissionTemplate', { read: TemplateRef }) commissionTemplate!: TemplateRef<any>;
  @ViewChild('policyTypesTemplate', { read: TemplateRef }) policyTypesTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { read: TemplateRef }) statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { read: TemplateRef }) actionsTemplate!: TemplateRef<any>;

  // Signals
  companies = signal<InsuranceCompany[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  totalCompanies = signal(0);
  totalPages = signal(1);
  selectedCompany = signal<InsuranceCompany | null>(null);
  user = this.authService.user;
  
  // Filter state
  searchTerm = '';
  statusFilter = '';
  sortField = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  pageSize = 10;
  
  // Modal state
  showFormModal = false;
  showDetailModal = false;
  editingCompany: InsuranceCompany | null = null;
  
  // Form data
  formData: CreateInsuranceCompanyRequest = {
    name: '',
    code: '',
    brokerId: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    commissionRate: 0,
    claimsEmail: '',
    claimsPhone: '',
    policyTypes: [],
    paymentWaterfall: [
      { id: this.generateId(), type: 'premium', priority: 1, description: 'Base Premium' },
      { id: this.generateId(), type: 'tax', priority: 2, description: 'State & Municipal Taxes' },
      { id: this.generateId(), type: 'fee', priority: 3, description: 'Policy & Service Fees' }
    ]
  };
  
  availablePolicyTypes = ['Auto', 'Home', 'Life', 'Health', 'Commercial', 'Liability', 'Workers Comp', 'Umbrella'];
  
  // Stats computed
  stats = computed(() => {
    return this.insuranceCompanyService.getStats(this.companies());
  });
  
  // Table configuration
  tableConfig = computed<TableConfig>(() => ({
    columns: [
      { 
        key: 'name', 
        label: 'Company',
        customTemplate: this.nameTemplate,
        sortable: true
      },
      { 
        key: 'contact', 
        label: 'Contact',
        customTemplate: this.contactTemplate
      },
      { 
        key: 'commissionRate', 
        label: 'Commission',
        customTemplate: this.commissionTemplate,
        sortable: true,
        align: 'center'
      },
      { 
        key: 'policyTypes', 
        label: 'Policy Types',
        customTemplate: this.policyTypesTemplate
      },
      { 
        key: 'isActive', 
        label: 'Status',
        customTemplate: this.statusTemplate,
        align: 'center'
      }
    ],
    data: this.companies(),
    totalItems: this.totalCompanies(),
    currentPage: this.currentPage(),
    pageSize: this.pageSize,
    sortField: this.sortField,
    sortOrder: this.sortOrder,
    loading: this.loading(),
    emptyMessage: 'No insurance companies found',
    showPagination: true,
    showActions: true,
    actionsTemplate: this.actionsTemplate
  }));
  
  constructor(
    private insuranceCompanyService: InsuranceCompanyService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}
  
  ngOnInit() {
    this.loadCompanies();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.companies.set([...this.companies()]);
    });
  }
  
  loadCompanies() {
    this.loading.set(true);
    
    const filters: any = {
      page: this.currentPage(),
      limit: this.pageSize,
      sortBy: this.sortField,
      sortOrder: this.sortOrder
    };
    
    if (this.searchTerm) {
      filters.search = this.searchTerm;
    }
    
    if (this.statusFilter) {
      filters.isActive = this.statusFilter === 'true';
    }
    
    // Filter by broker if user is broker
    const user = this.user();
    if (user?.role === 'broker' && user.brokerId) {
      filters.brokerId = user.brokerId;
    }
    
    this.insuranceCompanyService.getInsuranceCompanies(filters).subscribe({
      next: (response: InsuranceCompanyResponse) => {
        this.companies.set(response.data);
        this.totalCompanies.set(response.meta.total);
        this.totalPages.set(response.meta.totalPages);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.toastr.error('Failed to load insurance companies');
        this.loading.set(false);
      }
    });
  }
  
  onSearchChange() {
    this.currentPage.set(1);
    this.loadCompanies();
  }
  
  onFilterChange() {
    this.currentPage.set(1);
    this.loadCompanies();
  }
  
  handleSort(event: { field: string; order: 'asc' | 'desc' }) {
    this.sortField = event.field;
    this.sortOrder = event.order;
    this.loadCompanies();
  }
  
  handlePageChange(page: number) {
    this.currentPage.set(page);
    this.loadCompanies();
  }
  
  toggleStatus(company: InsuranceCompany) {
    this.insuranceCompanyService.toggleStatus(company.id, !company.isActive).subscribe({
      next: () => {
        this.toastr.success(`Company ${!company.isActive ? 'activated' : 'deactivated'} successfully`);
        this.loadCompanies();
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        this.toastr.error('Failed to update company status');
      }
    });
  }
  
  openAddModal() {
    this.editingCompany = null;
    this.resetForm();
    
    // Set brokerId if user is broker
    const user = this.user();
    if (user?.brokerId) {
      this.formData.brokerId = user.brokerId;
    }
    
    this.showFormModal = true;
  }
  
  openEditModal(company: InsuranceCompany) {
    this.editingCompany = company;
    this.formData = {
      name: company.name,
      code: company.code,
      brokerId: company.brokerId,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      address: company.address,
      commissionRate: company.commissionRate,
      claimsEmail: company.claimsEmail || '',
      claimsPhone: company.claimsPhone || '',
      policyTypes: [...company.policyTypes],
      paymentWaterfall: company.paymentWaterfall ? company.paymentWaterfall.map((item, index) => ({
        ...item,
        priority: index + 1
      })) : [
        { id: this.generateId(), type: 'premium', priority: 1, description: 'Base Premium' },
        { id: this.generateId(), type: 'tax', priority: 2, description: 'State & Municipal Taxes' },
        { id: this.generateId(), type: 'fee', priority: 3, description: 'Policy & Service Fees' }
      ]
    };
    this.showFormModal = true;
  }
  
  closeFormModal() {
    this.showFormModal = false;
    this.editingCompany = null;
    this.resetForm();
  }
  
  openDetailModal(company: InsuranceCompany) {
    this.selectedCompany.set(company);
    this.showDetailModal = true;
  }
  
  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedCompany.set(null);
  }
  
  togglePolicyType(type: string) {
    const index = this.formData.policyTypes.indexOf(type);
    if (index > -1) {
      this.formData.policyTypes.splice(index, 1);
    } else {
      this.formData.policyTypes.push(type);
    }
  }
  
  addWaterfallItem() {
    if (!this.formData.paymentWaterfall) {
      this.formData.paymentWaterfall = [];
    }
    const newItem: PaymentWaterfallItem = {
      id: this.generateId(),
      type: 'fee',
      priority: this.formData.paymentWaterfall!.length + 1,
      description: ''
    };
    this.formData.paymentWaterfall!.push(newItem);
  }
  
  removeWaterfallItem(index: number) {
    if (!this.formData.paymentWaterfall) return;
    this.formData.paymentWaterfall.splice(index, 1);
    // Update priorities
    this.formData.paymentWaterfall.forEach((item, i) => {
      item.priority = i + 1;
    });
  }
  
  isFormValid(): boolean {
    return !!(
      this.formData.name &&
      this.formData.code &&
      this.formData.contactEmail &&
      this.formData.contactPhone &&
      this.formData.address &&
      this.formData.commissionRate > 0 &&
      this.formData.paymentWaterfall && 
      this.formData.paymentWaterfall.length > 0
    );
  }
  
  saveCompany() {
    if (!this.isFormValid()) return;
    
    if (this.editingCompany) {
      this.insuranceCompanyService.updateInsuranceCompany(this.editingCompany.id, this.formData).subscribe({
        next: () => {
          this.toastr.success('Company updated successfully');
          this.closeFormModal();
          this.loadCompanies();
        },
        error: (error) => {
          console.error('Error updating company:', error);
          this.toastr.error('Failed to update company');
        }
      });
    } else {
      this.insuranceCompanyService.createInsuranceCompany(this.formData).subscribe({
        next: () => {
          this.toastr.success('Company created successfully');
          this.closeFormModal();
          this.loadCompanies();
        },
        error: (error) => {
          console.error('Error creating company:', error);
          this.toastr.error(error.error?.error || 'Failed to create company');
        }
      });
    }
  }
  
  exportData() {
    this.insuranceCompanyService.exportCompanies('csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `insurance-companies-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Export successful');
      },
      error: (error) => {
        console.error('Error exporting data:', error);
        this.toastr.error('Failed to export data');
      }
    });
  }
  
  resetForm() {
    this.formData = {
      name: '',
      code: '',
      brokerId: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      commissionRate: 0,
      claimsEmail: '',
      claimsPhone: '',
      policyTypes: [],
      paymentWaterfall: [
        { id: this.generateId(), type: 'premium', priority: 1, description: 'Base Premium' },
        { id: this.generateId(), type: 'tax', priority: 2, description: 'State & Municipal Taxes' },
        { id: this.generateId(), type: 'fee', priority: 3, description: 'Policy & Service Fees' }
      ]
    };
  }
  
  private generateId(): string {
    return 'id-' + Math.random().toString(36).substr(2, 9);
  }
}
