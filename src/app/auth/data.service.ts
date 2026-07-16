import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Foglio: Inserimento Prodotti — colonne da media 15-7.xlsx
export interface ProductRow {
  id: string;
  mese: string;
  articolo: string;
  quantita: number;   // QUANTI
  prezzoKg: number;   // PREZ KG
  iva: number;        // IVA (default 1.04)
  divi: number;       // DIVI (divisore)
  totCasse: number;   // tot casse
  // totImpo calcolato: quantita * prezzoKg * iva / divi + totCasse
}

// Foglio: Pennino — colonne da "acq+ vendite revisio"
export interface AccountingRow {
  id: string;
  mese: string;
  fattAcq: number;    // FATT ACQ
  dataAcq: string;    // data acquisto
  denom: string;      // denominazione acquisto
  vendite: number;    // vendite
  dataVend: string;   // data vendite
  denomVend: string;  // denominazione vendite
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  private _products = signal<ProductRow[]>([]);
  private _accounting = signal<AccountingRow[]>([]);

  constructor() {
    this.load();
  }

  // PRODUCTS
  getProducts(mese: string): ProductRow[] {
    return this._products().filter(p => p.mese === mese);
  }

  addProduct(row: Omit<ProductRow, 'id'>): void {
    this.http.post<ProductRow>('/api/products', row).subscribe(created => {
      this._products.update(list => [...list, created]);
    });
  }

  deleteProduct(id: string): void {
    this.http.delete(`/api/products/${id}`).subscribe(() => {
      this._products.update(list => list.filter(p => p.id !== id));
    });
  }

  getProductMonths(): string[] {
    return [...new Set(this._products().map(p => p.mese))].sort();
  }

  // ACCOUNTING
  getAccounting(mese: string): AccountingRow[] {
    return this._accounting().filter(r => r.mese === mese);
  }

  addAccounting(row: Omit<AccountingRow, 'id'>): void {
    this.http.post<AccountingRow>('/api/accounting', row).subscribe(created => {
      this._accounting.update(list => [...list, created]);
    });
  }

  deleteAccounting(id: string): void {
    this.http.delete(`/api/accounting/${id}`).subscribe(() => {
      this._accounting.update(list => list.filter(r => r.id !== id));
    });
  }

  getAccountingMonths(): string[] {
    return [...new Set(this._accounting().map(r => r.mese))].sort();
  }

  private load(): void {
    this.http.get<ProductRow[]>('/api/products').subscribe({
      next: data => this._products.set(data),
      error: () => { /* API non disponibile in locale senza wrangler pages dev */ }
    });
    this.http.get<AccountingRow[]>('/api/accounting').subscribe({
      next: data => this._accounting.set(data),
      error: () => { /* API non disponibile in locale senza wrangler pages dev */ }
    });
  }
}
