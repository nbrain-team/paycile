import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeesService, CalcResponse, ExtractResponse, AdvancedCalcRequest, AdvancedCalcResponse } from '../../services/fees.service';

@Component({
  selector: 'app-fees-lead-magnet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-6">
    <div class="card max-w-5xl mx-auto">
      <div class="flex flex-col gap-2 mb-6">
        <h1 class="text-2xl font-semibold">Find out in 30 seconds what you’re really paying.</h1>
        <p class="text-muted-foreground">Upload a monthly statement or answer 3 quick questions to estimate your effective rate and potential savings.</p>
      </div>

      <div class="flex flex-wrap gap-3 mb-6">
        <button class="btn btn-primary" [class.btn-outline]="mode() !== 'upload'" (click)="setMode('upload')">Upload statement (PDF)</button>
        <button class="btn btn-secondary" [class.btn-outline]="mode() !== 'quick'" (click)="setMode('quick')">Answer 3 quick questions</button>
        <button class="btn btn-secondary" [class.btn-outline]="mode() !== 'advanced'" (click)="setMode('advanced')">Advanced (MCC & card mix)</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <!-- Upload mode -->
          <div *ngIf="mode() === 'upload'" class="space-y-4">
            <div class="card">
              <input type="file" accept="application/pdf" (change)="onFileSelected($event)" class="block w-full text-sm" />
              <div class="text-xs text-muted-foreground mt-2">We only need totals (volume, fees, transactions). PDF recommended for best accuracy.</div>
            </div>
            <div *ngIf="uploadState() === 'uploading'" class="animate-pulse text-sm">Uploading…</div>
            <div *ngIf="uploadState() === 'extracting'" class="animate-pulse text-sm">Extracting totals…</div>
            <div *ngIf="error()" class="text-error-600 text-sm">{{ error() }}</div>
            <div *ngIf="extract()" class="card">
              <h3 class="font-medium mb-2">Parsed totals</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div class="text-muted-foreground">Amount Submitted</div>
                  <div class="font-semibold">{{ formatDollars(extract()?.volume) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">Fees Charged</div>
                  <div class="font-semibold">{{ formatDollars(extract()?.fees) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">Total Items</div>
                  <div class="font-semibold">{{ extract()?.transactions?.toLocaleString() }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick estimate -->
          <div *ngIf="mode() === 'quick'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="label">Monthly Volume ($)</label>
              <input class="input w-full" type="number" min="0" [(ngModel)]="form.volume" />
            </div>
            <div>
              <label class="label"># Transactions</label>
              <input class="input w-full" type="number" min="1" [(ngModel)]="form.transactions" />
            </div>
            <div>
              <label class="label">Total Fees ($)</label>
              <input class="input w-full" type="number" min="0" [(ngModel)]="form.fees" />
            </div>
            <div class="md:col-span-3">
              <button class="btn btn-primary" (click)="runQuickEstimate()">Get estimate</button>
            </div>
          </div>

          <!-- Advanced estimate -->
          <div *ngIf="mode() === 'advanced'" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="label">Basis</label>
                <select class="input w-full" [(ngModel)]="advForm.basis">
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label class="label">Total Volume ($)</label>
                <input class="input w-full" type="number" min="0" [(ngModel)]="advForm.totalVolume" />
              </div>
              <div>
                <label class="label">Total Fees ($)</label>
                <input class="input w-full" type="number" min="0" [(ngModel)]="advForm.totalFees" />
              </div>
              <div>
                <label class="label"># Transactions</label>
                <input class="input w-full" type="number" min="1" [(ngModel)]="advForm.totalTransactions" />
              </div>
              <div>
                <label class="label">Category</label>
                <select class="input w-full" [(ngModel)]="advCategory">
                  <option value="propane">Propane</option>
                  <option value="insurance">Insurance</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label class="label">Per-transaction fee ($)</label>
                <input class="input w-full" type="number" min="0" step="0.01" [(ngModel)]="advForm.perTxnFee" />
              </div>
              <div>
                <label class="label">Monthly fixed fees ($)</label>
                <input class="input w-full" type="number" min="0" step="0.01" [(ngModel)]="advForm.monthlyFixedFees" />
              </div>
            </div>

            <div class="card">
              <h3 class="font-medium mb-2">Card mix (optional)</h3>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label class="label">Visa Volume ($)</label>
                  <input class="input w-full" type="number" min="0" [(ngModel)]="advForm.perCard!.visa!.volume" />
                </div>
                <div>
                  <label class="label">MC Volume ($)</label>
                  <input class="input w-full" type="number" min="0" [(ngModel)]="advForm.perCard!.mc!.volume" />
                </div>
                <div>
                  <label class="label">Discover Volume ($)</label>
                  <input class="input w-full" type="number" min="0" [(ngModel)]="advForm.perCard!.discover!.volume" />
                </div>
                <div>
                  <label class="label">Amex Volume ($)</label>
                  <input class="input w-full" type="number" min="0" [(ngModel)]="advForm.perCard!.amex!.volume" />
                </div>
              </div>
            </div>

            <div>
              <button class="btn btn-primary" (click)="runAdvancedEstimate()">Run Advanced Estimate</button>
            </div>
            <div *ngIf="advResults() as r" class="card">
              <h3 class="font-medium mb-2">Multi-period savings</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div class="text-muted-foreground">Monthly</div>
                  <div class="font-semibold">{{ formatDollars(r.horizons.monthly) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">Annual</div>
                  <div class="font-semibold">{{ formatDollars(r.horizons.annual) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">3-Year</div>
                  <div class="font-semibold">{{ formatDollars(r.horizons.threeYear) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">5-Year</div>
                  <div class="font-semibold">{{ formatDollars(r.horizons.fiveYear) }}</div>
                </div>
              </div>
              <div class="mt-4">
                <h4 class="font-medium mb-1">Fee Recovery Program (90%)</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div class="text-muted-foreground">Monthly</div>
                    <div class="font-semibold">{{ formatDollars(r.feeRecovery.monthly) }}</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground">Annual</div>
                    <div class="font-semibold">{{ formatDollars(r.feeRecovery.annual) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="card">
            <h3 class="font-medium mb-3">Your estimate</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Current effective rate</span>
                <span class="font-semibold">{{ formatPercent(results()?.currentEffRate) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Proposed effective rate</span>
                <span class="font-semibold">{{ formatPercent(results()?.proposedEffRate) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Estimated savings</span>
                <span class="font-semibold" [class.text-success-600]="savingsPositive()" [class.text-error-600]="!savingsPositive()">
                  {{ formatDollars(results()?.savingsDollars) }} ({{ formatPercent(results()?.rateDelta) }})
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Avg Ticket</span>
                <span class="badge">{{ formatDollars(results()?.avgTicket) }}</span>
              </div>
            </div>

            <div class="mt-4" *ngIf="hasResults()">
              <div *ngIf="savingsPositive(); else optimized" class="text-sm text-success-700">
                You could save {{ formatDollars(results()!.savingsDollars) }} ({{ formatPercent(results()!.currentEffRate - results()!.proposedEffRate) }})
              </div>
              <ng-template #optimized>
                <div class="text-sm text-muted-foreground">Looks like you’re optimized. Want to explore cost recovery?</div>
              </ng-template>
            </div>
          </div>

          <div class="mt-4 card">
            <h3 class="font-medium mb-3">Eliminate ~90% of fees</h3>
            <p class="text-sm text-muted-foreground mb-3">Interested in eliminating ~90% of merchant fees? See how our cost-recovery program works.</p>
            <div class="flex gap-2">
              <button class="btn btn-primary w-full">Explain Cost-Recovery Program</button>
              <button class="btn btn-secondary w-full">Book a 15-min call</button>
            </div>
          </div>

          <div class="mt-4 text-xs text-muted-foreground">
            Assumptions apply. Parsed from uploaded statement where possible. Sources available upon request.
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class FeesLeadMagnetComponent {
  mode = signal<'upload' | 'quick' | 'advanced'>('upload');
  uploadState = signal<'idle' | 'uploading' | 'extracting'>('idle');
  error = signal<string | null>(null);
  fileId = signal<string | null>(null);
  extract = signal<ExtractResponse | null>(null);
  results = signal<CalcResponse | null>(null);
  advResults = signal<AdvancedCalcResponse | null>(null);

  form = {
    volume: 0,
    transactions: 0,
    fees: 0
  };

  advForm: AdvancedCalcRequest = {
    basis: 'monthly',
    totalVolume: 0,
    totalTransactions: 0,
    totalFees: 0,
    mcc: undefined,
    monthlyFixedFees: 0,
    perTxnFee: 0,
    perCard: {
      visa: { volume: 0, transactions: 0 },
      mc: { volume: 0, transactions: 0 },
      discover: { volume: 0, transactions: 0 },
      amex: { volume: 0, transactions: 0 },
    }
  };

  advCategory: 'propane' | 'insurance' | 'real_estate' | 'other' = 'other';

  constructor(private fees: FeesService) {}

  setMode(m: 'upload' | 'quick' | 'advanced') {
    this.mode.set(m);
    this.error.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.error.set(null);
    this.uploadState.set('uploading');
    this.fees.uploadStatement(file).subscribe({
      next: r => {
        this.fileId.set(r.fileId);
        this.uploadState.set('extracting');
        this.fees.extract(r.fileId).subscribe({
          next: ex => {
            console.log('[fees] extract response', ex);
            this.extract.set(ex);
            this.uploadState.set('idle');
            // Autofill quick estimate with extracted values
            this.form.volume = ex.volume ?? 0;
            this.form.transactions = ex.transactions ?? 0;
            this.form.fees = ex.fees ?? 0;
            this.runCalculation(ex.volume, ex.transactions, ex.fees);
          },
          error: (e) => {
            this.uploadState.set('idle');
            this.error.set(e?.error?.error || 'Failed to extract totals');
          }
        });
      },
      error: (e) => {
        this.uploadState.set('idle');
        this.error.set(e?.error?.error || 'Upload failed');
      }
    });
  }

  runQuickEstimate() {
    const { volume, transactions, fees } = this.form;
    if (!volume || !transactions || !fees) {
      this.error.set('Please fill all values');
      return;
    }
    this.error.set(null);
    this.runCalculation(volume, transactions, fees);
  }

  runAdvancedEstimate() {
    const p = this.advForm;
    if (!p.totalVolume || !p.totalTransactions || !p.totalFees) {
      this.error.set('Please enter volume, transactions, and fees');
      return;
    }
    this.error.set(null);
    // For quick estimate comparison in the side card based on category selection
    this.fees.calculate(p.totalVolume, p.totalTransactions, p.totalFees, this.advCategory).subscribe({
      next: r => this.results.set(r),
      error: (e) => this.error.set(e?.error?.error || 'Calculation failed')
    });
    this.fees.calculateAdvanced(p).subscribe({
      next: r => this.advResults.set(r),
      error: (e) => this.error.set(e?.error?.error || 'Advanced calculation failed')
    });
  }

  private runCalculation(volume: number, transactions: number, fees: number) {
    console.log('[fees] calculate input', { volume, transactions, fees });
    this.fees.calculate(volume, transactions, fees, undefined).subscribe({
      next: r => this.results.set(r),
      error: (e) => this.error.set(e?.error?.error || 'Calculation failed')
    });
  }

  hasResults = computed(() => !!this.results());
  savingsPositive = computed(() => (this.results()?.savingsDollars || 0) > 0);

  formatPercent(v?: number | null): string {
    if (v === undefined || v === null || Number.isNaN(v)) return '—';
    return `${v.toFixed(2)}%`;
    }

  formatDollars(v?: number | null): string {
    if (v === undefined || v === null || Number.isNaN(v)) return '$0.00';
    const abs = Math.abs(v);
    if (abs >= 10) return `$${Math.round(v).toLocaleString()}`;
    return `$${v.toFixed(2)}`;
  }
}


