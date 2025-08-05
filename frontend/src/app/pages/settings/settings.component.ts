import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    desktop: boolean;
  };
  emailPreferences: {
    newsletter: boolean;
    policyUpdates: boolean;
    paymentReminders: boolean;
    marketingEmails: boolean;
    securityAlerts: boolean;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
  apiAccess: boolean;
  ipWhitelist: string[];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
          <p class="mt-1 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button 
            (click)="saveAllSettings()"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Save All Changes
          </button>
        </div>
      </div>

      <!-- Settings Tabs -->
      <div class="bg-white shadow rounded-lg">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              *ngFor="let tab of tabs"
              (click)="activeTab = tab.id"
              [ngClass]="activeTab === tab.id 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            >
              <div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="tab.icon" />
                </svg>
                {{ tab.label }}
              </div>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Profile Settings -->
          <div *ngIf="activeTab === 'profile'" class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Profile Information</h3>
              <p class="mt-1 text-sm text-gray-600">Update your personal information and profile picture.</p>
            </div>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  [(ngModel)]="profileData.name"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  [(ngModel)]="profileData.email"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  [(ngModel)]="profileData.phone"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  [(ngModel)]="profileData.jobTitle"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  [(ngModel)]="profileData.bio"
                  rows="3"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                (click)="saveProfile()"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Save Profile
              </button>
            </div>
          </div>

          <!-- Preferences -->
          <div *ngIf="activeTab === 'preferences'" class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Preferences</h3>
              <p class="mt-1 text-sm text-gray-600">Customize your application experience.</p>
            </div>

            <div class="space-y-4">
              <!-- Theme -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <div class="grid grid-cols-3 gap-3">
                  <button
                    *ngFor="let theme of themes"
                    (click)="preferences().theme = theme.value"
                    [ngClass]="preferences().theme === theme.value 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-300'"
                    class="relative rounded-lg border-2 p-4 flex flex-col items-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <svg class="h-8 w-8 mb-2" [ngClass]="theme.iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="theme.icon" />
                    </svg>
                    <span class="text-sm font-medium">{{ theme.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Language -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Language</label>
                <select
                  [(ngModel)]="preferences().language"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <!-- Timezone -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  [(ngModel)]="preferences().timezone"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>

              <!-- Date Format -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Date Format</label>
                <select
                  [(ngModel)]="preferences().dateFormat"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <!-- Currency -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  [(ngModel)]="preferences().currency"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                (click)="savePreferences()"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Save Preferences
              </button>
            </div>
          </div>

          <!-- Notifications -->
          <div *ngIf="activeTab === 'notifications'" class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Notification Settings</h3>
              <p class="mt-1 text-sm text-gray-600">Choose how you want to receive notifications.</p>
            </div>

            <!-- Notification Channels -->
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-4">Notification Channels</h4>
              <div class="space-y-3">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="preferences().notifications.email"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Email Notifications</span>
                    <span class="text-sm text-gray-500 block">Receive notifications via email</span>
                  </span>
                </label>

                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="preferences().notifications.push"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Push Notifications</span>
                    <span class="text-sm text-gray-500 block">Receive push notifications on your devices</span>
                  </span>
                </label>

                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="preferences().notifications.sms"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-3">
                    <span class="text-sm font-medium text-gray-700">SMS Notifications</span>
                    <span class="text-sm text-gray-500 block">Receive text messages for important updates</span>
                  </span>
                </label>

                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="preferences().notifications.desktop"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Desktop Notifications</span>
                    <span class="text-sm text-gray-500 block">Show notifications on your desktop</span>
                  </span>
                </label>
              </div>
            </div>

            <!-- Email Preferences -->
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-4">Email Preferences</h4>
              <div class="space-y-3">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="preferences().emailPreferences.newsletter"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-3 text-sm text-gray-700">Weekly Newsletter</span>
                </label>

                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="preferences().emailPreferences.policyUpdates"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-3 text-sm text-gray-700">Policy Updates</span>
                </label>

                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="preferences().emailPreferences.paymentReminders"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-3 text-sm text-gray-700">Payment Reminders</span>
                </label>

                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="preferences().emailPreferences.marketingEmails"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-3 text-sm text-gray-700">Marketing & Promotions</span>
                </label>

                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="preferences().emailPreferences.securityAlerts"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-3 text-sm text-gray-700">Security Alerts</span>
                </label>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                (click)="saveNotifications()"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Save Notifications
              </button>
            </div>
          </div>

          <!-- Security -->
          <div *ngIf="activeTab === 'security'" class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Security Settings</h3>
              <p class="mt-1 text-sm text-gray-600">Manage your account security and privacy.</p>
            </div>

            <!-- Password Change -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-sm font-medium text-gray-900 mb-4">Change Password</h4>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    [(ngModel)]="passwordData.current"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    [(ngModel)]="passwordData.new"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    [(ngModel)]="passwordData.confirm"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <button
                  (click)="changePassword()"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Update Password
                </button>
              </div>
            </div>

            <!-- Two-Factor Authentication -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p class="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <button
                  (click)="toggleTwoFactor()"
                  [ngClass]="security().twoFactorEnabled ? 'bg-green-600' : 'bg-gray-200'"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <span
                    [ngClass]="security().twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'"
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Session Settings -->
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-4">Session Settings</h4>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    [(ngModel)]="security().sessionTimeout"
                    min="5"
                    max="120"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="security().loginAlerts"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-3 text-sm text-gray-700">Email me when a new device logs into my account</span>
                </label>
              </div>
            </div>

            <!-- Active Sessions -->
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-4">Active Sessions</h4>
              <div class="space-y-3">
                <div *ngFor="let session of activeSessions()" 
                     class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ session.device }}</p>
                    <p class="text-xs text-gray-500">{{ session.location }} · {{ session.lastActive }}</p>
                  </div>
                  <button
                    *ngIf="!session.current"
                    (click)="revokeSession(session.id)"
                    class="text-sm text-red-600 hover:text-red-800"
                  >
                    Revoke
                  </button>
                  <span *ngIf="session.current" class="text-xs text-green-600 font-medium">Current</span>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                (click)="saveSecurity()"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Save Security Settings
              </button>
            </div>
          </div>

          <!-- API Settings -->
          <div *ngIf="activeTab === 'api'" class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900">API Configuration</h3>
              <p class="mt-1 text-sm text-gray-600">Manage API keys and webhook settings.</p>
            </div>

            <!-- API Keys -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-medium text-gray-900">API Keys</h4>
                <button
                  (click)="generateApiKey()"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Generate New Key
                </button>
              </div>
              
              <div class="space-y-3">
                <div *ngFor="let key of apiKeys()" 
                     class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex-1">
                    <div class="flex items-center">
                      <p class="text-sm font-medium text-gray-900">{{ key.name }}</p>
                      <span class="ml-2 px-2 py-1 text-xs rounded-full"
                            [ngClass]="key.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                        {{ key.active ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      Created: {{ key.created }} · Last used: {{ key.lastUsed }}
                    </p>
                    <div class="mt-2 flex items-center">
                      <code class="text-xs bg-gray-100 px-2 py-1 rounded">{{ key.masked }}</code>
                      <button
                        (click)="copyApiKey(key.id)"
                        class="ml-2 text-xs text-primary-600 hover:text-primary-800"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <button
                    (click)="revokeApiKey(key.id)"
                    class="ml-4 text-sm text-red-600 hover:text-red-800"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </div>

            <!-- Webhooks -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-medium text-gray-900">Webhooks</h4>
                <button
                  (click)="addWebhook()"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Add Webhook
                </button>
              </div>
              
              <div class="space-y-3">
                <div *ngFor="let webhook of webhooks()" 
                     class="p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ webhook.url }}</p>
                      <p class="text-xs text-gray-500">Events: {{ webhook.events.join(', ') }}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                      <button
                        (click)="testWebhook(webhook.id)"
                        class="text-sm text-primary-600 hover:text-primary-800"
                      >
                        Test
                      </button>
                      <button
                        (click)="removeWebhook(webhook.id)"
                        class="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- System -->
          <div *ngIf="activeTab === 'system'" class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900">System Information</h3>
              <p class="mt-1 text-sm text-gray-600">View system status and configuration.</p>
            </div>

            <!-- System Status -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-sm font-medium text-gray-900 mb-4">System Status</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-600">Version</p>
                  <p class="text-sm font-medium">{{ systemInfo().version }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Environment</p>
                  <p class="text-sm font-medium">{{ systemInfo().environment }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">API Status</p>
                  <p class="text-sm font-medium text-green-600">{{ systemInfo().apiStatus }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Database</p>
                  <p class="text-sm font-medium">{{ systemInfo().database }}</p>
                </div>
              </div>
            </div>

            <!-- Data Management -->
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-4">Data Management</h4>
              <div class="space-y-3">
                <button
                  (click)="exportData()"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export All Data
                </button>
                
                <button
                  (click)="clearCache()"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Cache
                </button>
              </div>
            </div>

            <!-- Danger Zone -->
            <div class="border border-red-200 bg-red-50 p-4 rounded-lg">
              <h4 class="text-sm font-medium text-red-900 mb-4">Danger Zone</h4>
              <p class="text-sm text-red-700 mb-4">
                These actions are irreversible. Please be certain.
              </p>
              <button
                (click)="deleteAccount()"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SettingsComponent implements OnInit {
  activeTab = 'profile';
  
  tabs = [
    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'preferences', label: 'Preferences', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'api', label: 'API', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { id: 'system', label: 'System', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' }
  ];

  themes = [
    { value: 'light' as const, label: 'Light', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', iconClass: 'text-yellow-500' },
    { value: 'dark' as const, label: 'Dark', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', iconClass: 'text-gray-700' },
    { value: 'auto' as const, label: 'Auto', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', iconClass: 'text-blue-500' }
  ];

  // Profile data
  profileData = {
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    bio: ''
  };

  // Password data
  passwordData = {
    current: '',
    new: '',
    confirm: ''
  };

  // State signals
  preferences = signal<UserPreferences>({
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    notifications: {
      email: true,
      push: true,
      sms: false,
      desktop: true
    },
    emailPreferences: {
      newsletter: true,
      policyUpdates: true,
      paymentReminders: true,
      marketingEmails: false,
      securityAlerts: true
    }
  });

  security = signal<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true,
    apiAccess: false,
    ipWhitelist: []
  });

  // Computed values
  activeSessions = computed(() => [
    { id: '1', device: 'Chrome on MacOS', location: 'New York, USA', lastActive: '2 minutes ago', current: true },
    { id: '2', device: 'Safari on iPhone', location: 'New York, USA', lastActive: '1 hour ago', current: false },
    { id: '3', device: 'Firefox on Windows', location: 'Los Angeles, USA', lastActive: '3 days ago', current: false }
  ]);

  apiKeys = computed(() => [
    { id: '1', name: 'Production API', active: true, created: '2024-01-15', lastUsed: '2 hours ago', masked: 'pk_live_...3a4b' },
    { id: '2', name: 'Test API', active: true, created: '2024-02-20', lastUsed: '5 days ago', masked: 'pk_test_...8x9y' },
    { id: '3', name: 'Development', active: false, created: '2024-03-10', lastUsed: '1 month ago', masked: 'pk_dev_...2z3a' }
  ]);

  webhooks = computed(() => [
    { id: '1', url: 'https://example.com/webhook', events: ['payment.created', 'payment.updated'] },
    { id: '2', url: 'https://api.example.com/notifications', events: ['policy.created', 'policy.cancelled'] }
  ]);

  systemInfo = computed(() => ({
    version: '2.1.0',
    environment: 'Production',
    apiStatus: 'Operational',
    database: 'PostgreSQL 14.2'
  }));

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    const user = this.authService.user();
    if (user) {
      this.profileData.name = user.name;
      this.profileData.email = user.email;
    }
  }

  saveProfile() {
    this.toastr.success('Profile updated successfully');
  }

  savePreferences() {
    localStorage.setItem('userPreferences', JSON.stringify(this.preferences()));
    this.toastr.success('Preferences saved successfully');
  }

  saveNotifications() {
    this.toastr.success('Notification settings updated');
  }

  saveSecurity() {
    this.toastr.success('Security settings saved');
  }

  saveAllSettings() {
    this.saveProfile();
    this.savePreferences();
    this.saveNotifications();
    this.saveSecurity();
  }

  changePassword() {
    if (this.passwordData.new !== this.passwordData.confirm) {
      this.toastr.error('Passwords do not match');
      return;
    }
    this.toastr.success('Password changed successfully');
    this.passwordData = { current: '', new: '', confirm: '' };
  }

  toggleTwoFactor() {
    const current = this.security();
    this.security.set({ ...current, twoFactorEnabled: !current.twoFactorEnabled });
    this.toastr.info(current.twoFactorEnabled ? '2FA disabled' : '2FA enabled');
  }

  revokeSession(sessionId: string) {
    this.toastr.success('Session revoked');
  }

  generateApiKey() {
    this.toastr.success('New API key generated');
  }

  copyApiKey(keyId: string) {
    this.toastr.info('API key copied to clipboard');
  }

  revokeApiKey(keyId: string) {
    this.toastr.warning('API key revoked');
  }

  addWebhook() {
    this.toastr.success('Webhook added');
  }

  testWebhook(webhookId: string) {
    this.toastr.info('Test webhook sent');
  }

  removeWebhook(webhookId: string) {
    this.toastr.warning('Webhook removed');
  }

  exportData() {
    this.toastr.info('Exporting data...');
  }

  clearCache() {
    localStorage.clear();
    this.toastr.success('Cache cleared');
  }

  deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.toastr.error('Account deletion requested');
      // In production, would call API and logout
    }
  }
}
