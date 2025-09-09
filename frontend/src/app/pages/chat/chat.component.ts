import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeesService, AdvancedCalcRequest, AdvancedCalcResponse, CalcResponse, ExtractResponse } from '../../services/fees.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <div class="mb-4">
        <h1 class="text-2xl font-semibold text-gray-900">Savings Chat</h1>
        <p class="text-gray-600">I'll guide you. We'll start with a quick estimate, then refine for precision.</p>
      </div>

      <!-- Conversation -->
      <div class="card h-[60vh] overflow-y-auto p-4 space-y-4">
        <div *ngFor="let m of messages()" class="flex" [class.justify-end]="m.role === 'user'">
          <div [ngClass]="m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'" class="max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap">
            <div *ngIf="m.type === 'text'">{{ m.text }}</div>
            <div *ngIf="m.type === 'result'">
              <div class="font-medium mb-1">Quick Estimate</div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div class="text-gray-500">Current ER</div>
                  <div class="font-semibold">{{ formatPercent(m.result?.currentEffRate) }}</div>
                </div>
                <div>
                  <div class="text-gray-500">Proposed ER</div>
                  <div class="font-semibold">{{ formatPercent(m.result?.proposedEffRate) }}</div>
                </div>
                <div class="col-span-2">
                  <div class="text-gray-500">Estimated Savings</div>
                  <div class="font-semibold">{{ formatDollars(m.result?.savingsDollars) }} ({{ formatPercent(m.result?.rateDelta) }})</div>
                </div>
                <div>
                  <div class="text-gray-500">Avg Ticket</div>
                  <div class="badge">{{ formatDollars(m.result?.avgTicket) }}</div>
                </div>
              </div>
            </div>
            <div *ngIf="m.type === 'advanced'">
              <div class="font-medium mb-1">Refined Savings</div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div class="text-gray-500">Current ER</div>
                  <div class="font-semibold">{{ formatPercent(m.adv?.currentEffRate) }}</div>
                </div>
                <div>
                  <div class="text-gray-500">Proposed ER</div>
                  <div class="font-semibold">{{ formatPercent(m.adv?.proposedEffRate) }}</div>
                </div>
                <div class="col-span-2">
                  <div class="text-gray-500">Savings</div>
                  <div class="font-semibold">{{ formatDollars(m.adv?.horizons?.monthly) }} monthly · {{ formatDollars(m.adv?.horizons?.annual) }} annual</div>
                </div>
                <div class="col-span-2" *ngIf="m.adv?.feeRecovery">
                  <div class="text-gray-500">Fee Recovery (90%)</div>
                  <div class="font-semibold">{{ formatDollars(m.adv?.feeRecovery?.monthly) }} monthly</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick replies / controls -->
      <div class="mt-3 flex flex-wrap gap-2" *ngIf="stage() === 'collect_basis'">
        <button class="btn btn-secondary" (click)="chooseBasis('monthly')">Monthly</button>
        <button class="btn btn-secondary" (click)="chooseBasis('annual')">Annual</button>
        <label class="btn btn-outline relative cursor-pointer">
          <input type="file" accept="application/pdf" (change)="onFileSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer" />
          Upload Statement (PDF)
        </label>
      </div>
      <div class="mt-3 flex flex-wrap gap-2" *ngIf="stage() === 'collect_mcc'">
        <button class="btn btn-secondary" (click)="setMccCategory('propane')">Propane</button>
        <button class="btn btn-secondary" (click)="setMccCategory('insurance')">Insurance</button>
        <button class="btn btn-secondary" (click)="setMccCategory('real_estate')">Real Estate</button>
        <button class="btn btn-secondary" (click)="setMccCategory('other')">Other</button>
      </div>

      <!-- Input bar -->
      <div class="mt-4 flex items-center gap-2">
        <input class="input w-full" type="text" [(ngModel)]="input" [placeholder]="placeholder()" (keydown.enter)="send()" />
        <button class="btn btn-primary" (click)="send()">Send</button>
      </div>
      <div class="text-xs text-error-600 mt-1" *ngIf="error()">{{ error() }}</div>
    </div>
  `,
  styles: []
})
export class ChatComponent {
  messages = signal<Array<{ role: 'user' | 'assistant'; type: 'text' | 'result' | 'advanced'; text?: string; result?: CalcResponse; adv?: AdvancedCalcResponse }>>([
    { role: 'assistant', type: 'text', text: 'Hi! Let’s estimate your credit card processing savings. Is your total volume and fees monthly or annual? You can also upload a statement PDF.' }
  ]);
  stage = signal<'collect_basis' | 'collect_volume' | 'collect_transactions' | 'collect_fees' | 'collect_mcc' | 'basic_done' | 'advanced_done'>('collect_basis');
  input = '';
  error = signal<string | null>(null);

  // Basic inputs
  basis: 'monthly' | 'annual' = 'monthly';
  volume = 0;
  transactions = 0;
  fees = 0;

  // MCC category for Quick Estimate
  mccCategory: 'propane' | 'insurance' | 'real_estate' | 'other' | undefined = undefined;
  perTxnFee = 0;
  monthlyFixedFees = 0;
  perCard: NonNullable<AdvancedCalcRequest['perCard']> = { visa: {}, mc: {}, discover: {}, amex: {} };

  constructor(private feesService: FeesService) {}

  placeholder(): string {
    switch (this.stage()) {
      case 'collect_volume': return 'Enter total volume (e.g., 250000)';
      case 'collect_transactions': return 'Enter total transactions (e.g., 1083)';
      case 'collect_fees': return 'Enter total fees (e.g., 6500)';
      // Advanced-only placeholders removed from primary flow
      default: return 'Type here…';
    }
  }

  pushAssistant(text: string) { this.messages.update((m) => [...m, { role: 'assistant', type: 'text', text }]); }
  pushUser(text: string) { this.messages.update((m) => [...m, { role: 'user', type: 'text', text }]); }

  chooseBasis(b: 'monthly' | 'annual') {
    this.basis = b;
    this.stage.set('collect_volume');
    this.pushUser(b === 'monthly' ? 'Monthly' : 'Annual');
    this.pushAssistant(`Great. What is your ${b} total card volume in dollars?`);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.error.set(null);
    this.pushUser(`Uploaded ${file.name}`);
    this.pushAssistant('Uploading and extracting totals…');
    this.feesService.uploadStatement(file).subscribe({
      next: r => {
        this.feesService.extract(r.fileId).subscribe({
          next: (ex: ExtractResponse) => {
            this.volume = ex.volume;
            this.transactions = ex.transactions;
            this.fees = ex.fees;
            this.pushAssistant(`I found Volume ${this.formatDollars(ex.volume)}, Fees ${this.formatDollars(ex.fees)}, Transactions ${ex.transactions.toLocaleString()}.`);
            this.stage.set('collect_mcc');
            this.pushAssistant('Before I calculate, which category best fits your business?');
            this.pushAssistant('Choose one: Propane, Insurance, Real Estate, or Other.');
          },
          error: () => this.error.set('Failed to extract totals from the PDF')
        });
      },
      error: () => this.error.set('Upload failed')
    });
  }

  send() {
    const text = this.input.trim();
    if (!text) return;
    this.pushUser(text);
    this.input = '';
    this.error.set(null);

    switch (this.stage()) {
      case 'collect_volume': {
        const v = this.toNumber(text);
        if (v <= 0) { this.error.set('Please enter a valid volume'); return; }
        this.volume = v;
        this.stage.set('collect_transactions');
        this.pushAssistant('How many transactions?');
        break;
      }
      case 'collect_transactions': {
        const n = Math.floor(this.toNumber(text));
        if (n <= 0) { this.error.set('Please enter a valid count'); return; }
        this.transactions = n;
        this.stage.set('collect_fees');
        this.pushAssistant('What were the total fees in dollars?');
        break;
      }
      case 'collect_fees': {
        const f = this.toNumber(text);
        if (f <= 0) { this.error.set('Please enter a valid fee amount'); return; }
        this.fees = f;
        // Before calculating, collect MCC category
        this.stage.set('collect_mcc');
        this.pushAssistant('Before I calculate, which category best fits your business?');
        this.pushAssistant('Choose one: Propane, Insurance, Real Estate, or Other.');
        break;
      }
      // Advanced-only steps removed from primary flow
      default:
        // For other stages we rely on buttons/quick replies
        break;
    }
  }

  calculateBasic() {
    this.feesService.calculate(this.volume, this.transactions, this.fees, this.mccCategory).subscribe({
      next: (r: CalcResponse) => {
        this.messages.update((m) => [...m, { role: 'assistant', type: 'result', result: r }]);
        this.stage.set('advanced_done');
        this.pushAssistant('If you give us 10 minutes of your time, we can narrow this down even further. Want to schedule a call here?');
      },
      error: () => this.error.set('Calculation failed')
    });
  }

  setMccCategory(cat: 'propane' | 'insurance' | 'real_estate' | 'other') {
    this.mccCategory = cat;
    this.pushUser(cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()));
    this.calculateBasic();
  }

  endSession() {
    this.pushAssistant('Thanks! If you want, you can upload a statement later or revisit for a refined estimate.');
    this.stage.set('advanced_done');
  }

  calculateAdvanced() {
    const payload: AdvancedCalcRequest = {
      basis: this.basis,
      totalVolume: this.volume,
      totalTransactions: this.transactions,
      totalFees: this.fees,
      mcc: undefined,
      monthlyFixedFees: this.monthlyFixedFees,
      perTxnFee: this.perTxnFee,
      perCard: this.perCard,
    };
    this.pushAssistant('Calculating refined savings…');
    this.feesService.calculateAdvanced(payload).subscribe({
      next: (adv: AdvancedCalcResponse) => {
        this.messages.update((m) => [...m, { role: 'assistant', type: 'advanced', adv }]);
        this.stage.set('advanced_done');
        this.pushAssistant('If you give us 10 minutes of your time, we can narrow this down even further. Want to schedule a call here?');
      },
      error: () => this.error.set('Advanced calculation failed')
    });
  }

  toNumber(s: string): number { return parseFloat(s.replace(/[$,\s]/g, '')); }

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
