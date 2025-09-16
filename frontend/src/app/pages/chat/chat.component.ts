import { Component, ElementRef, ViewChild, effect, signal } from '@angular/core';
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
      <div #scrollContainer class="card h-[60vh] overflow-y-auto p-4 space-y-4">
        <div *ngFor="let m of messages()" class="flex" [class.justify-end]="m.role === 'user'">
          <div [ngClass]="[m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900', (m.type === 'result' || m.type === 'advanced') ? 'w-3/4 max-w-none' : 'max-w-[85%]']" class="rounded-lg px-3 py-2 text-sm whitespace-pre-wrap">
            <div *ngIf="m.type === 'text'">{{ m.text }}</div>
            <div *ngIf="m.type === 'typing'" class="flex items-center gap-1 text-gray-500">
              <span class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></span>
              <span class="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></span>
              <span class="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></span>
            </div>
            <div *ngIf="m.type === 'result'">
              <div class="font-medium mb-1">Quick Estimate</div>
              <div class="text-sm text-gray-500 mb-3">
                Category: <span class="font-medium text-gray-700">{{ formatCategory(m.input?.mccCategory) }}</span>
                · Basis: <span class="font-medium text-gray-700">Yearly</span>
              </div>
              <div class="w-full">
                <div class="text-sm border border-gray-200 rounded-lg overflow-hidden w-full min-w-0">
                  <div class="grid grid-cols-4 bg-gray-50 text-gray-700 font-medium border-b border-gray-200 divide-x divide-gray-200">
                    <div class="px-4 py-3">&nbsp;</div>
                    <div class="px-4 py-3 text-center">Current</div>
                    <div class="px-4 py-3 text-center">Proposed</div>
                    <div class="px-4 py-3 text-center">% +/-</div>
                  </div>
                  <!-- Volume row (yearly) -->
                  <div class="grid grid-cols-4 items-center border-b border-gray-200 divide-x divide-gray-200">
                    <div class="px-4 py-3 text-gray-600">Volume</div>
                    <div class="px-4 py-3 text-center font-semibold">{{ formatDollars(yearlyVolume(m.input)) }}</div>
                    <div class="px-4 py-3 text-center font-semibold">{{ formatDollars(yearlyVolume(m.input)) }}</div>
                    <div class="px-4 py-3 text-center font-semibold">{{ formatPercent(0) }}</div>
                  </div>
                  <!-- Current ER row -->
                  <div class="grid grid-cols-4 items-center border-b border-gray-200 divide-x divide-gray-200">
                    <div class="px-4 py-3 text-gray-600">Current ER</div>
                    <div class="px-4 py-3 text-center font-semibold">{{ formatPercent(m.result?.currentEffRate) }}</div>
                    <div class="px-4 py-3 text-center font-semibold">{{ formatPercent(m.result?.proposedEffRate) }}</div>
                    <div class="px-4 py-3 text-center font-semibold">{{ formatPercent(m.result?.rateDelta) }}</div>
                  </div>
                  <!-- Fees row (yearly) -->
                  <div class="grid grid-cols-4 items-center divide-x divide-gray-200">
                    <div class="px-4 py-3 text-gray-600">Fees</div>
                    <div class="px-4 py-3 text-center font-semibold">{{ formatDollars(yearlyFees(m.input)) }}</div>
                    <div class="px-4 py-3 text-center font-semibold">{{ formatDollars(proposedFeesYearly(m.result, m.input)) }}</div>
                    <div class="px-4 py-3 text-center font-semibold">{{ formatPercent(percentChange(yearlyFees(m.input), proposedFeesYearly(m.result, m.input))) }}</div>
                  </div>
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
      </div>
      
      

      <!-- Input bar -->
      <div class="mt-4 flex items-center gap-2">
        <div class="relative w-full">
          <input class="input w-full" type="text" [(ngModel)]="input" [placeholder]="placeholder()" (keydown.enter)="send()" />
          <div *ngIf="stage() === 'collect_category' && filteredActiveCategories().length > 0" class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-soft max-h-60 overflow-auto">
            <div
              *ngFor="let c of filteredActiveCategories()"
              (click)="setMccCategory(c.name)"
              class="px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer"
            >
              {{ c.name }} <span class="text-gray-400">· {{ formatPercent(c.rate_percent) }}</span>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" (click)="send()">Send</button>
      </div>
      <div class="text-xs text-error-600 mt-1" *ngIf="error()">{{ error() }}</div>
    </div>
  `,
  styles: []
})
export class ChatComponent {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  messages = signal<Array<{ role: 'user' | 'assistant'; type: 'text' | 'typing' | 'result' | 'advanced'; text?: string; result?: CalcResponse; adv?: AdvancedCalcResponse; token?: string; input?: { basis: string; volume: number; transactions: number; fees: number; mccCategory?: string } }>>([
    { role: 'assistant', type: 'text', text: 'Hi! Let’s estimate your credit card processing savings. Is your total volume and fees monthly or annual?' }
  ]);
  stage = signal<'collect_basis' | 'collect_volume' | 'collect_transactions' | 'collect_fees' | 'collect_category' | 'processing_basic' | 'basic_done' | 'collect_name' | 'collect_contact' | 'finished' | 'advanced_done'>('collect_basis');
  input = '';
  error = signal<string | null>(null);

  // Basic inputs
  basis: 'monthly' | 'annual' = 'monthly';
  volume = 0;
  transactions = 0;
  fees = 0;

  // MCC category used to determine proposed ER via admin-configured categories
  mccCategory: string | undefined = undefined;
  categories = signal<Array<{ id: string; name: string; rate_percent: number; is_active: boolean }>>([]);
  perTxnFee = 0;
  monthlyFixedFees = 0;
  perCard: NonNullable<AdvancedCalcRequest['perCard']> = { visa: {}, mc: {}, discover: {}, amex: {} };

  constructor(private feesService: FeesService) {
    // Preload categories so they're available when needed
    this.feesService.listCategories().subscribe({
      next: (rows: any[]) => this.categories.set(rows || []),
      error: () => {
        // Silent fail; category step will still accept manual input
      }
    });
  }

  // Auto-scroll to bottom when messages change
  autoScroll = effect(() => {
    this.messages();
    queueMicrotask(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  });

  placeholder(): string {
    switch (this.stage()) {
      case 'collect_volume': return 'Enter total volume (e.g., 250000)';
      case 'collect_transactions': return 'Enter total transactions (e.g., 1083)';
      case 'collect_fees': return 'Enter total fees (e.g., 6500)';
      case 'collect_category': return 'Start typing to search categories (e.g., Insurance)';
      case 'collect_name': return 'Your first name';
      case 'collect_contact': return 'Your email or phone number';
      // Advanced-only placeholders removed from primary flow
      default: return 'Type here…';
    }
  }

  pushAssistant(text: string) { this.messages.update((m) => [...m, { role: 'assistant', type: 'text', text }]); }
  pushUser(text: string) { this.messages.update((m) => [...m, { role: 'user', type: 'text', text }]); }
  pushTyping() { 
    const token = Math.random().toString(36).slice(2);
    this.messages.update((m) => [...m, { role: 'assistant', type: 'typing', token }]);
    return () => this.messages.update((m) => m.filter(x => (x as any).token !== token));
  }
  async simulateTyping(ms = 900) {
    const stop = this.pushTyping();
    await new Promise<void>(res => setTimeout(res, ms));
    stop();
  }

  chooseBasis(b: 'monthly' | 'annual') {
    this.basis = b;
    this.stage.set('collect_volume');
    this.pushUser(b === 'monthly' ? 'Monthly' : 'Annual');
    this.pushAssistant(`Great. What is your ${b} total card volume in dollars?`);
  }

  // PDF upload removed

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
        // Ask for category next to refine proposed ER
        this.stage.set('collect_category');
        this.pushAssistant('Got it. What type of business are you? Choose a category for a more accurate proposed effective rate.');
        break;
      }
      case 'collect_category': {
        // Allow manual typing of category as fallback to buttons
        const cat = text.trim();
        if (!cat) { this.error.set('Please enter a valid category'); return; }
        this.setMccCategory(cat);
        break;
      }
      case 'collect_name': {
        const name = text.trim();
        if (!name) { this.error.set('Please share your name'); return; }
        const first = this.extractFirstName(name);
        this.simulateTyping(600).then(() => {
          this.pushAssistant(`Thanks ${first}! Can you provide me your email or phone number?`);
          this.stage.set('collect_contact');
        });
        break;
      }
      case 'collect_contact': {
        const contact = text.trim();
        if (!contact) { this.error.set('Please provide an email or phone number'); return; }
        const method = this.isEmail(contact) ? 'email' : (this.isPhone(contact) ? 'call' : 'reach out');
        this.simulateTyping(700).then(() => {
          const capital = method === 'email' ? 'Email' : method === 'call' ? 'Call' : 'Reach out';
          this.pushAssistant(`Great! I will ${capital} you shortly.`);
          this.stage.set('finished');
        });
        break;
      }
      // Advanced-only steps removed from primary flow
      default:
        // For other stages we rely on buttons/quick replies
        break;
    }
  }

  calculateBasic() {
    this.stage.set('processing_basic');
    let gotResult = false;
    let delayPassed = false;
    let cached: CalcResponse | null = null;
    const minDelayMs = 1100;

    const doneIfReady = () => {
      if (gotResult && delayPassed && cached) {
        this.messages.update((m) => m.filter(x => x.type !== 'typing'));
        this.messages.update((m) => [...m, { role: 'assistant', type: 'result', result: cached!, input: { basis: this.basis, volume: this.volume, transactions: this.transactions, fees: this.fees, mccCategory: this.mccCategory } }]);
        this.stage.set('basic_done');
        const savingsMsg = `Based on the information you provided, it looks like we have the potential to save you ${this.formatDollars(cached!.savingsDollars)}! If you have 10 minutes, we could get on a call and detail this out for you a little further and we can walk you through how easy it is to start getting these savings now.`;
        // Sequential assistant messages with typing delays
        (async () => {
          await this.simulateTyping(900);
          this.pushAssistant(savingsMsg);
          await this.simulateTyping(700);
          this.pushAssistant('If you are interested in chatting, first, can I ask you what your name is?');
          this.stage.set('collect_name');
        })();
      }
    };

    const stopTyping = this.pushTyping();
    setTimeout(() => { delayPassed = true; stopTyping(); doneIfReady(); }, minDelayMs);

    this.feesService.calculate(this.volume, this.transactions, this.fees, this.mccCategory).subscribe({
      next: (r: CalcResponse) => { cached = r; gotResult = true; doneIfReady(); },
      error: () => { stopTyping(); this.error.set('Calculation failed'); }
    });
  }

  setMccCategory(cat: string) {
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

  formatCategory(cat?: string): string {
    if (!cat) return '—';
    return cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Helpers for yearly normalization and comparisons
  yearlyVolume(input?: { basis?: string; volume?: number }): number {
    if (!input) return 0;
    const v = input.volume ?? 0;
    return (input.basis === 'annual' ? v : v * 12);
  }
  yearlyFees(input?: { basis?: string; fees?: number }): number {
    if (!input) return 0;
    const f = input.fees ?? 0;
    return (input.basis === 'annual' ? f : f * 12);
  }
  proposedFeesYearly(result?: CalcResponse | null, input?: { basis?: string; volume?: number }): number {
    if (!result || !input) return 0;
    const volumeYear = this.yearlyVolume(input);
    const proposedRateDecimal = (result.proposedEffRate ?? 0) / 100;
    return volumeYear * proposedRateDecimal;
  }
  percentChange(current: number, proposed: number): number {
    if (!current) return 0;
    return ((proposed - current) / current) * 100;
  }

  activeCategories() {
    return (this.categories() || []).filter(c => c.is_active);
  }

  filteredActiveCategories() {
    const q = this.input.trim().toLowerCase();
    const list = this.activeCategories();
    if (!q) return list.slice(0, 8);
    return list.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8);
  }

  extractFirstName(full: string): string {
    const parts = full.trim().split(/\s+/);
    return parts[0]?.replace(/[^A-Za-z'-]/g, '') || 'there';
  }

  isEmail(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  isPhone(v: string): boolean {
    const digits = v.replace(/\D/g, '');
    return digits.length >= 10;
  }
}
