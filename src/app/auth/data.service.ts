import { Injectable } from '@angular/core';

export interface ProductRow {
  id: string;
  mese: string;
  articolo: string;
  quantita: number;
  prezzoKg: number;
}

export interface AccountingRow {
  id: string;
  mese: string;
  data: string;
  descrizione: string;
  entrate: number;
  uscite: number;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly PRODUCTS_KEY = 'gestionaleProducts';
  private readonly ACCOUNTING_KEY = 'gestionaleAccounting';

  private _products: ProductRow[] = [];
  private _accounting: AccountingRow[] = [];

  constructor() {
    this.load();
  }

  // PRODUCTS
  getProducts(mese: string): ProductRow[] {
    return this._products.filter(p => p.mese === mese);
  }

  addProduct(row: Omit<ProductRow, 'id'>): void {
    this._products.push({ ...row, id: crypto.randomUUID() });
    this.save();
  }

  deleteProduct(id: string): void {
    this._products = this._products.filter(p => p.id !== id);
    this.save();
  }

  getProductMonths(): string[] {
    return [...new Set(this._products.map(p => p.mese))].sort();
  }

  // ACCOUNTING
  getAccounting(mese: string): AccountingRow[] {
    return this._accounting.filter(r => r.mese === mese);
  }

  addAccounting(row: Omit<AccountingRow, 'id'>): void {
    this._accounting.push({ ...row, id: crypto.randomUUID() });
    this.save();
  }

  deleteAccounting(id: string): void {
    this._accounting = this._accounting.filter(r => r.id !== id);
    this.save();
  }

  getAccountingMonths(): string[] {
    return [...new Set(this._accounting.map(r => r.mese))].sort();
  }

  private save(): void {
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(this._products));
    localStorage.setItem(this.ACCOUNTING_KEY, JSON.stringify(this._accounting));
  }

  private load(): void {
    try {
      const p = localStorage.getItem(this.PRODUCTS_KEY);
      if (p) this._products = JSON.parse(p);
      const a = localStorage.getItem(this.ACCOUNTING_KEY);
      if (a) this._accounting = JSON.parse(a);
    } catch {
      // ignore
    }
  }
}
