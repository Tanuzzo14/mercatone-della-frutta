import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, AccountingRow } from '../auth/data.service';
import { ExcelService } from '../auth/excel.service';

const IVA = 1.04;

@Component({
  selector: 'app-accounting',
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
      <div class="grid grid-cols-3 gap-2 mb-5">
        <div class="card text-center p-3">
          <p class="text-xs text-gray-500 mb-1 leading-tight">Entrate Lorde</p>
          <p class="text-lg font-bold text-emerald-700">€{{ totalEntrateIva() }}</p>
        </div>
        <div class="card text-center p-3">
          <p class="text-xs text-gray-500 mb-1 leading-tight">Uscite Lorde</p>
          <p class="text-lg font-bold text-red-600">€{{ totalUsciteIva() }}</p>
        </div>
        <div class="card text-center p-3" [class.bg-emerald-50]="saldo() >= 0" [class.bg-red-50]="saldo() < 0">
          <p class="text-xs text-gray-500 mb-1 leading-tight">Saldo IVA</p>
          <p class="text-lg font-bold" [class.text-emerald-700]="saldo() >= 0" [class.text-red-700]="saldo() < 0">
            €{{ saldoFormatted() }}
          </p>
        </div>
      </div>

      <!-- IVA badge -->
      <div class="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-sm">
        <svg class="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
        <span class="text-amber-700"><strong>IVA fissa applicata: 1.04</strong> (4%) su tutte le voci</span>
      </div>

      <!-- Add row form -->
      <div class="card mb-5">
        <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuova Registrazione
        </h3>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Data</label>
            <input type="date" [(ngModel)]="newRow.data" class="input-field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Descrizione</label>
            <input type="text" placeholder="Es. Fattura fornitore, Incasso giornaliero..." [(ngModel)]="newRow.descrizione"
              class="input-field" autocomplete="off" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Entrate (€)</label>
              <input type="number" inputmode="decimal" placeholder="0.00" [(ngModel)]="newRow.entrate"
                min="0" step="0.01" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Uscite (€)</label>
              <input type="number" inputmode="decimal" placeholder="0.00" [(ngModel)]="newRow.uscite"
                min="0" step="0.01" class="input-field" />
            </div>
          </div>

          <!-- Live preview -->
          @if ((newRow.entrate > 0) || (newRow.uscite > 0)) {
            <div class="bg-amber-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-sm">
              <div class="text-center">
                <p class="text-xs text-gray-500">Entrate + IVA</p>
                <p class="font-bold text-emerald-700">€{{ (newRow.entrate * IVA).toFixed(2) }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-500">Uscite + IVA</p>
                <p class="font-bold text-red-600">€{{ (newRow.uscite * IVA).toFixed(2) }}</p>
              </div>
            </div>
          }

          <button (click)="addRow()" [disabled]="!newRow.descrizione" class="btn-primary disabled:opacity-50">
            Aggiungi Registrazione
          </button>
        </div>
      </div>

      <!-- Accounting table -->
      @if (filteredRows().length > 0) {
        <div class="card mb-5 overflow-hidden p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  <th class="p-3 text-left font-semibold">Data</th>
                  <th class="p-3 text-left font-semibold">Descrizione</th>
                  <th class="p-3 text-center font-semibold whitespace-nowrap text-emerald-200">Entrate</th>
                  <th class="p-3 text-center font-semibold whitespace-nowrap text-red-200">Uscite</th>
                  <th class="p-3 text-center font-semibold whitespace-nowrap">Lordo IVA</th>
                  <th class="p-3 text-center font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody>
                @for (r of filteredRows(); track r.id; let odd = $odd) {
                  <tr [class]="odd ? 'bg-gray-50' : 'bg-white'" class="border-b border-gray-100 hover:bg-indigo-50 transition-colors">
                    <td class="p-3 text-gray-500 text-xs whitespace-nowrap">{{ formatDate(r.data) }}</td>
                    <td class="p-3 text-gray-800 font-medium">{{ r.descrizione }}</td>
                    <td class="p-3 text-center text-emerald-700 font-semibold">
                      {{ r.entrate > 0 ? '€' + r.entrate.toFixed(2) : '—' }}
                    </td>
                    <td class="p-3 text-center text-red-600 font-semibold">
                      {{ r.uscite > 0 ? '€' + r.uscite.toFixed(2) : '—' }}
                    </td>
                    <td class="p-3 text-center font-bold"
                      [class.text-emerald-700]="(r.entrate - r.uscite) >= 0"
                      [class.text-red-600]="(r.entrate - r.uscite) < 0">
                      €{{ ((r.entrate - r.uscite) * IVA).toFixed(2) }}
                    </td>
                    <td class="p-3 text-center">
                      <button (click)="deleteRow(r.id)" class="text-red-400 hover:text-red-600 transition-colors p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="bg-gray-100 font-bold text-sm border-t-2 border-gray-200">
                  <td class="p-3 text-gray-700" colspan="2">TOTALE MESE</td>
                  <td class="p-3 text-center text-emerald-700">€{{ totalEntrateIva() }}</td>
                  <td class="p-3 text-center text-red-600">€{{ totalUsciteIva() }}</td>
                  <td class="p-3 text-center" [class.text-emerald-700]="saldo() >= 0" [class.text-red-600]="saldo() < 0">
                    €{{ saldoFormatted() }}
                  </td>
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
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          <p class="text-gray-500 font-medium">Nessuna registrazione per {{ monthLabel() }}</p>
          <p class="text-gray-400 text-sm mt-1">Inserisci la prima registrazione qui sopra</p>
        </div>
      }
    </div>
  `
})
export class AccountingComponent {
  private dataService = inject(DataService);
  private excelService = inject(ExcelService);

  readonly IVA = IVA;
  selectedMonth = signal(new Date().toISOString().slice(0, 7));
  newRow = { data: new Date().toISOString().slice(0, 10), descrizione: '', entrate: 0, uscite: 0 };

  filteredRows = computed(() => this.dataService.getAccounting(this.selectedMonth()));
  totalEntrate = computed(() => this.filteredRows().reduce((s, r) => s + r.entrate, 0));
  totalUscite = computed(() => this.filteredRows().reduce((s, r) => s + r.uscite, 0));
  totalEntrateIva = computed(() => (this.totalEntrate() * IVA).toFixed(2));
  totalUsciteIva = computed(() => (this.totalUscite() * IVA).toFixed(2));
  saldo = computed(() => (this.totalEntrate() - this.totalUscite()) * IVA);
  saldoFormatted = computed(() => this.saldo().toFixed(2));

  monthLabel = computed(() => {
    const [year, month] = this.selectedMonth().split('-');
    return new Date(+year, +month - 1).toLocaleString('it-IT', { month: 'long', year: 'numeric' });
  });

  addRow(): void {
    if (!this.newRow.descrizione) return;
    this.dataService.addAccounting({
      mese: this.selectedMonth(),
      data: this.newRow.data,
      descrizione: this.newRow.descrizione.trim(),
      entrate: this.newRow.entrate || 0,
      uscite: this.newRow.uscite || 0,
    });
    this.newRow = { data: new Date().toISOString().slice(0, 10), descrizione: '', entrate: 0, uscite: 0 };
  }

  deleteRow(id: string): void {
    this.dataService.deleteAccounting(id);
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch { return dateStr; }
  }

  exportExcel(): void {
    const data = this.filteredRows().map(r => ({
      'Data': r.data,
      'Descrizione': r.descrizione,
      'Entrate Nette (€)': r.entrate,
      'Uscite Nette (€)': r.uscite,
      'IVA Applicata': IVA,
      'Entrate Lorde IVA (€)': +(r.entrate * IVA).toFixed(2),
      'Uscite Lorde IVA (€)': +(r.uscite * IVA).toFixed(2),
      'Totale Lordo (€)': +((r.entrate - r.uscite) * IVA).toFixed(2),
    }));
    this.excelService.exportToExcel(data, `Contabilità_Pennino_${this.selectedMonth()}`);
  }
}
