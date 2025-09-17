import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ExtractResponse {
  volume: number;
  transactions: number;
  fees: number;
  sources: { page: number; text: string }[];
}

export interface CalcResponse {
  avgTicket: number;
  currentEffRate: number;
  proposedEffRate: number;
  savingsDollars: number;
  rateDelta: number;
}

export interface AdvancedCalcRequest {
  basis: 'monthly' | 'annual';
  totalVolume: number;
  totalTransactions: number;
  totalFees: number;
  mcc?: string;
  monthlyFixedFees?: number;
  perTxnFee?: number;
  perCard?: {
    visa?: { volume?: number; transactions?: number };
    mc?: { volume?: number; transactions?: number };
    discover?: { volume?: number; transactions?: number };
    amex?: { volume?: number; transactions?: number };
  };
}

export interface AdvancedCalcResponse extends CalcResponse {
  horizons: {
    monthly: number;
    annual: number;
    threeYear: number;
    fiveYear: number;
  };
  feeRecovery: {
    monthly: number;
    annual: number;
    threeYear: number;
    fiveYear: number;
  };
  assumptions: any;
}

@Injectable({ providedIn: 'root' })
export class FeesService {
  private readonly baseUrl = `${environment.apiUrl}/fees`;

  constructor(private http: HttpClient) {}

  // Upload/extract kept for other pages (e.g., Fees Lead Magnet)
  uploadStatement(file: File): Observable<{ fileId: string; filename: string; size: number }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ fileId: string; filename: string; size: number }>(`${this.baseUrl}/upload`, form);
  }

  extract(fileId: string): Observable<ExtractResponse> {
    return this.http.post<ExtractResponse>(`${this.baseUrl}/extract`, { fileId });
  }

  calculate(volume: number, transactions: number, fees: number, mccCategory?: string): Observable<CalcResponse> {
    const payload: any = { volume, transactions, fees };
    if (mccCategory) payload.mccCategory = mccCategory;
    return this.http.post<CalcResponse>(`${this.baseUrl}/calc`, payload);
  }

  calculateAdvanced(payload: AdvancedCalcRequest): Observable<AdvancedCalcResponse> {
    return this.http.post<AdvancedCalcResponse>(`${this.baseUrl}/calc-advanced`, payload);
  }

  // Category rates (admin)
  listCategories(): Observable<Array<{ id: string; name: string; rate_percent: number; is_active: boolean }>> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.baseUrl}/categories`).pipe(map(r => r.data));
  }

  saveCategory(payload: { name: string; ratePercent: number; isActive?: boolean; id?: string }): Observable<any> {
    if (payload.id) {
      return this.http.put(`${this.baseUrl}/categories/${payload.id}`, payload);
    }
    return this.http.post(`${this.baseUrl}/categories`, payload);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/categories/${id}`);
  }

  uploadCategoriesCsv(file: File): Observable<{ upserted: number }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ success: boolean; data: { upserted: number } }>(`${this.baseUrl}/categories/upload-csv`, form).pipe(map(r => r.data));
  }
}


