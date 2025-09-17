import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  customTemplate?: TemplateRef<any>;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableConfig {
  columns: TableColumn[];
  data: any[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  showPagination?: boolean;
  showActions?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
      <!-- Table -->
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th *ngFor="let column of config.columns"
                [style.width]="column.width"
                [style.text-align]="column.align || 'left'"
                class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                [ngClass]="{
                  'cursor-pointer hover:bg-gray-100': column.sortable,
                  'text-left': !column.align || column.align === 'left',
                  'text-center': column.align === 'center',
                  'text-right': column.align === 'right'
                }"
                (click)="column.sortable && onSort(column.key)">
              {{ column.label }}
              <span *ngIf="column.sortable && config.sortField === column.key" class="ml-1">
                {{ config.sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th *ngIf="config.showActions" 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- Loading State -->
          <tr *ngIf="config.loading">
            <td [attr.colspan]="getColumnCount()" class="px-6 py-4 text-center text-gray-500">
              <div class="inline-flex items-center">
                <svg class="animate-spin h-5 w-5 mr-3 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            </td>
          </tr>
          
          <!-- Empty State -->
          <tr *ngIf="!config.loading && config.data.length === 0">
            <td [attr.colspan]="getColumnCount()" class="px-6 py-4 text-center text-gray-500">
              {{ config.emptyMessage || 'No data found' }}
            </td>
          </tr>
          
          <!-- Data Rows -->
          <tr *ngFor="let row of config.data; let i = index" 
              class="hover:bg-gray-50"
              (click)="onRowClick.emit(row)">
            <td *ngFor="let column of config.columns"
                class="px-6 py-4 whitespace-nowrap text-sm"
                [ngClass]="{
                  'text-left': !column.align || column.align === 'left',
                  'text-center': column.align === 'center',
                  'text-right': column.align === 'right'
                }">
              <!-- Use custom template if provided -->
              <ng-container *ngIf="column.customTemplate; else defaultCell">
                <ng-container *ngTemplateOutlet="column.customTemplate; context: { $implicit: row, row: row, value: getNestedProperty(row, column.key) }"></ng-container>
              </ng-container>
              
              <!-- Default cell rendering -->
              <ng-template #defaultCell>
                <span [ngClass]="getCellClass(column.key, row)">
                  {{ formatCellValue(column.key, getNestedProperty(row, column.key)) }}
                </span>
              </ng-template>
            </td>
            
            <!-- Actions Column -->
            <td *ngIf="config.showActions" class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <ng-content select="[actions]"></ng-content>
              <ng-container *ngIf="actionsTemplate">
                <ng-container *ngTemplateOutlet="actionsTemplate; context: { $implicit: row, row: row, index: i }"></ng-container>
              </ng-container>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div *ngIf="config.showPagination !== false && config.totalItems > 0 && !config.loading" 
           class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ getStartIndex() }} to {{ getEndIndex() }} of {{ config.totalItems }} results
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="config.currentPage === 1"
              (click)="changePage(config.currentPage - 1)"
            >
              Previous
            </button>
            
            <!-- Page Numbers -->
            <div class="hidden sm:flex gap-1">
              <button *ngFor="let page of getPageNumbers()"
                      (click)="page !== '...' && changePage(page)"
                      [disabled]="page === '...'"
                      [ngClass]="{
                        'bg-primary-600 text-white': page === config.currentPage,
                        'text-gray-700 hover:bg-gray-50': page !== config.currentPage && page !== '...',
                        'cursor-default': page === '...'
                      }"
                      class="px-3 py-2 text-sm font-medium border border-gray-300 rounded-md disabled:opacity-50">
                {{ page }}
              </button>
            </div>
            
            <!-- Mobile Page Info -->
            <span class="px-4 py-2 text-sm text-gray-700 sm:hidden">
              Page {{ config.currentPage }} of {{ getTotalPages() }}
            </span>
            
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="config.currentPage === getTotalPages()"
              (click)="changePage(config.currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DataTableComponent {
  @Input() config!: TableConfig;
  @Input() cellFormatter?: (column: string, value: any) => string;
  @Input() cellClassProvider?: (column: string, row: any) => string;
  @ContentChild('actions', { read: TemplateRef }) actionsTemplate?: TemplateRef<any>;
  
  @Output() onPageChange = new EventEmitter<number>();
  @Output() onSortChange = new EventEmitter<{ field: string; order: 'asc' | 'desc' }>();
  @Output() onRowClick = new EventEmitter<any>();

  getColumnCount(): number {
    return this.config.columns.length + (this.config.showActions ? 1 : 0);
  }

  getStartIndex(): number {
    if (this.config.totalItems === 0) return 0;
    return (this.config.currentPage - 1) * this.config.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.config.currentPage * this.config.pageSize, this.config.totalItems);
  }

  getTotalPages(): number {
    return Math.ceil(this.config.totalItems / this.config.pageSize);
  }

  getPageNumbers(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.config.currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  }

  onSort(field: string) {
    const newOrder = this.config.sortField === field && this.config.sortOrder === 'asc' ? 'desc' : 'asc';
    this.onSortChange.emit({ field, order: newOrder });
  }

  changePage(page: number | string) {
    if (typeof page === 'number') {
      this.onPageChange.emit(page);
    }
  }

  formatCellValue(column: string, value: any): string {
    if (this.cellFormatter) {
      return this.cellFormatter(column, value);
    }
    
    // Default formatting
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    if (typeof value === 'number') {
      // Check if it looks like a currency amount
      if (column.toLowerCase().includes('amount') || column.toLowerCase().includes('price')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
      return value.toLocaleString();
    }
    
    return String(value);
  }

  getCellClass(column: string, row: any): string {
    if (this.cellClassProvider) {
      return this.cellClassProvider(column, row);
    }
    return '';
  }

  getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, part) => current?.[part], obj);
  }
} 