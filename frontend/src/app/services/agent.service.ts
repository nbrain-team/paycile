import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Agent, AgentFilters, AgentResponse, AgentStats, AgentPerformance } from '../models/agent.model';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private apiUrl = `${environment.apiUrl}/users`;
  
  // Signal for loading state
  loading = signal<boolean>(false);
  
  constructor(private http: HttpClient) {}

  getAgents(filters: AgentFilters = {}): Observable<AgentResponse> {
    this.loading.set(true);
    
    let params = new HttpParams();
    params = params.set('role', 'agent'); // Always filter for agents
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    if (filters.brokerId) params = params.set('brokerId', filters.brokerId);
    if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
    if (filters.department) params = params.set('department', filters.department);

    return this.http.get<AgentResponse>(this.apiUrl, { params }).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getAgent(id: string): Observable<{ data: Agent }> {
    this.loading.set(true);
    return this.http.get<{ data: Agent }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  createAgent(agent: Partial<Agent>, brokerId?: string): Observable<{ data: Agent }> {
    this.loading.set(true);
    const agentData = {
      ...agent,
      role: 'agent',
      brokerId: brokerId || agent.brokerId
    };
    
    return this.http.post<{ data: Agent }>(`${this.apiUrl}/agents`, agentData).pipe(
      tap(() => this.loading.set(false))
    );
  }

  updateAgent(id: string, agent: Partial<Agent>): Observable<{ data: Agent }> {
    this.loading.set(true);
    return this.http.put<{ data: Agent }>(`${this.apiUrl}/${id}`, agent).pipe(
      tap(() => this.loading.set(false))
    );
  }

  toggleAgentStatus(id: string, isActive: boolean): Observable<{ data: Agent }> {
    this.loading.set(true);
    return this.http.patch<{ data: Agent }>(`${this.apiUrl}/${id}/status`, { isActive }).pipe(
      tap(() => this.loading.set(false))
    );
  }

  deleteAgent(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getAgentStats(): Observable<{ data: AgentStats }> {
    return this.http.get<{ data: AgentStats }>(`${this.apiUrl}/stats/agents`);
  }

  getAgentPerformance(agentId: string, period: string = 'monthly'): Observable<{ data: AgentPerformance }> {
    return this.http.get<{ data: AgentPerformance }>(`${this.apiUrl}/${agentId}/performance`, {
      params: { period }
    });
  }

  // Assign clients to agent
  assignClients(agentId: string, clientIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${agentId}/assign-clients`, { clientIds });
  }

  // Get agent's clients
  getAgentClients(agentId: string): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${agentId}/clients`);
  }

  // Get agent's policies
  getAgentPolicies(agentId: string): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${agentId}/policies`);
  }

  // Export agents data
  exportAgents(format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: { format, role: 'agent' },
      responseType: 'blob'
    });
  }

  // Send notification to agent
  sendNotification(agentId: string, notification: { title: string; message: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${agentId}/notify`, notification);
  }

  // Get departments list
  getDepartments(): Observable<{ data: string[] }> {
    return this.http.get<{ data: string[] }>(`${this.apiUrl}/departments`);
  }
} 