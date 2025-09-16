import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeesService } from '../../services/fees.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Category Rates</h1>
          <p class="text-gray-600">Manage categories used for Proposed ER in estimates.</p>
        </div>
        <label class="btn btn-outline relative cursor-pointer">
          <input type="file" accept=".csv" (change)="onCsv($event)" class="absolute inset-0 opacity-0 cursor-pointer" />
          Upload CSV
        </label>
      </div>

      <div class="card p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="label">Name</label>
            <input class="input w-full" type="text" [(ngModel)]="form.name" />
          </div>
          <div>
            <label class="label">Rate (%)</label>
            <input class="input w-full" type="number" step="0.01" [(ngModel)]="form.ratePercent" />
          </div>
          <div>
            <label class="label">Active</label>
            <select class="input w-full" [(ngModel)]="form.isActive">
              <option [ngValue]="true">Yes</option>
              <option [ngValue]="false">No</option>
            </select>
          </div>
          <div class="flex items-end">
            <button class="btn btn-primary w-full" (click)="save()">{{ form.id ? 'Update' : 'Add' }}</button>
          </div>
        </div>
        <div class="text-xs text-error-600 mt-2" *ngIf="error()">{{ error() }}</div>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="text-left px-3 py-2">Name</th>
              <th class="text-left px-3 py-2">Rate (%)</th>
              <th class="text-left px-3 py-2">Active</th>
              <th class="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let c of categories()">
              <td class="px-3 py-2">{{ c.name }}</td>
              <td class="px-3 py-2">{{ c.rate_percent }}</td>
              <td class="px-3 py-2">{{ c.is_active ? 'Yes' : 'No' }}</td>
              <td class="px-3 py-2 text-right space-x-2">
                <button class="btn btn-secondary" (click)="edit(c)">Edit</button>
                <button class="btn btn-outline" (click)="remove(c)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class AdminCategoriesComponent {
  categories = signal<Array<{ id: string; name: string; rate_percent: number; is_active: boolean }>>([]);
  error = signal<string | null>(null);

  form: { id?: string; name: string; ratePercent: number; isActive: boolean } = {
    name: '',
    ratePercent: 0,
    isActive: true
  };

  constructor(private fees: FeesService) {
    this.load();
  }

  load() {
    this.error.set(null);
    this.fees.listCategories().subscribe({
      next: (rows: any[]) => this.categories.set(rows),
      error: (e) => this.error.set(e?.error?.error || 'Failed to load categories')
    });
  }

  save() {
    if (!this.form.name || !this.form.ratePercent) {
      this.error.set('Name and rate are required');
      return;
    }
    this.error.set(null);
    this.fees.saveCategory(this.form).subscribe({
      next: () => { this.form = { name: '', ratePercent: 0, isActive: true }; this.load(); },
      error: (e) => this.error.set(e?.error?.error || 'Failed to save')
    });
  }

  edit(c: any) {
    this.form = { id: c.id, name: c.name, ratePercent: c.rate_percent, isActive: c.is_active };
  }

  remove(c: any) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    this.error.set(null);
    this.fees.deleteCategory(c.id).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(e?.error?.error || 'Failed to delete')
    });
  }

  onCsv(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.error.set(null);
    this.fees.uploadCategoriesCsv(file).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(e?.error?.error || 'CSV upload failed')
    });
    input.value = '';
  }
}

