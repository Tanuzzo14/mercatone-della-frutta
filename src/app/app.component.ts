import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans">

      <!-- Top Navbar (shown only when authenticated) -->
      @if (auth.isAuthenticated()) {
        <nav class="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg sticky top-0 z-50">
          <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <!-- Brand -->
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div>
                <h1 class="text-base font-bold leading-none">Gestionale PWA</h1>
                <p class="text-blue-200 text-xs leading-none mt-0.5">{{ auth.currentBusiness()?.name }}</p>
              </div>
            </div>

            <!-- Desktop nav links -->
            <div class="hidden sm:flex items-center gap-1">
              <a routerLink="/products" routerLinkActive="bg-white/20 text-white"
                class="px-4 py-2 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                Inserimento Prodotti
              </a>
              <a routerLink="/accounting" routerLinkActive="bg-white/20 text-white"
                class="px-4 py-2 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                Pennino
              </a>
              <button (click)="logout()"
                class="ml-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-200 hover:bg-red-500/20 hover:text-red-200 transition-all flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                Esci
              </button>
            </div>

            <!-- Mobile: logout button -->
            <button (click)="logout()" class="sm:hidden p-2 rounded-lg text-blue-200 hover:bg-white/10 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </nav>
      }

      <!-- Main Content -->
      <main class="flex-grow max-w-4xl w-full mx-auto w-full"
        [class.pb-20]="auth.isAuthenticated()">
        <router-outlet />
      </main>

      <!-- Bottom Navigation Bar (Mobile, only when authenticated) -->
      @if (auth.isAuthenticated()) {
        <nav class="sm:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
          <div class="flex">
            <a routerLink="/products" routerLinkActive #rlaProducts="routerLinkActive"
              class="flex-1 flex flex-col items-center py-3 transition-colors"
              [class.text-blue-700]="rlaProducts.isActive"
              [class.text-gray-500]="!rlaProducts.isActive">
              <div class="relative">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" [attr.stroke-width]="rlaProducts.isActive ? 2.5 : 1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                @if (rlaProducts.isActive) {
                  <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-700"></span>
                }
              </div>
              <span class="text-xs font-semibold mt-1" [class.font-bold]="rlaProducts.isActive">Ins. Prodotti</span>
            </a>
            <a routerLink="/accounting" routerLinkActive #rlaAccounting="routerLinkActive"
              class="flex-1 flex flex-col items-center py-3 transition-colors"
              [class.text-blue-700]="rlaAccounting.isActive"
              [class.text-gray-500]="!rlaAccounting.isActive">
              <div class="relative">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" [attr.stroke-width]="rlaAccounting.isActive ? 2.5 : 1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                @if (rlaAccounting.isActive) {
                  <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-700"></span>
                }
              </div>
              <span class="text-xs font-semibold mt-1" [class.font-bold]="rlaAccounting.isActive">Pennino</span>
            </a>
          </div>
        </nav>
      }
    </div>
  `
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
