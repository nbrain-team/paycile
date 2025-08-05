import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'policies',
        loadComponent: () => import('./pages/policies/policies.component').then(m => m.PoliciesComponent)
      },
      {
        path: 'policies/:id',
        loadComponent: () => import('./pages/policy-detail/policy-detail.component').then(m => m.PolicyDetailComponent)
      },
      {
        path: 'invoices',
        loadComponent: () => import('./pages/invoices/invoices.component').then(m => m.InvoicesComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'payments/:id',
        loadComponent: () => import('./pages/payment-detail/payment-detail.component').then(m => m.PaymentDetailComponent)
      },
      {
        path: 'reconciliation',
        loadComponent: () => import('./pages/reconciliation/reconciliation.component').then(m => m.ReconciliationComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent)
      },
      {
        path: 'agents',
        loadComponent: () => import('./pages/agents/agents.component').then(m => m.AgentsComponent)
      },
      {
        path: 'insurance-companies',
        loadComponent: () => import('./pages/insurance-companies/insurance-companies.component').then(m => m.InsuranceCompaniesComponent)
      },
      {
        path: 'insights',
        loadComponent: () => import('./pages/insights/insights.component').then(m => m.InsightsComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
]; 