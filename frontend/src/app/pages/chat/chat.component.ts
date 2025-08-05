import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-semibold text-gray-900">Chat Page</h1>
      <p class="text-gray-600">This page is under construction.</p>
    </div>
  `,
  styles: []
})
export class ChatComponent {}
