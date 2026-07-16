import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, Business } from '../auth/auth.service';

type LoginStep = 'business' | 'otp';

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
          @if (step() === 'business') {
            <h2 class="text-xl font-bold text-gray-800 mb-1">Accedi</h2>
            <p class="text-gray-500 text-sm mb-5">Seleziona la tua attività e ricevi il codice via SMS</p>

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

              @if (errorMsg()) {
                <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
                  <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                  {{ errorMsg() }}
                </div>
              }

              <button (click)="sendOtp()" [disabled]="loading() || !selectedBusinessId" class="btn-primary">
                @if (loading()) {
                  <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Invio in corso...
                  </span>
                } @else {
                  Invia codice OTP
                }
              </button>
            </div>
          }

          @if (step() === 'otp') {
            <button (click)="goBack()" class="flex items-center gap-1 text-blue-600 text-sm font-medium mb-4 hover:text-blue-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              Indietro
            </button>

            <h2 class="text-xl font-bold text-gray-800 mb-1">Verifica OTP</h2>
            <p class="text-gray-500 text-sm mb-1">Abbiamo inviato un codice al numero registrato</p>
            <p class="text-blue-700 font-semibold text-sm mb-4">{{ pendingBusiness()?.phone }}</p>

            <!-- Countdown timer -->
            <div class="flex items-center justify-center mb-4">
              @if (secondsLeft() > 0) {
                <div class="flex items-center gap-2 text-sm" [class.text-orange-500]="secondsLeft() <= 15" [class.text-gray-500]="secondsLeft() > 15">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Il codice scade tra {{ secondsLeft() }}s
                </div>
              } @else {
                <div class="flex items-center gap-2 text-sm text-red-500">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                  Codice scaduto — rinvia per ottenere un nuovo codice
                </div>
              }
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
                  [disabled]="secondsLeft() === 0"
                />
              </div>

              <!-- Trust device -->
              <label class="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  [(ngModel)]="trustDevice"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                />
                <span class="text-sm text-gray-600">Ricorda questo dispositivo per 1 giorno</span>
              </label>

              @if (errorMsg()) {
                <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
                  <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                  {{ errorMsg() }}
                </div>
              }

              <button
                (click)="submitOtp()"
                [disabled]="loading() || otpInput.length !== 6 || secondsLeft() === 0"
                class="btn-primary"
              >
                @if (loading()) {
                  <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Verifica...
                  </span>
                } @else {
                  Verifica e accedi
                }
              </button>

              <button
                (click)="resendOtp()"
                [disabled]="loading() || resendCooldown() > 0"
                class="w-full text-sm py-2 font-medium transition-colors"
                [class.text-blue-600]="resendCooldown() === 0"
                [class.text-gray-400]="resendCooldown() > 0"
              >
                @if (resendCooldown() > 0) {
                  Rinvia tra {{ resendCooldown() }}s
                } @else {
                  Non hai ricevuto il codice? Rinvia
                }
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
export class LoginComponent implements OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);

  step = signal<LoginStep>('business');
  selectedBusinessId = '';
  otpInput = '';
  trustDevice = false;
  loading = signal(false);
  errorMsg = signal('');
  pendingBusiness = signal<Business | null>(null);
  secondsLeft = signal(60);
  resendCooldown = signal(0);
  currentYear = new Date().getFullYear();

  private otpTimer?: ReturnType<typeof setInterval>;
  private cooldownTimer?: ReturnType<typeof setInterval>;

  async sendOtp(): Promise<void> {
    if (!this.selectedBusinessId) {
      this.errorMsg.set('Seleziona la tua attività.');
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      await this.auth.sendOtp(this.selectedBusinessId);
      const business = this.auth.businesses.find(b => b.id === this.selectedBusinessId) ?? null;
      this.pendingBusiness.set(business);
      this.otpInput = '';
      this.step.set('otp');
      this.startOtpTimer();
      this.startResendCooldown();
    } catch {
      this.errorMsg.set("Errore nell'invio del codice OTP. Riprova.");
    } finally {
      this.loading.set(false);
    }
  }

  async submitOtp(): Promise<void> {
    this.errorMsg.set('');
    this.loading.set(true);
    try {
      const ok = await this.auth.verifyOtp(this.selectedBusinessId, this.otpInput, this.trustDevice);
      if (ok) {
        this.clearTimers();
        this.router.navigate(['/products']);
      } else {
        this.errorMsg.set('Codice OTP non valido o scaduto. Riprova.');
        this.otpInput = '';
      }
    } finally {
      this.loading.set(false);
    }
  }

  async resendOtp(): Promise<void> {
    const business = this.pendingBusiness();
    if (!business) return;
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      await this.auth.sendOtp(business.id);
      this.otpInput = '';
      this.startOtpTimer();
      this.startResendCooldown();
    } catch {
      this.errorMsg.set("Errore nell'invio del codice OTP. Riprova.");
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.clearTimers();
    this.step.set('business');
    this.errorMsg.set('');
    this.otpInput = '';
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private startOtpTimer(): void {
    this.clearOtpTimer();
    this.secondsLeft.set(60);
    this.otpTimer = setInterval(() => {
      const left = this.secondsLeft() - 1;
      this.secondsLeft.set(left);
      if (left <= 0) clearInterval(this.otpTimer);
    }, 1000);
  }

  private startResendCooldown(): void {
    this.clearCooldownTimer();
    this.resendCooldown.set(30);
    this.cooldownTimer = setInterval(() => {
      const left = this.resendCooldown() - 1;
      this.resendCooldown.set(left);
      if (left <= 0) clearInterval(this.cooldownTimer);
    }, 1000);
  }

  private clearOtpTimer(): void {
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
      this.otpTimer = undefined;
    }
  }

  private clearCooldownTimer(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = undefined;
    }
  }

  private clearTimers(): void {
    this.clearOtpTimer();
    this.clearCooldownTimer();
  }
}
