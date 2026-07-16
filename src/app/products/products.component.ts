import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, ProductRow } from '../auth/data.service';
import { ExcelService } from '../auth/excel.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 pb-4">
      <!-- Month navigation -->
      <div class="flex items-center gap-3 mb-5">
        <button (click)="prevMonth()" class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-all">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div class="flex-1">
          <input type="month" [ngModel]="selectedMonth()" (ngModelChange)="selectedMonth.set($event)"
            class="input-field text-center font-semibold text-gray-800" />
        </div>
        <button (click)="nextMonth()" class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-all">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 gap-3 mb-5">
        <div class="card text-center">
          <p class="text-xs text-gray-500 mb-1">Prodotti nel mese</p>
          <p class="text-2xl font-bold text-blue-700">{{ filteredProducts().length }}</p>
        </div>
        <div class="card text-center">
          <p class="text-xs text-gray-500 mb-1">Tot. Importo Mese</p>
          <p class="text-2xl font-bold text-emerald-700">€{{ totalImporto() }}</p>
        </div>
      </div>

      <!-- Add product form -->
      <div class="card mb-5">
        <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuovo Prodotto
        </h3>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Articolo</label>
            <input type="text" placeholder="Es. Avocado, Mele Royal, Datter Giallo" [(ngModel)]="newProd.articolo"
              class="input-field" autocomplete="off" autocapitalize="words" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Quantità (Q.tà)</label>
              <input type="number" inputmode="decimal" placeholder="0" [(ngModel)]="newProd.quantita"
                min="0" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Prezzo/KG (€)</label>
              <input type="number" inputmode="decimal" placeholder="0.00" [(ngModel)]="newProd.prezzoKg"
                min="0" step="0.01" class="input-field" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">IVA</label>
              <input type="number" inputmode="decimal" placeholder="1.04" [(ngModel)]="newProd.iva"
                min="1" step="0.01" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Divisore</label>
              <input type="number" inputmode="decimal" placeholder="1" [(ngModel)]="newProd.divi"
                min="1" step="1" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Tot. Casse</label>
              <input type="number" inputmode="decimal" placeholder="0.00" [(ngModel)]="newProd.totCasse"
                min="0" step="0.01" class="input-field" />
            </div>
          </div>

          <!-- Live preview -->
          @if (newProd.prezzoKg && newProd.prezzoKg > 0) {
            <div class="bg-blue-50 rounded-xl p-3 text-sm text-center">
              <p class="text-xs text-gray-500 mb-1">Tot. Importo (calcolato)</p>
              <p class="font-bold text-blue-700 text-lg">€{{ calcTotImpo(newProd).toFixed(2) }}</p>
              <p class="text-xs text-gray-400 mt-0.5">Q.tà × Prezzo/KG × IVA ÷ Div + Tot.Casse</p>
            </div>
          }

          <button (click)="addProduct()" [disabled]="!newProd.articolo || !newProd.prezzoKg" class="btn-primary disabled:opacity-50">
            Aggiungi Prodotto
          </button>
        </div>
      </div>

      <!-- Products table -->
      @if (filteredProducts().length > 0) {
        <div class="card mb-5 overflow-hidden p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <th class="p-3 text-left font-semibold">ARTICOLO</th>
                  <th class="p-3 text-center font-semibold whitespace-nowrap">QUANTI</th>
                  <th class="p-3 text-center font-semibold whitespace-nowrap">PREZ KG</th>
                  <th class="p-3 text-center font-semibold whitespace-nowrap">IVA</th>
                  <th class="p-3 text-center font-semibold whitespace-nowrap">DIVI</th>
                  <th class="p-3 text-center font-semibold whitespace-nowrap">tot casse</th>
                  <th class="p-3 text-center font-semibold whitespace-nowrap text-emerald-200">tot impo</th>
                  <th class="p-3 text-center font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody>
                @for (p of filteredProducts(); track p.id; let odd = $odd) {
                  <tr [class]="odd ? 'bg-gray-50' : 'bg-white'" class="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td class="p-3 font-medium text-gray-800">{{ p.articolo }}</td>
                    <td class="p-3 text-center text-gray-600">{{ p.quantita }}</td>
                    <td class="p-3 text-center font-semibold text-gray-800">€{{ p.prezzoKg.toFixed(2) }}</td>
                    <td class="p-3 text-center text-gray-600">{{ p.iva }}</td>
                    <td class="p-3 text-center text-gray-600">{{ p.divi }}</td>
                    <td class="p-3 text-center text-gray-600">€{{ p.totCasse.toFixed(2) }}</td>
                    <td class="p-3 text-center font-bold text-emerald-700">€{{ calcTotImpo(p).toFixed(2) }}</td>
                    <td class="p-3 text-center">
                      <button (click)="deleteProduct(p.id)" class="text-red-400 hover:text-red-600 transition-colors p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="bg-gray-100 font-bold text-sm border-t-2 border-gray-200">
                  <td class="p-3 text-gray-700" colspan="6">TOTALE MESE</td>
                  <td class="p-3 text-center text-emerald-700">€{{ totalImporto() }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <button (click)="exportExcel()" class="btn-success flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Esporta {{ monthLabel() }} in XLSX
        </button>
      } @else {
        <div class="card text-center py-12">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          <p class="text-gray-500 font-medium">Nessun prodotto per {{ monthLabel() }}</p>
          <p class="text-gray-400 text-sm mt-1">Inserisci il primo prodotto qui sopra</p>
        </div>
      }
    </div>
  `
})
export class ProductsComponent implements OnInit {
  private dataService = inject(DataService);
  private excelService = inject(ExcelService);

  selectedMonth = signal(new Date().toISOString().slice(0, 7));
  newProd = { articolo: '', quantita: 0, prezzoKg: 0, iva: 1.04, divi: 1, totCasse: 0 };

  filteredProducts = computed(() => this.dataService.getProducts(this.selectedMonth()));
  totalImporto = computed(() =>
    this.filteredProducts().reduce((sum, p) => sum + this.calcTotImpo(p), 0).toFixed(2)
  );
  monthLabel = computed(() => {
    const [year, month] = this.selectedMonth().split('-');
    return new Date(+year, +month - 1).toLocaleString('it-IT', { month: 'long', year: 'numeric' });
  });

  ngOnInit(): void {}

  calcTotImpo(p: { quantita: number; prezzoKg: number; iva: number; divi: number; totCasse: number }): number {
    const divi = p.divi || 1;
    return (p.quantita * p.prezzoKg * p.iva) / divi + p.totCasse;
  }

  addProduct(): void {
    if (!this.newProd.articolo || !this.newProd.prezzoKg) return;
    this.dataService.addProduct({
      mese: this.selectedMonth(),
      articolo: this.newProd.articolo.trim(),
      quantita: this.newProd.quantita || 0,
      prezzoKg: this.newProd.prezzoKg,
      iva: this.newProd.iva || 1.04,
      divi: this.newProd.divi || 1,
      totCasse: this.newProd.totCasse || 0,
    });
    this.newProd = { articolo: '', quantita: 0, prezzoKg: 0, iva: 1.04, divi: 1, totCasse: 0 };
  }

  deleteProduct(id: string): void {
    this.dataService.deleteProduct(id);
  }

  prevMonth(): void {
    const [year, month] = this.selectedMonth().split('-').map(Number);
    const d = new Date(year, month - 2);
    this.selectedMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  nextMonth(): void {
    const [year, month] = this.selectedMonth().split('-').map(Number);
    const d = new Date(year, month);
    this.selectedMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  exportExcel(): void {
    const data = this.filteredProducts().map(p => ({
      'ARTICOLO': p.articolo,
      'QUANTI': p.quantita,
      'PREZ KG': p.prezzoKg,
      'IVA': p.iva,
      'DIVI': p.divi,
      'tot casse': p.totCasse,
      'tot impo': +this.calcTotImpo(p).toFixed(2),
    }));
    this.excelService.exportToExcel(data, `InserimentoProdotti_${this.selectedMonth()}`);
  }
}
