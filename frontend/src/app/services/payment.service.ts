import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Payment, PaymentFilters, PaymentResponse, Reconciliation, ReconciliationResponse } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;
  private reconciliationUrl = `${environment.apiUrl}/reconciliations`;
  
  // Signal for loading state
  loading = signal<boolean>(false);
  
  constructor(private http: HttpClient) {}

  getPayments(filters: PaymentFilters = {}): Observable<PaymentResponse> {
    this.loading.set(true);
    
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<PaymentResponse>(this.apiUrl, { params }).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getPayment(id: string): Observable<{ data: Payment }> {
    this.loading.set(true);
    return this.http.get<{ data: Payment }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  createPayment(payment: Partial<Payment>): Observable<{ data: Payment }> {
    this.loading.set(true);
    return this.http.post<{ data: Payment }>(this.apiUrl, payment).pipe(
      tap(() => this.loading.set(false))
    );
  }

  updatePayment(id: string, payment: Partial<Payment>): Observable<Payment> {
    this.loading.set(true);
    return this.http.put<Payment>(`${this.apiUrl}/${id}`, payment).pipe(
      tap(() => this.loading.set(false))
    );
  }

  deletePayment(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getReconciliations(): Observable<ReconciliationResponse> {
    return this.http.get<ReconciliationResponse>(this.reconciliationUrl);
  }

  createReconciliation(paymentId: string, invoiceId: string): Observable<Reconciliation> {
    return this.http.post<Reconciliation>(this.reconciliationUrl, {
      paymentId,
      invoiceId
    });
  }

  updateReconciliation(id: string, data: Partial<Reconciliation>): Observable<Reconciliation> {
    return this.http.put<Reconciliation>(`${this.reconciliationUrl}/${id}`, data);
  }

  exportPayments(format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }

  // Get payment allocations (waterfall breakdown)
  getPaymentAllocations(id: string): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(`${this.apiUrl}/${id}/allocations`);
  }
} 