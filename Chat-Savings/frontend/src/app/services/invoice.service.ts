import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Invoice, InvoiceFilters, InvoiceResponse, PaymentRequest } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/invoices`;
  private paymentsUrl = `${environment.apiUrl}/payments`;
  
  // Signal for loading state
  loading = signal<boolean>(false);
  
  constructor(private http: HttpClient) {}

  getInvoices(filters: InvoiceFilters = {}): Observable<InvoiceResponse> {
    this.loading.set(true);
    
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<InvoiceResponse>(this.apiUrl, { params }).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getInvoice(id: string): Observable<{ data: Invoice }> {
    this.loading.set(true);
    return this.http.get<{ data: Invoice }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  createInvoice(invoice: Partial<Invoice>): Observable<Invoice> {
    this.loading.set(true);
    return this.http.post<Invoice>(this.apiUrl, invoice).pipe(
      tap(() => this.loading.set(false))
    );
  }

  updateInvoice(id: string, invoice: Partial<Invoice>): Observable<Invoice> {
    this.loading.set(true);
    return this.http.put<Invoice>(`${this.apiUrl}/${id}`, invoice).pipe(
      tap(() => this.loading.set(false))
    );
  }

  processPayment(payment: PaymentRequest): Observable<{ data: { id: string } }> {
    this.loading.set(true);
    return this.http.post<{ data: { id: string } }>(this.paymentsUrl, payment).pipe(
      tap(() => this.loading.set(false))
    );
  }

  generateInvoice(policyId: string, billingPeriod: any): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/generate`, { 
      policyId, 
      ...billingPeriod 
    });
  }

  exportInvoices(format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }
} 