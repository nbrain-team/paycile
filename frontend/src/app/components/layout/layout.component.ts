import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Sidebar -->
      <div class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-soft">
        <div class="flex h-full flex-col">
          <!-- Logo -->
          <div class="flex h-16 items-center justify-center border-b border-gray-200 px-4">
            <img 
              src="assets/paycile-logo.png" 
              alt="Paycile" 
              class="h-10 w-auto"
            >
          </div>

          <!-- Navigation -->
          <nav class="flex-1 space-y-1 px-2 py-4">
            <a
              *ngFor="let item of navigation()"
              [routerLink]="item.href"
              routerLinkActive="bg-primary-50 text-primary-600"
              [routerLinkActiveOptions]="{exact: item.href === '/'}"
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 hover:text-gray-900 text-gray-600"
            >
              <span class="mr-3 h-6 w-6" [innerHTML]="item.icon"></span>
              {{ item.name }}
            </a>
          </nav>

          <!-- User Info -->
          <div class="border-t border-gray-200 p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span class="text-primary-600 font-medium text-sm">
                    {{ userInitials() }}
                  </span>
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-700">{{ user()?.name }}</p>
                <p class="text-xs text-gray-500">{{ user()?.role }}</p>
              </div>
            </div>
            <button
              (click)="logout()"
              class="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="pl-64">
        <main class="py-6">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class LayoutComponent {
  user = this.authService.user;
  
  navigation = computed(() => {
    const baseNav: NavItem[] = [
      {
        name: 'Dashboard',
        href: '/',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>'
      },
      {
        name: 'Cash Flow Calendar',
        href: '/cash-flow',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>'
      }
    ];

    const brokerNav: NavItem[] = [
      {
        name: 'Agents',
        href: '/agents',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>'
      },
      {
        name: 'Insurance Companies',
        href: '/insurance-companies',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>'
      }
    ];

    const agentBrokerNav: NavItem[] = [
      {
        name: 'Policies',
        href: '/policies',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>'
      },
      {
        name: 'Invoices',
        href: '/invoices',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>'
      },
      {
        name: 'Payments',
        href: '/payments',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>'
      },
      {
        name: 'Reconciliation',
        href: '/reconciliation',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>'
      },
      {
        name: 'Clients',
        href: '/clients',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>'
      }
    ];

    const commonNav: NavItem[] = [
      {
        name: 'Insights',
        href: '/insights',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>'
      },
      {
        name: 'AI Assistant',
        href: '/chat',
        icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>'
      }
    ];

    let nav = [...baseNav];
    const userRole = this.user()?.role;

    if (userRole === 'broker') {
      nav = [...nav, ...brokerNav, ...agentBrokerNav];
    } else if (userRole === 'agent') {
      nav = [...nav, ...agentBrokerNav];
    } else if (userRole === 'client') {
      nav = [
        ...baseNav,
        {
          name: 'My Policies',
          href: '/policies',
          icon: agentBrokerNav[0].icon
        },
        {
          name: 'My Invoices',
          href: '/invoices',
          icon: agentBrokerNav[1].icon
        }
      ];
    }

    return [...nav, ...commonNav];
  });

  userInitials = computed(() => {
    const name = this.user()?.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  });

  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
} 