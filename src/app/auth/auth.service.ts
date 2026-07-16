import { Injectable, signal } from '@angular/core';

export interface Business {
  id: string;
  name: string;
  password: string;
  phone: string; // masked for display
}

const BUSINESSES: Business[] = [
  { id: 'pennino', name: 'Pennino Contabilità', password: 'pennino2024', phone: '+39 ***-***-1234' },
  { id: 'mercatone', name: 'Mercatone della Frutta', password: 'frutta2024', phone: '+39 ***-***-5678' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'gestionaleAuth';
  
  isAuthenticated = signal<boolean>(false);
  currentBusiness = signal<Business | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  get businesses(): Business[] {
    return BUSINESSES;
  }

  validateCredentials(businessId: string, password: string): Business | null {
    return BUSINESSES.find(b => b.id === businessId && b.password === password) ?? null;
  }

  /** Generate a 6-digit OTP and "send" it (in a real app, send via SMS/email) */
  generateOtp(business: Business): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // In production, send via SMS/email. For demo, store in sessionStorage.
    sessionStorage.setItem('pending_otp', otp);
    sessionStorage.setItem('pending_business', business.id);
    console.info(`[2FA] OTP per ${business.name}: ${otp}`); // visible in devtools
    return otp;
  }

  verifyOtp(inputOtp: string): boolean {
    const stored = sessionStorage.getItem('pending_otp');
    const businessId = sessionStorage.getItem('pending_business');
    if (stored === inputOtp && businessId) {
      const business = BUSINESSES.find(b => b.id === businessId) ?? null;
      this.currentBusiness.set(business);
      this.isAuthenticated.set(true);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ businessId }));
      sessionStorage.removeItem('pending_otp');
      sessionStorage.removeItem('pending_business');
      return true;
    }
    return false;
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.currentBusiness.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.clear();
  }

  private loadFromStorage(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const { businessId } = JSON.parse(raw);
        const business = BUSINESSES.find(b => b.id === businessId) ?? null;
        if (business) {
          this.currentBusiness.set(business);
          this.isAuthenticated.set(true);
        }
      } catch {
        // ignore parse errors
      }
    }
  }
}
