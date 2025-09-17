import { Component, OnInit, signal, computed, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgentService } from '../../services/agent.service';
import { AuthService } from '../../services/auth.service';
import { Agent } from '../../models/agent.model';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { DataTableComponent, TableConfig } from '../../components/data-table/data-table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, DataTableComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Access Control -->
      <div *ngIf="!hasAccess()" class="text-center py-12">
        <p class="text-gray-500">Access restricted to brokers and administrators</p>
      </div>

      <div *ngIf="hasAccess()">
        <div class="sm:flex sm:items-center sm:justify-between">
          <h1 class="text-2xl font-bold text-gray-900">Agents</h1>
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
              (click)="openAddAgentModal()"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Agent
            </button>
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              type="text"
              placeholder="Search agents..."
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
            />
          </div>
          <select
            class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            [(ngModel)]="departmentFilter"
            (ngModelChange)="onFilterChange()"
          >
            <option value="">All Departments</option>
            <option value="sales">Sales</option>
            <option value="service">Service</option>
            <option value="claims">Claims</option>
            <option value="underwriting">Underwriting</option>
          </select>
          <button
            (click)="exportAgents()"
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
            <app-loading-spinner size="lg" message="Loading agents..."></app-loading-spinner>
          </div>

          <!-- Empty State -->
          <div *ngIf="!loading() && agents().length === 0" class="col-span-full text-center py-12">
            <p class="text-gray-500">
              {{ searchTerm ? 'No agents found matching "' + searchTerm + '"' : 'No agents found' }}
            </p>
          </div>

          <!-- Agent Cards -->
          <div 
            *ngFor="let agent of agents()" 
            class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center">
                <div class="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-lg font-medium text-primary-600">
                    {{ getInitials(agent) }}
                  </span>
                </div>
                <div class="ml-3">
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ agent.firstName }} {{ agent.lastName }}
                  </h3>
                  <p class="text-sm text-gray-500">{{ agent.department || 'Sales' }}</p>
                </div>
              </div>
              
              <!-- Status Toggle -->
              <button
                (click)="toggleStatus(agent)"
                [ngClass]="{
                  'bg-green-100 text-green-800': agent.isActive,
                  'bg-gray-100 text-gray-800': !agent.isActive
                }"
                class="px-3 py-1 text-xs font-semibold rounded-full transition-colors"
              >
                {{ agent.isActive ? 'Active' : 'Inactive' }}
              </button>
            </div>

            <!-- Contact Info -->
            <div class="space-y-2 mb-4">
              <p class="text-sm text-gray-600 flex items-center">
                <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {{ agent.email }}
              </p>
              <p class="text-sm text-gray-600 flex items-center">
                <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {{ agent.phone }}
              </p>
              <p *ngIf="agent.licenseNumber" class="text-sm text-gray-600 flex items-center">
                <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                License: {{ agent.licenseNumber }}
              </p>
            </div>

            <!-- Performance Metrics -->
            <div class="border-t pt-4">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Performance</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-gray-500">Clients</p>
                  <p class="text-lg font-semibold text-gray-900">{{ agent.totalClients || 0 }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Policies</p>
                  <p class="text-lg font-semibold text-gray-900">{{ agent.totalPolicies || 0 }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">YTD Sales</p>
                  <p class="text-lg font-semibold text-gray-900">{{ formatCurrency(agent.ytdSales || 0) }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Conv. Rate</p>
                  <p class="text-lg font-semibold" [ngClass]="getConversionRateClass(agent.conversionRate || 0)">
                    {{ (agent.conversionRate || 0).toFixed(1) }}%
                  </p>
                </div>
              </div>
              
              <!-- Progress Bar for Monthly Target -->
              <div *ngIf="agent.monthlyTarget" class="mt-3">
                <div class="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Monthly Target</span>
                  <span>{{ getTargetPercentage(agent) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div [ngClass]="getTargetProgressClass(agent)" 
                       class="h-2 rounded-full transition-all"
                       [style.width.%]="getTargetPercentage(agent)"></div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-between items-center mt-4 pt-4 border-t">
              <p class="text-xs text-gray-500">
                Last active: {{ getRelativeTime(agent.lastActivity) }}
              </p>
              <div class="flex space-x-2">
                <button 
                  (click)="viewAgentDetails(agent)"
                  class="text-primary-600 hover:text-primary-900"
                  title="View details"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button 
                  (click)="viewAgentPerformance(agent)"
                  class="text-primary-600 hover:text-primary-900"
                  title="View performance"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
                <button 
                  (click)="sendNotification(agent)"
                  class="text-gray-600 hover:text-gray-900"
                  title="Send notification"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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
            (onRowClick)="viewAgentDetails($event)"
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
              <div class="text-sm text-gray-500">
                {{ row.department || 'Sales' }}
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

        <ng-template #performanceTemplate let-row="row">
          <div class="text-center">
            <div class="text-sm font-medium text-gray-900">{{ row.totalClients || 0 }} / {{ row.totalPolicies || 0 }}</div>
            <div class="text-xs text-gray-500">Clients / Policies</div>
          </div>
        </ng-template>

        <ng-template #conversionTemplate let-row="row">
          <div class="text-center">
            <span [ngClass]="getConversionRateClass(row.conversionRate || 0)" class="text-sm font-medium">
              {{ (row.conversionRate || 0).toFixed(1) }}%
            </span>
          </div>
        </ng-template>

        <ng-template #statusTemplate let-value="value" let-row="row">
          <button
            (click)="toggleStatus(row); $event.stopPropagation()"
            [ngClass]="{
              'bg-green-100 text-green-800': value,
              'bg-gray-100 text-gray-800': !value
            }"
            class="px-2 py-1 text-xs font-semibold rounded-full transition-colors"
          >
            {{ value ? 'Active' : 'Inactive' }}
          </button>
        </ng-template>

        <ng-template #actionsTemplate let-row="row">
          <div class="flex space-x-3">
            <button 
              (click)="viewAgentDetails(row); $event.stopPropagation()"
              class="text-primary-600 hover:text-primary-900"
            >
              View
            </button>
            <button 
              (click)="viewAgentPerformance(row); $event.stopPropagation()"
              class="text-primary-600 hover:text-primary-900"
            >
              Performance
            </button>
          </div>
        </ng-template>

        <!-- Pagination for Grid View -->
        <div *ngIf="viewMode() === 'grid' && totalPages() > 1" class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage() - 1) * pageSize + 1 }} to {{ Math.min(currentPage() * pageSize, totalAgents()) }} of
            {{ totalAgents() }} results
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

        <!-- Add Agent Modal -->
        <app-modal 
          *ngIf="showAddModal"
          title="Add New Agent"
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
                  [(ngModel)]="newAgent.firstName"
                  name="firstName"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  [(ngModel)]="newAgent.lastName"
                  name="lastName"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  [(ngModel)]="newAgent.email"
                  name="email"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Phone *</label>
                <input
                  type="tel"
                  [(ngModel)]="newAgent.phone"
                  name="phone"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Department</label>
                <select
                  [(ngModel)]="newAgent.department"
                  name="department"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select Department</option>
                  <option value="sales">Sales</option>
                  <option value="service">Service</option>
                  <option value="claims">Claims</option>
                  <option value="underwriting">Underwriting</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">License Number</label>
                <input
                  type="text"
                  [(ngModel)]="newAgent.licenseNumber"
                  name="licenseNumber"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Monthly Target ($)</label>
              <input
                type="number"
                [(ngModel)]="newAgent.monthlyTarget"
                name="monthlyTarget"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
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
              (click)="saveAgent()"
              [disabled]="!isFormValid()"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              Save Agent
            </button>
          </div>
        </app-modal>

        <!-- Notification Modal -->
        <app-modal 
          *ngIf="showNotificationModal"
          title="Send Notification"
          [isOpen]="showNotificationModal"
          (onClose)="closeNotificationModal()"
        >
          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-600">
                To: <span class="font-medium">{{ selectedAgent()?.firstName }} {{ selectedAgent()?.lastName }}</span>
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                [(ngModel)]="notificationData.title"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Notification title..."
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                [(ngModel)]="notificationData.message"
                rows="4"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Enter notification message..."
              ></textarea>
            </div>
          </div>
          
          <div slot="footer" class="flex justify-end space-x-3">
            <button
              (click)="closeNotificationModal()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              (click)="sendNotificationToAgent()"
              [disabled]="!notificationData.title || !notificationData.message"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </app-modal>
      </div>
    </div>
  `,
  styles: []
})
export class AgentsComponent implements OnInit, AfterViewInit {
  // Template references
  @ViewChild('nameTemplate', { read: TemplateRef }) nameTemplate!: TemplateRef<any>;
  @ViewChild('contactTemplate', { read: TemplateRef }) contactTemplate!: TemplateRef<any>;
  @ViewChild('performanceTemplate', { read: TemplateRef }) performanceTemplate!: TemplateRef<any>;
  @ViewChild('conversionTemplate', { read: TemplateRef }) conversionTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { read: TemplateRef }) statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { read: TemplateRef }) actionsTemplate!: TemplateRef<any>;

  // Signals
  agents = signal<Agent[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  totalAgents = signal(0);
  totalPages = signal(1);
  viewMode = signal<'grid' | 'table'>('grid');
  selectedAgent = signal<Agent | null>(null);
  user = this.authService.user;
  
  // Filter state
  searchTerm = '';
  departmentFilter = '';
  sortField = 'lastName';
  sortOrder: 'asc' | 'desc' = 'asc';
  pageSize = 12;
  
  // Modal state
  showAddModal = false;
  showNotificationModal = false;
  
  // Form data
  newAgent = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    licenseNumber: '',
    monthlyTarget: 0
  };
  
  notificationData = {
    title: '',
    message: ''
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
        key: 'performance', 
        label: 'Performance',
        customTemplate: this.performanceTemplate,
        align: 'center'
      },
      { 
        key: 'ytdSales', 
        label: 'YTD Sales',
        sortable: true,
        align: 'right'
      },
      { 
        key: 'conversionRate', 
        label: 'Conv. Rate',
        sortable: true,
        customTemplate: this.conversionTemplate,
        align: 'center'
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
    data: this.agents(),
    totalItems: this.totalAgents(),
    currentPage: this.currentPage(),
    pageSize: this.pageSize,
    sortField: this.sortField,
    sortOrder: this.sortOrder,
    loading: this.loading(),
    emptyMessage: this.searchTerm ? `No agents found matching "${this.searchTerm}"` : 'No agents found',
    showPagination: true,
    showActions: true
  }));
  
  // Expose Math for template
  Math = Math;
  
  constructor(
    private agentService: AgentService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    if (this.hasAccess()) {
      this.loadAgents();
    }
  }

  ngAfterViewInit() {
    // Force change detection to update table config with templates
    setTimeout(() => {
      this.agents.set([...this.agents()]);
    });
  }

  hasAccess(): boolean {
    const userRole = this.user()?.role;
    return userRole === 'broker' || userRole === 'admin';
  }

  loadAgents() {
    this.loading.set(true);
    
    const filters: any = {
      search: this.searchTerm,
      page: this.currentPage(),
      limit: this.pageSize,
      sortBy: this.sortField,
      sortOrder: this.sortOrder
    };

    // Only filter by brokerId for broker users
    if (this.user()?.role === 'broker') {
      filters.brokerId = this.user()?.id;
    }

    if (this.departmentFilter) {
      filters.department = this.departmentFilter;
    }
    
    this.agentService.getAgents(filters).subscribe({
      next: (response) => {
        this.agents.set(response.data || []);
        this.totalAgents.set(response.meta?.total || 0);
        this.totalPages.set(response.meta?.totalPages || 1);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading agents:', error);
        this.toastr.error('Failed to load agents');
        this.loading.set(false);
      }
    });
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.loadAgents();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadAgents();
  }

  handleSort(event: { field: string; order: 'asc' | 'desc' }) {
    this.sortField = event.field;
    this.sortOrder = event.order;
    this.loadAgents();
  }

  handlePageChange(page: number) {
    this.currentPage.set(page);
    this.loadAgents();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadAgents();
  }

  toggleStatus(agent: Agent) {
    this.agentService.toggleAgentStatus(agent.id, !agent.isActive).subscribe({
      next: () => {
        this.toastr.success(`Agent ${agent.isActive ? 'deactivated' : 'activated'} successfully`);
        this.loadAgents();
      },
      error: (error) => {
        console.error('Error toggling agent status:', error);
        this.toastr.error('Failed to update agent status');
      }
    });
  }

  viewAgentDetails(agent: Agent) {
    this.router.navigate(['/agents', agent.id]);
  }

  viewAgentPerformance(agent: Agent) {
    this.router.navigate(['/agents', agent.id, 'performance']);
  }

  openAddAgentModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.resetForm();
  }

  resetForm() {
    this.newAgent = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      licenseNumber: '',
      monthlyTarget: 0
    };
  }

  isFormValid(): boolean {
    return !!(
      this.newAgent.firstName &&
      this.newAgent.lastName &&
      this.newAgent.email &&
      this.newAgent.phone
    );
  }

  saveAgent() {
    if (!this.isFormValid()) return;
    
    const brokerId = this.user()?.role === 'broker' ? this.user()?.id : undefined;
    
    this.agentService.createAgent(this.newAgent, brokerId).subscribe({
      next: () => {
        this.toastr.success('Agent added successfully');
        this.loadAgents();
        this.closeAddModal();
      },
      error: (error) => {
        console.error('Error creating agent:', error);
        this.toastr.error('Failed to add agent');
      }
    });
  }

  sendNotification(agent: Agent) {
    this.selectedAgent.set(agent);
    this.showNotificationModal = true;
  }

  closeNotificationModal() {
    this.showNotificationModal = false;
    this.notificationData = { title: '', message: '' };
    this.selectedAgent.set(null);
  }

  sendNotificationToAgent() {
    const agent = this.selectedAgent();
    if (!agent || !this.notificationData.title || !this.notificationData.message) return;
    
    this.agentService.sendNotification(agent.id, this.notificationData).subscribe({
      next: () => {
        this.toastr.success('Notification sent successfully');
        this.closeNotificationModal();
      },
      error: (error) => {
        console.error('Error sending notification:', error);
        this.toastr.error('Failed to send notification');
      }
    });
  }

  exportAgents() {
    this.agentService.exportAgents('csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `agents-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Export completed successfully');
      },
      error: (error) => {
        console.error('Error exporting agents:', error);
        this.toastr.error('Failed to export agents');
      }
    });
  }

  getInitials(agent: Agent): string {
    return `${agent.firstName[0]}${agent.lastName[0]}`.toUpperCase();
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getConversionRateClass(rate: number): string {
    if (rate >= 30) return 'text-green-600';
    if (rate >= 20) return 'text-yellow-600';
    return 'text-red-600';
  }

  getTargetPercentage(agent: Agent): number {
    if (!agent.monthlyTarget || !agent.ytdSales) return 0;
    const monthlyFromYtd = agent.ytdSales / new Date().getMonth(); // Simplified calculation
    return Math.min(100, Math.round((monthlyFromYtd / agent.monthlyTarget) * 100));
  }

  getTargetProgressClass(agent: Agent): string {
    const percentage = this.getTargetPercentage(agent);
    if (percentage >= 100) return 'bg-green-600';
    if (percentage >= 75) return 'bg-yellow-600';
    if (percentage >= 50) return 'bg-orange-600';
    return 'bg-red-600';
  }
}
