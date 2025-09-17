import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  Reconciliation, 
  ReconciliationFilters, 
  ReconciliationResponse, 
  ReconciliationStats 
} from '../models/reconciliation.model';

@Injectable({
  providedIn: 'root'
})
export class ReconciliationService {
  private apiUrl = `${environment.apiUrl}/reconciliations`;
  
  // Signal for loading state
  loading = signal<boolean>(false);
  
  constructor(private http: HttpClient) {}

  getReconciliations(filters: ReconciliationFilters = {}): Observable<ReconciliationResponse> {
    this.loading.set(true);
    
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<ReconciliationResponse>(this.apiUrl, { params }).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getReconciliation(id: string): Observable<{ data: Reconciliation }> {
    this.loading.set(true);
    return this.http.get<{ data: Reconciliation }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getStats(): Observable<{ data: ReconciliationStats }> {
    return this.http.get<{ data: ReconciliationStats }>(`${this.apiUrl}/stats`);
  }

  // AI-powered reconciliation
  runAIReconciliation(): Observable<{ data: any }> {
    this.loading.set(true);
    return this.http.post<{ data: any }>(`${this.apiUrl}/run-ai`, {}).pipe(
      tap(() => this.loading.set(false))
    );
  }

  // Accept AI suggestion
  acceptSuggestion(reconciliationId: string, invoiceId: string): Observable<{ data: Reconciliation }> {
    this.loading.set(true);
    return this.http.post<{ data: Reconciliation }>(
      `${this.apiUrl}/${reconciliationId}/accept-suggestion`,
      { invoiceId }
    ).pipe(
      tap(() => this.loading.set(false))
    );
  }

  // Manual match
  manualMatch(paymentId: string, invoiceId: string): Observable<{ data: Reconciliation }> {
    this.loading.set(true);
    return this.http.post<{ data: Reconciliation }>(
      `${this.apiUrl}/manual-match`,
      { paymentId, invoiceId }
    ).pipe(
      tap(() => this.loading.set(false))
    );
  }

  // Dispute reconciliation
  disputeReconciliation(reconciliationId: string, notes: string): Observable<{ data: Reconciliation }> {
    this.loading.set(true);
    return this.http.post<{ data: Reconciliation }>(
      `${this.apiUrl}/${reconciliationId}/dispute`,
      { notes }
    ).pipe(
      tap(() => this.loading.set(false))
    );
  }

  // Resolve dispute
  resolveDispute(reconciliationId: string, notes: string): Observable<{ data: Reconciliation }> {
    this.loading.set(true);
    return this.http.post<{ data: Reconciliation }>(
      `${this.apiUrl}/${reconciliationId}/resolve-dispute`,
      { notes }
    ).pipe(
      tap(() => this.loading.set(false))
    );
  }

  // Delete reconciliation
  deleteReconciliation(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  // Export reconciliations
  exportReconciliations(format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }
} 