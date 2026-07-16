import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Business {
  id: string;
  name: string;
  phone: string; // masked for display
}

const BUSINESSES: Business[] = [
  { id: 'pennino', name: 'Pennino Contabilità', phone: '+39 ***-***-1234' },
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

  /**
   * Verify the OTP with the backend.
   * If `trustDevice` is true, stores a 24-hour auth token in localStorage
   * so the user does not need to enter an OTP again on this device.
   */
  async verifyOtp(businessId: string, otp: string, trustDevice: boolean): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post('/api/auth/verify-otp', { businessId, otp })
      );
      const business = BUSINESSES.find(b => b.id === businessId) ?? null;
      this.currentBusiness.set(business);
      this.isAuthenticated.set(true);
      if (trustDevice) {
        localStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify({ businessId, expiresAt: Date.now() + DEVICE_TTL_MS })
        );
      }
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

  private loadFromStorage(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return;
    try {
      const { businessId, expiresAt } = JSON.parse(raw);
      if (typeof expiresAt === 'number' && expiresAt > Date.now()) {
        const business = BUSINESSES.find(b => b.id === businessId) ?? null;
        if (business) {
          this.currentBusiness.set(business);
          this.isAuthenticated.set(true);
          return;
        }
      }
      // Expired or invalid — clear it
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
