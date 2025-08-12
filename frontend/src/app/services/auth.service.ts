import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'broker' | 'agent' | 'client' | 'admin';
  agentId?: string;
  brokerId?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'broker' | 'agent' | 'client';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  
  // Using Angular signals for reactive state
  private userSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);
  
  // Public readonly signals
  user = this.userSignal.asReadonly();
  isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuth();
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this.handleAuthSuccess(response);
        }),
        map(response => response.user)
      );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      map(response => response.user)
    );
  }

  loginAsDemo(role: 'agent' | 'client'): Observable<User> {
    const credentials = role === 'agent' 
      ? { email: 'agent@demo.com', password: 'demo123' }
      : { email: 'client@demo.com', password: 'demo123' };
    
    return this.login(credentials.email, credentials.password);
  }

  logout(): void {
    this.userSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  checkAuth(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userSignal.set(user);
        this.isAuthenticatedSignal.set(true);
      } catch (error) {
        this.logout();
      }
    } else {
      this.isAuthenticatedSignal.set(false);
    }
  }

  private handleAuthSuccess(response: LoginResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.userSignal.set(response.user);
    this.isAuthenticatedSignal.set(true);
  }
} 