import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  session_id?: string;
  source?: string;
  name?: string;
  email?: string;
  phone?: string;
  basis?: string;
  volume?: number;
  transactions?: number;
  fees?: number;
  mcc_category?: string;
  avg_ticket?: number;
  current_eff_rate?: number;
  proposed_eff_rate?: number;
  savings_dollars?: number;
  rate_delta?: number;
  transcript?: any;
}

@Injectable({ providedIn: 'root' })
export class LeadService {
  private readonly baseUrl = `${environment.apiUrl}/leads`;

  constructor(private http: HttpClient) {}

  start(sessionId: string | null, initial: any): Observable<{ success: boolean; data: { id: string } }> {
    return this.http.post<{ success: boolean; data: { id: string } }>(`${this.baseUrl}/start`, {
      sessionId,
      source: 'public_chat',
      initial
    });
  }

  update(id: string, payload: any): Observable<{ success: boolean; data: Lead }> {
    return this.http.patch<{ success: boolean; data: Lead }>(`${this.baseUrl}/${id}`, payload);
  }

  list(): Observable<Lead[]> {
    return this.http.get<{ success: boolean; data: Lead[] }>(`${this.baseUrl}`).pipe((r: any) => r);
  }
}


