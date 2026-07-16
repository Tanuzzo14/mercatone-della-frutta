import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Business {
  id: string;
  name: string;
  phone: string; // masked for display
}

const BUSINESSES: Business[] = [
  { id: 'mercatone', name: 'Mercatone della Frutta', phone: '+39 ***-***-5678' },
];

/** Milliseconds in 24 hours */
const DEVICE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'gestionaleAuth';
  private http = inject(HttpClient);

  isAuthenticated = signal<boolean>(false);
  currentBusiness = signal<Business | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  get businesses(): Business[] {
    return BUSINESSES;
  }

  /** Send OTP via TextBelt to the configured phone numbers. */
  async sendOtp(businessId: string): Promise<void> {
    await firstValueFrom(
      this.http.post('/api/auth/send-otp', { businessId })
    );
  }

  /** Verify OTP with backend and authenticate user. */
  async verifyOtp(businessId: string, otp: string, trustDevice: boolean): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post('/api/auth/verify-otp', { businessId, otp })
      );
      this.authenticateBusiness(businessId, trustDevice);
      return true;
    } catch {
      return false;
    }
  }

  /** Password fallback login when OTP is unavailable/quota exhausted. */
  async loginWithPassword(businessId: string, password: string, trustDevice: boolean): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post('/api/auth/login-password', { businessId, password })
      );
      this.authenticateBusiness(businessId, trustDevice);
      return true;
    } catch {
      return false;
    }
  }

  /** Change current business password by validating old password. */
  async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    const businessId = this.currentBusiness()?.id;
    if (!businessId) return false;

    try {
      await firstValueFrom(
        this.http.post('/api/auth/change-password', {
          businessId,
          oldPassword,
          newPassword,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.currentBusiness.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private authenticateBusiness(
    businessId: string,
    trustDevice: boolean,
    keepStoredToken = false
  ): void {
    const business = BUSINESSES.find(b => b.id === businessId) ?? null;
    this.currentBusiness.set(business);
    this.isAuthenticated.set(Boolean(business));

    if (!business) {
      if (!keepStoredToken) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
      return;
    }

    if (trustDevice) {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({ businessId, expiresAt: Date.now() + DEVICE_TTL_MS })
      );
      return;
    }

    localStorage.removeItem(this.STORAGE_KEY);
  }

  private loadFromStorage(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return;
    try {
      const { businessId, expiresAt } = JSON.parse(raw);
      if (typeof expiresAt === 'number' && expiresAt > Date.now()) {
        this.authenticateBusiness(businessId, false, true);
        return;
      }
      // Expired or invalid — clear it
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
