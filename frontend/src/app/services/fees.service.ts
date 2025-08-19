import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class FeesService {
  private readonly baseUrl = `${environment.apiUrl}/fees`;

  constructor(private http: HttpClient) {}

  uploadStatement(file: File): Observable<{ fileId: string; filename: string; size: number }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ fileId: string; filename: string; size: number }>(`${this.baseUrl}/upload`, form);
  }

  extract(fileId: string): Observable<ExtractResponse> {
    return this.http.post<ExtractResponse>(`${this.baseUrl}/extract`, { fileId });
  }

  calculate(volume: number, transactions: number, fees: number): Observable<CalcResponse> {
    return this.http.post<CalcResponse>(`${this.baseUrl}/calc`, { volume, transactions, fees });
  }
}


