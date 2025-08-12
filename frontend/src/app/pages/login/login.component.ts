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
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <img 
          src="/paycile-logo.png" 
          alt="Paycile" 
          class="mx-auto h-16 w-auto"
        >
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ isRegisterMode() ? 'Create broker account' : 'Sign in to your account' }}
        </h2>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-soft sm:rounded-lg sm:px-10">
          <!-- Tabs -->
          <div class="flex mb-6 border-b">
            <button
              type="button"
              [class]="!isRegisterMode() ? 
                'flex-1 pb-2 text-sm font-medium border-b-2 border-primary-500 text-primary-600' : 
                'flex-1 pb-2 text-sm font-medium text-gray-500 hover:text-gray-700'"
              (click)="toggleMode()"
            >
              Sign In
            </button>
            <button
              type="button"
              [class]="isRegisterMode() ? 
                'flex-1 pb-2 text-sm font-medium border-b-2 border-primary-500 text-primary-600' : 
                'flex-1 pb-2 text-sm font-medium text-gray-500 hover:text-gray-700'"
              (click)="toggleMode()"
            >
              Broker Sign Up
            </button>
          </div>

          <!-- Login Form -->
          <form *ngIf="!isRegisterMode()" [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-6">
            <div>
              <label for="email" class="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                class="input"
                [class.border-error-500]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              >
              <p *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" 
                 class="mt-1 text-sm text-error-600">
                {{ getErrorMessage('email', 'login') }}
              </p>
            </div>

            <div>
              <label for="password" class="label">
                Password
              </label>
              <div class="relative">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                  class="input pr-10"
                  [class.border-error-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                >
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  (click)="togglePassword()"
                >
                  <svg *ngIf="showPassword()" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="!showPassword()" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <p *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" 
                 class="mt-1 text-sm text-error-600">
                {{ getErrorMessage('password', 'login') }}
              </p>
            </div>

            <div>
              <button
                type="submit"
                [disabled]="isLoading() || loginForm.invalid"
                class="w-full btn-primary btn-md"
              >
                <span *ngIf="!isLoading()">Sign in</span>
                <span *ngIf="isLoading()" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              </button>
            </div>
          </form>

          <!-- Register Form -->
          <form *ngIf="isRegisterMode()" [formGroup]="registerForm" (ngSubmit)="onRegister()" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="label">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  formControlName="firstName"
                  autocomplete="given-name"
                  class="input"
                  [class.border-error-500]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched"
                >
                <p *ngIf="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched" 
                   class="mt-1 text-sm text-error-600">
                  {{ getErrorMessage('firstName', 'register') }}
                </p>
              </div>

              <div>
                <label for="lastName" class="label">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  autocomplete="family-name"
                  class="input"
                  [class.border-error-500]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched"
                >
                <p *ngIf="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched" 
                   class="mt-1 text-sm text-error-600">
                  {{ getErrorMessage('lastName', 'register') }}
                </p>
              </div>
            </div>

            <div>
              <label for="companyName" class="label">
                Company name
              </label>
              <input
                id="companyName"
                type="text"
                formControlName="companyName"
                autocomplete="organization"
                class="input"
                [class.border-error-500]="registerForm.get('companyName')?.invalid && registerForm.get('companyName')?.touched"
              >
              <p *ngIf="registerForm.get('companyName')?.invalid && registerForm.get('companyName')?.touched" 
                 class="mt-1 text-sm text-error-600">
                {{ getErrorMessage('companyName', 'register') }}
              </p>
            </div>

            <div>
              <label for="registerEmail" class="label">
                Email address
              </label>
              <input
                id="registerEmail"
                type="email"
                formControlName="email"
                autocomplete="email"
                class="input"
                [class.border-error-500]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
              >
              <p *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" 
                 class="mt-1 text-sm text-error-600">
                {{ getErrorMessage('email', 'register') }}
              </p>
            </div>

            <div>
              <label for="registerPassword" class="label">
                Password
              </label>
              <div class="relative">
                <input
                  id="registerPassword"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="new-password"
                  class="input pr-10"
                  [class.border-error-500]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
                >
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  (click)="togglePassword()"
                >
                  <svg *ngIf="showPassword()" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="!showPassword()" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <p class="mt-2 text-sm text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number and special character
              </p>
              <p *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" 
                 class="mt-1 text-sm text-error-600">
                {{ getErrorMessage('password', 'register') }}
              </p>
            </div>

            <div>
              <button
                type="submit"
                [disabled]="isLoading() || registerForm.invalid"
                class="w-full btn-primary btn-md"
              >
                <span *ngIf="!isLoading()">Create account</span>
                <span *ngIf="isLoading()" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              </button>
            </div>
          </form>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Demo accounts</span>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <button
                type="button"
                (click)="loginAsDemo('agent')"
                [disabled]="isLoading()"
                class="w-full btn-secondary btn-md"
              >
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sign in as Agent
              </button>
              <button
                type="button"
                (click)="loginAsDemo('client')"
                [disabled]="isLoading()"
                class="w-full btn-outline btn-md"
              >
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Sign in as Client
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  showPassword = signal(false);
  isRegisterMode = signal(false);
  isLoading = signal(false);
  user = this.authService.user;
  
  private passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      companyName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(this.passwordPattern)]],
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  toggleMode() {
    this.isRegisterMode.update(v => !v);
    if (this.isRegisterMode()) {
      this.loginForm.get('email')?.setValidators([Validators.required, Validators.email]);
      this.loginForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.registerForm.get('firstName')?.setValidators([Validators.required]);
      this.registerForm.get('lastName')?.setValidators([Validators.required]);
      this.registerForm.get('companyName')?.setValidators([Validators.required]);
      this.registerForm.get('password')?.setValidators([Validators.required, Validators.minLength(8), Validators.pattern(this.passwordPattern)]);
    } else {
      this.loginForm.get('email')?.clearValidators();
      this.loginForm.get('password')?.clearValidators();
      this.registerForm.get('firstName')?.clearValidators();
      this.registerForm.get('lastName')?.clearValidators();
      this.registerForm.get('companyName')?.clearValidators();
      this.registerForm.get('password')?.clearValidators();
    }
    this.loginForm.get('email')?.updateValueAndValidity();
    this.loginForm.get('password')?.updateValueAndValidity();
    this.registerForm.get('firstName')?.updateValueAndValidity();
    this.registerForm.get('lastName')?.updateValueAndValidity();
    this.registerForm.get('companyName')?.updateValueAndValidity();
    this.registerForm.get('password')?.updateValueAndValidity();
  }

  getErrorMessage(field: string, formType: 'login' | 'register') {
    const form = formType === 'login' ? this.loginForm : this.registerForm;
    const control = form.get(field);

    if (control?.hasError('required')) {
      return `${field} is required`;
    }
    if (control?.hasError('email')) {
      return 'Invalid email address';
    }
    if (control?.hasError('minlength')) {
      return `${field} must be at least 6 characters`;
    }
    if (control?.hasError('minlength', 'register')) {
      return `${field} must be at least 8 characters`;
    }
    if (control?.hasError('pattern', 'register')) {
      return `${field} must contain uppercase, lowercase, number and special character`;
    }
    return '';
  }

  onLogin() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    const formData = this.loginForm.value;

    this.authService.login(formData.email, formData.password).subscribe({
      next: () => {
        this.toastr.success('Logged in successfully!');
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.toastr.error(error.error?.message || 'An error occurred');
        this.isLoading.set(false);
      }
    });
  }

  onRegister() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
      next: () => {
        this.toastr.success('Account created successfully!');
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.toastr.error(error.error?.message || 'An error occurred');
        this.isLoading.set(false);
      }
    });
  }

  loginAsDemo(role: 'agent' | 'client') {
    this.isLoading.set(true);
    this.authService.loginAsDemo(role).subscribe({
      next: () => {
        this.toastr.success(`Signed in as ${role.charAt(0).toUpperCase() + role.slice(1)} successfully!`);
        this.router.navigate(['/']);
      },
      error: (error: any) => {
        this.toastr.error(error.error?.message || 'An error occurred');
        this.isLoading.set(false);
      }
    });
  }
} 