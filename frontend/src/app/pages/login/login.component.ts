import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {{ isRegisterMode() ? 'Create your account' : 'Sign in to your account' }}
          </h2>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <input type="hidden" name="remember" value="true">
          <div class="rounded-md shadow-sm -space-y-px">
            <div *ngIf="isRegisterMode()">
              <label for="name" class="sr-only">Name</label>
              <input
                id="name"
                formControlName="name"
                type="text"
                autocomplete="name"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
              >
            </div>
            
            <div>
              <label for="email-address" class="sr-only">Email address</label>
              <input
                id="email-address"
                formControlName="email"
                type="email"
                autocomplete="email"
                required
                [class]="getInputClass()"
                placeholder="Email address"
              >
            </div>
            
            <div class="relative">
              <label for="password" class="sr-only">Password</label>
              <input
                id="password"
                formControlName="password"
                [type]="showPassword() ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              >
              <button
                type="button"
                (click)="togglePassword()"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg *ngIf="!showPassword()" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg *ngIf="showPassword()" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            
            <div *ngIf="isRegisterMode()" class="mt-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Role</label>
                <select
                  formControlName="role"
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="broker">Broker</option>
                  <option value="agent">Agent</option>
                  <option value="client">Client</option>
                </select>
              </div>
              
              <div *ngIf="loginForm.get('role')?.value === 'agent'">
                <label class="block text-sm font-medium text-gray-700">Broker Code</label>
                <input
                  formControlName="brokerCode"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter broker code"
                >
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="loginForm.invalid || isLoading()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading() ? 'Processing...' : (isRegisterMode() ? 'Sign up' : 'Sign in') }}
            </button>
          </div>

          <div class="text-center">
            <button
              type="button"
              (click)="toggleMode()"
              class="font-medium text-primary-600 hover:text-primary-500"
            >
              {{ isRegisterMode() ? 'Already have an account? Sign in' : 'Need an account? Sign up' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = signal(false);
  isRegisterMode = signal(false);
  isLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      name: [''],
      role: ['broker'],
      brokerCode: ['']
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  toggleMode() {
    this.isRegisterMode.update(v => !v);
    if (this.isRegisterMode()) {
      this.loginForm.get('name')?.setValidators([Validators.required]);
    } else {
      this.loginForm.get('name')?.clearValidators();
    }
    this.loginForm.get('name')?.updateValueAndValidity();
  }

  getInputClass(): string {
    if (this.isRegisterMode()) {
      return 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm';
    }
    return 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm';
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    const formData = this.loginForm.value;

    const request = this.isRegisterMode()
      ? this.authService.register(formData)
      : this.authService.login(formData.email, formData.password);

    request.subscribe({
      next: () => {
        this.toastr.success(this.isRegisterMode() ? 'Account created successfully!' : 'Logged in successfully!');
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.toastr.error(error.error?.message || 'An error occurred');
        this.isLoading.set(false);
      }
    });
  }
} 