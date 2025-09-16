import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableComponent, TableConfig } from '../../components/data-table/data-table.component';
import { LeadService, Lead } from '../../services/lead.service';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <div class="mb-4">
        <h1 class="text-2xl font-semibold text-gray-900">Leads</h1>
        <p class="text-gray-600">Captured conversations and estimates from the public Savings Chat.</p>
      </div>

      <!-- Filters -->
      <div class="card mb-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label class="label">From</label>
            <input class="input" type="date" [(ngModel)]="fromDate" />
          </div>
          <div>
            <label class="label">To</label>
            <input class="input" type="date" [(ngModel)]="toDate" />
          </div>
          <div>
            <label class="label">Completed only</label>
            <select class="input" [(ngModel)]="completedOnly">
              <option [ngValue]="false">No</option>
              <option [ngValue]="true">Yes</option>
            </select>
          </div>
          <div>
            <label class="label">Sort by</label>
            <select class="input" [(ngModel)]="sortField">
              <option value="created_at">Created</option>
              <option value="savings_dollars">Savings</option>
            </select>
          </div>
          <div>
            <label class="label">Order</label>
            <select class="input" [(ngModel)]="sortOrder">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

      <app-data-table [config]="table()"></app-data-table>
    </div>
  `,
  styles: []
})
export class LeadsComponent {
  rows = signal<Lead[]>([]);
  fromDate: string | null = null;
  toDate: string | null = null;
  completedOnly: boolean = false;
  sortField: 'created_at' | 'savings_dollars' = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  filtered = computed(() => {
    let data = [...(this.rows() || [])];
    if (this.fromDate) {
      const ts = new Date(this.fromDate).getTime();
      data = data.filter(d => new Date(d.created_at).getTime() >= ts);
    }
    if (this.toDate) {
      const te = new Date(this.toDate).getTime() + 24*60*60*1000 - 1;
      data = data.filter(d => new Date(d.created_at).getTime() <= te);
    }
    if (this.completedOnly) {
      data = data.filter(d => !!(d.name && (d.email || d.phone)));
    }
    data.sort((a:any,b:any) => {
      const av = (this.sortField === 'created_at') ? new Date(a.created_at).getTime() : (a.savings_dollars || 0);
      const bv = (this.sortField === 'created_at') ? new Date(b.created_at).getTime() : (b.savings_dollars || 0);
      return this.sortOrder === 'asc' ? av - bv : bv - av;
    });
    return data;
  });

  table = signal<TableConfig>({
    columns: [
      { key: 'created_at', label: 'Created', width: '140px' },
      { key: 'name', label: 'Name', width: '160px' },
      { key: 'email', label: 'Email', width: '220px' },
      { key: 'phone', label: 'Phone', width: '140px' },
      { key: 'basis', label: 'Basis', width: '80px' },
      { key: 'volume', label: 'Volume', width: '120px' },
      { key: 'transactions', label: 'Txns', width: '80px' },
      { key: 'fees', label: 'Fees', width: '120px' },
      { key: 'mcc_category', label: 'Category', width: '180px' },
      { key: 'savings_dollars', label: 'Savings', width: '120px' },
    ],
    data: [],
    totalItems: 0,
    currentPage: 1,
    pageSize: 50,
    showPagination: false,
    loading: true,
    emptyMessage: 'No leads yet'
  });

  constructor(private leads: LeadService) {
    this.load();
  }

  load() {
    this.table.update(t => ({ ...t, loading: true }));
    this.leads.list().subscribe({
      next: (r: any) => {
        const data = r.data || [];
        this.rows.set(data);
        const filtered = this.filtered();
        this.table.update(t => ({ ...t, data: filtered, totalItems: filtered.length, loading: false }));
      },
      error: () => {
        this.table.update(t => ({ ...t, loading: false }));
      }
    });
  }
}


