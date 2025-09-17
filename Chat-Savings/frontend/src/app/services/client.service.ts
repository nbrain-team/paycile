import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Client, ClientFilters, ClientResponse, ClientStats } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/users`;
  
  // Signal for loading state
  loading = signal<boolean>(false);
  
  constructor(private http: HttpClient) {}

  getClients(filters: ClientFilters = {}): Observable<ClientResponse> {
    this.loading.set(true);
    
    let params = new HttpParams();
    params = params.set('role', 'client'); // Always filter for clients
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    if (filters.agentId) params = params.set('agentId', filters.agentId);
    if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());

    return this.http.get<ClientResponse>(this.apiUrl, { params }).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getClient(id: string): Observable<{ data: Client }> {
    this.loading.set(true);
    return this.http.get<{ data: Client }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  createClient(client: Partial<Client>): Observable<{ data: Client }> {
    this.loading.set(true);
    return this.http.post<{ data: Client }>(this.apiUrl, { ...client, role: 'client' }).pipe(
      tap(() => this.loading.set(false))
    );
  }

  updateClient(id: string, client: Partial<Client>): Observable<{ data: Client }> {
    this.loading.set(true);
    return this.http.put<{ data: Client }>(`${this.apiUrl}/${id}`, client).pipe(
      tap(() => this.loading.set(false))
    );
  }

  deleteClient(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getClientStats(): Observable<{ data: ClientStats }> {
    return this.http.get<{ data: ClientStats }>(`${this.apiUrl}/stats/clients`);
  }

  // Bulk operations
  importClients(file: File): Observable<{ data: { imported: number; failed: number } }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ data: { imported: number; failed: number } }>(
      `${this.apiUrl}/import`,
      formData
    );
  }

  exportClients(format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: { format, role: 'client' },
      responseType: 'blob'
    });
  }

  // Send message to client
  sendMessage(clientId: string, message: { subject: string; body: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${clientId}/message`, message);
  }

  // Get client activity
  getClientActivity(clientId: string): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${clientId}/activity`);
  }
} 