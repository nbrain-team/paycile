import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableConfig } from '../../components/data-table/data-table.component';
import { LeadService, Lead } from '../../services/lead.service';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <div class="mb-4">
        <h1 class="text-2xl font-semibold text-gray-900">Leads</h1>
        <p class="text-gray-600">Captured conversations and estimates from the public Savings Chat.</p>
      </div>

      <app-data-table [config]="table()"></app-data-table>
    </div>
  `,
  styles: []
})
export class LeadsComponent {
  rows = signal<Lead[]>([]);
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
        this.table.update(t => ({ ...t, data, totalItems: data.length, loading: false }));
      },
      error: () => {
        this.table.update(t => ({ ...t, loading: false }));
      }
    });
  }
}


