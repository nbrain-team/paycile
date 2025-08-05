import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="containerClass">
      <div class="inline-flex items-center">
        <svg 
          [ngClass]="spinnerClass"
          class="animate-spin" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span *ngIf="message" [ngClass]="messageClass">{{ message }}</span>
      </div>
    </div>
  `,
  styles: [`
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() color: 'primary' | 'white' | 'gray' | 'green' | 'red' | 'blue' = 'primary';
  @Input() message?: string;
  @Input() fullScreen = false;
  @Input() overlay = false;

  get containerClass(): string {
    const classes = [];
    
    if (this.fullScreen) {
      classes.push('fixed inset-0 flex items-center justify-center');
    } else if (this.overlay) {
      classes.push('absolute inset-0 flex items-center justify-center');
    } else {
      classes.push('flex items-center justify-center');
    }
    
    if (this.overlay || this.fullScreen) {
      classes.push('bg-white bg-opacity-75 z-50');
    }
    
    return classes.join(' ');
  }

  get spinnerClass(): string {
    const classes = [];
    
    // Size classes
    switch (this.size) {
      case 'sm':
        classes.push('h-4 w-4');
        break;
      case 'md':
        classes.push('h-6 w-6');
        break;
      case 'lg':
        classes.push('h-8 w-8');
        break;
      case 'xl':
        classes.push('h-12 w-12');
        break;
    }
    
    // Color classes
    switch (this.color) {
      case 'primary':
        classes.push('text-primary-600');
        break;
      case 'white':
        classes.push('text-white');
        break;
      case 'gray':
        classes.push('text-gray-600');
        break;
      case 'green':
        classes.push('text-green-600');
        break;
      case 'red':
        classes.push('text-red-600');
        break;
      case 'blue':
        classes.push('text-blue-600');
        break;
    }
    
    if (this.message) {
      classes.push('mr-3');
    }
    
    return classes.join(' ');
  }

  get messageClass(): string {
    const classes = [];
    
    // Size-based text classes
    switch (this.size) {
      case 'sm':
        classes.push('text-sm');
        break;
      case 'md':
        classes.push('text-base');
        break;
      case 'lg':
        classes.push('text-lg');
        break;
      case 'xl':
        classes.push('text-xl');
        break;
    }
    
    // Color classes for text
    switch (this.color) {
      case 'primary':
        classes.push('text-gray-700');
        break;
      case 'white':
        classes.push('text-white');
        break;
      case 'gray':
        classes.push('text-gray-700');
        break;
      case 'green':
        classes.push('text-green-700');
        break;
      case 'red':
        classes.push('text-red-700');
        break;
      case 'blue':
        classes.push('text-blue-700');
        break;
    }
    
    return classes.join(' ');
  }
} 