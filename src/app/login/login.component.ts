import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, Business } from '../auth/auth.service';

type LoginStep = 'credentials' | 'otp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <!-- Logo / Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur mb-4 shadow-xl">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-white tracking-tight">Gestionale PWA</h1>
          <p class="text-blue-200 mt-1 text-sm">Mercatone della Frutta</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-3xl shadow-2xl p-6">
          @if (step() === 'credentials') {
            <h2 class="text-xl font-bold text-gray-800 mb-1">Accedi</h2>
            <p class="text-gray-500 text-sm mb-5">Seleziona la tua attività e inserisci la password</p>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Attività</label>
                <select [(ngModel)]="selectedBusinessId" class="input-field">
                  <option value="" disabled>-- Seleziona attività --</option>
                  @for (b of auth.businesses; track b.id) {
                    <option [value]="b.id">{{ b.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="password"
                    placeholder="Inserisci password"
                    class="input-field pr-10"
                    (keyup.enter)="submitCredentials()"
                  />
                  <button type="button" (click)="showPassword.set(!showPassword())" 
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    @if (showPassword()) {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    } @else {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                  </button>
                </div>
              </div>

              @if (errorMsg()) {
                <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
                  <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                  {{ errorMsg() }}
                </div>
              }

              <button (click)="submitCredentials()" [disabled]="loading()" class="btn-primary">
                @if (loading()) {
                  <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Verifica...
                  </span>
                } @else {
                  Continua
                }
              </button>
            </div>
          }

          @if (step() === 'otp') {
            <button (click)="step.set('credentials'); errorMsg.set('')" class="flex items-center gap-1 text-blue-600 text-sm font-medium mb-4 hover:text-blue-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              Indietro
            </button>

            <h2 class="text-xl font-bold text-gray-800 mb-1">Verifica 2FA</h2>
            <p class="text-gray-500 text-sm mb-1">Abbiamo inviato un codice a 6 cifre al numero</p>
            <p class="text-blue-700 font-semibold text-sm mb-5">{{ pendingBusiness()?.phone }}</p>

            <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-700">
              <strong>Demo:</strong> Il codice OTP è visibile nella console del browser (DevTools → Console).
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Codice OTP</label>
                <input
                  type="tel"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="6"
                  [(ngModel)]="otpInput"
                  placeholder="_ _ _ _ _ _"
                  class="input-field text-center text-2xl font-bold tracking-widest"
                  (keyup.enter)="submitOtp()"
                />
              </div>

              @if (errorMsg()) {
                <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
                  <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                  {{ errorMsg() }}
                </div>
              }

              <button (click)="submitOtp()" [disabled]="loading() || otpInput.length !== 6" class="btn-primary">
                @if (loading()) {
                  <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Verifica...
                  </span>
                } @else {
                  Verifica e accedi
                }
              </button>

              <button (click)="resendOtp()" class="w-full text-sm text-blue-600 hover:text-blue-800 py-2 font-medium">
                Non hai ricevuto il codice? Rinvia
              </button>
            </div>
          }
        </div>

        <p class="text-center text-blue-300 text-xs mt-6">
          © {{ currentYear }} Mercatone della Frutta — PWA v1.0
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  step = signal<LoginStep>('credentials');
  selectedBusinessId = '';
  password = '';
  otpInput = '';
  showPassword = signal(false);
  loading = signal(false);
  errorMsg = signal('');
  pendingBusiness = signal<Business | null>(null);
  currentYear = new Date().getFullYear();

  submitCredentials(): void {
    this.errorMsg.set('');
    if (!this.selectedBusinessId) {
      this.errorMsg.set('Seleziona la tua attività.');
      return;
    }
    const business = this.auth.validateCredentials(this.selectedBusinessId, this.password);
    if (!business) {
      this.errorMsg.set('Credenziali non valide. Riprova.');
      return;
    }
    this.loading.set(true);
    setTimeout(() => {
      this.auth.generateOtp(business);
      this.pendingBusiness.set(business);
      this.step.set('otp');
      this.loading.set(false);
    }, 600);
  }

  submitOtp(): void {
    this.errorMsg.set('');
    this.loading.set(true);
    setTimeout(() => {
      const ok = this.auth.verifyOtp(this.otpInput);
      if (ok) {
        this.router.navigate(['/products']);
      } else {
        this.errorMsg.set('Codice OTP non valido o scaduto. Riprova.');
        this.otpInput = '';
      }
      this.loading.set(false);
    }, 600);
  }

  resendOtp(): void {
    const business = this.pendingBusiness();
    if (business) {
      this.auth.generateOtp(business);
      this.otpInput = '';
      this.errorMsg.set('');
    }
  }
}
