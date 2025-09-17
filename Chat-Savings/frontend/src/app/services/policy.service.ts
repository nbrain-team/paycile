import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Policy, PolicyFilters, PolicyResponse } from '../models/policy.model';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  private apiUrl = `${environment.apiUrl}/policies`;
  
  // Signal for loading state
  loading = signal<boolean>(false);
  
  constructor(private http: HttpClient) {}

  getPolicies(filters: PolicyFilters = {}): Observable<PolicyResponse> {
    this.loading.set(true);
    
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PolicyResponse>(this.apiUrl, { params }).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getPolicy(id: string): Observable<{ data: Policy }> {
    this.loading.set(true);
    return this.http.get<{ data: Policy }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  createPolicy(policy: Partial<Policy>): Observable<{ data: Policy }> {
    this.loading.set(true);
    return this.http.post<{ data: Policy }>(this.apiUrl, policy).pipe(
      tap(() => this.loading.set(false))
    );
  }

  updatePolicy(id: string, policy: Partial<Policy>): Observable<{ data: Policy }> {
    this.loading.set(true);
    return this.http.put<{ data: Policy }>(`${this.apiUrl}/${id}`, policy).pipe(
      tap(() => this.loading.set(false))
    );
  }

  deletePolicy(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  exportPolicies(format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }
} 