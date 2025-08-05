import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  InsuranceCompany,
  InsuranceCompanyFilters,
  InsuranceCompanyResponse,
  InsuranceCompanyStats,
  CreateInsuranceCompanyRequest,
  UpdateInsuranceCompanyRequest
} from '../models/insurance-company.model';

@Injectable({
  providedIn: 'root'
})
export class InsuranceCompanyService {
  private apiUrl = `${environment.apiUrl}/insurance-companies`;
  
  // Signal for loading state
  loading = signal<boolean>(false);
  
  constructor(private http: HttpClient) {}

  getInsuranceCompanies(filters: InsuranceCompanyFilters = {}): Observable<InsuranceCompanyResponse> {
    this.loading.set(true);
    
    let params = new HttpParams();
    if (filters.brokerId) params = params.set('brokerId', filters.brokerId);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<InsuranceCompanyResponse>(this.apiUrl, { params }).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getInsuranceCompany(id: string): Observable<{ success: boolean; data: InsuranceCompany }> {
    this.loading.set(true);
    return this.http.get<{ success: boolean; data: InsuranceCompany }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  createInsuranceCompany(company: CreateInsuranceCompanyRequest): Observable<{ success: boolean; data: InsuranceCompany; message: string }> {
    this.loading.set(true);
    return this.http.post<{ success: boolean; data: InsuranceCompany; message: string }>(this.apiUrl, company).pipe(
      tap(() => this.loading.set(false))
    );
  }

  updateInsuranceCompany(id: string, company: UpdateInsuranceCompanyRequest): Observable<{ success: boolean; data: InsuranceCompany }> {
    this.loading.set(true);
    return this.http.put<{ success: boolean; data: InsuranceCompany }>(`${this.apiUrl}/${id}`, company).pipe(
      tap(() => this.loading.set(false))
    );
  }

  deleteInsuranceCompany(id: string): Observable<{ success: boolean; message: string }> {
    this.loading.set(true);
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  toggleStatus(id: string, isActive: boolean): Observable<{ success: boolean; data: InsuranceCompany }> {
    return this.updateInsuranceCompany(id, { isActive });
  }

  getStats(companies: InsuranceCompany[]): InsuranceCompanyStats {
    const activeCompanies = companies.filter(c => c.isActive).length;
    const averageCommissionRate = companies.length > 0
      ? companies.reduce((sum, c) => sum + c.commissionRate, 0) / companies.length
      : 0;
    
    const allPolicyTypes = new Set<string>();
    companies.forEach(c => {
      c.policyTypes.forEach(type => allPolicyTypes.add(type));
    });

    return {
      totalCompanies: companies.length,
      activeCompanies,
      averageCommissionRate,
      totalPolicyTypes: allPolicyTypes.size
    };
  }

  exportCompanies(format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }
} 