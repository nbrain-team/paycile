import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-public-savings-chat',
  standalone: true,
  imports: [CommonModule, ChatComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <header class="w-full border-b border-gray-200 bg-white">
        <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="assets/paycile-logo.png" alt="Paycile" class="h-8 w-auto">
            <span class="sr-only">Paycile</span>
          </div>
          <nav class="text-sm">
            <a href="/login" class="text-primary-600 hover:text-primary-700">Sign in</a>
          </nav>
        </div>
      </header>

      <main class="flex-1">
        <section class="max-w-4xl mx-auto px-4 py-8">
          <div class="mb-6">
            <h1 class="text-3xl font-semibold text-gray-900">Find Your Credit Card Processing Savings</h1>
            <p class="mt-2 text-gray-600">No login required. Answer a few quick questions to estimate your potential savings.</p>
          </div>
          <app-chat></app-chat>
        </section>
      </main>
    </div>
  `,
  styles: []
})
export class PublicSavingsChatComponent {}


