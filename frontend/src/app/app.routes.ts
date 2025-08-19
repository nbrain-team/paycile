import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LayoutComponent } from './components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
      { path: 'policies', loadComponent: () => import('./pages/policies/policies.component').then(m => m.PoliciesComponent) },
      { path: 'policies/:id', loadComponent: () => import('./pages/policy-detail/policy-detail.component').then(m => m.PolicyDetailComponent) },
      { path: 'invoices', loadComponent: () => import('./pages/invoices/invoices.component').then(m => m.InvoicesComponent) },
      { path: 'payments', loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent) },
      { path: 'payments/:id', loadComponent: () => import('./pages/payment-detail/payment-detail.component').then(m => m.PaymentDetailComponent) },
      { path: 'reconciliation', loadComponent: () => import('./pages/reconciliation/reconciliation.component').then(m => m.ReconciliationComponent) },
      { path: 'clients', loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent) },
      { path: 'agents', loadComponent: () => import('./pages/agents/agents.component').then(m => m.AgentsComponent) },
      { path: 'insurance-companies', loadComponent: () => import('./pages/insurance-companies/insurance-companies.component').then(m => m.InsuranceCompaniesComponent) },
      { path: 'insights', loadComponent: () => import('./pages/insights/insights.component').then(m => m.InsightsComponent) },
      { path: 'fees-savings', loadComponent: () => import('./pages/fees-lead-magnet/fees-lead-magnet.component').then(m => m.FeesLeadMagnetComponent) },
      { path: 'cash-flow', loadComponent: () => import('./pages/cash-flow-calendar/cash-flow-calendar.component').then(m => m.CashFlowCalendarComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'chat', loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent) }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
]; 