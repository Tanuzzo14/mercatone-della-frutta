import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, AccountingRow } from '../auth/data.service';
import { ExcelService } from '../auth/excel.service';

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
          <p class="text-xs text-gray-500 mb-1 leading-tight">Tot Acq+Giac</p>
          <p class="text-lg font-bold text-red-600">€{{ totalAcq() }}</p>
        </div>
        <div class="card text-center p-3">
          <p class="text-xs text-gray-500 mb-1 leading-tight">Tot Vendite</p>
          <p class="text-lg font-bold text-emerald-700">€{{ totalVend() }}</p>
        </div>
        <div class="card text-center p-3"
          [class.bg-emerald-50]="acqMenoVend() >= 0"
          [class.bg-red-50]="acqMenoVend() < 0">
          <p class="text-xs text-gray-500 mb-1 leading-tight">Acq – Vend</p>
          <p class="text-lg font-bold"
            [class.text-emerald-700]="acqMenoVend() >= 0"
            [class.text-red-700]="acqMenoVend() < 0">
            €{{ acqMenoVendFormatted() }}
          </p>
        </div>
      </div>

      <!-- Add row form -->
      <div class="card mb-5">
        <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuova Registrazione
        </h3>

        <div class="space-y-3">
          <!-- ACQUISTI -->
          <p class="text-xs font-bold text-gray-400 uppercase tracking-wide">Acquisto</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">FATT ACQ (€)</label>
              <input type="number" inputmode="decimal" placeholder="0.00" [(ngModel)]="newRow.fattAcq"
                min="0" step="0.01" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Data Acquisto</label>
              <input type="text" placeholder="Es. 01/07, 01/al13" [(ngModel)]="newRow.dataAcq"
                class="input-field" autocomplete="off" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Denominazione Acquisto</label>
            <input type="text" placeholder="Es. DISEL, CT, lad fik" [(ngModel)]="newRow.denom"
              class="input-field" autocomplete="off" />
          </div>

          <!-- VENDITE -->
          <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mt-2">Vendita</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Vendite (€)</label>
              <input type="number" inputmode="decimal" placeholder="0.00" [(ngModel)]="newRow.vendite"
                min="0" step="0.01" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Data Vendita</label>
              <input type="text" placeholder="Es. 04/07, 01/al13" [(ngModel)]="newRow.dataVend"
                class="input-field" autocomplete="off" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Denominazione Vendita</label>
            <input type="text" placeholder="Es. ss+en, neg, nid,gut,arcoba" [(ngModel)]="newRow.denomVend"
              class="input-field" autocomplete="off" />
          </div>

          <button (click)="addRow()" [disabled]="!newRow.denom && !newRow.denomVend && !newRow.fattAcq && !newRow.vendite" class="btn-primary disabled:opacity-50">
            Aggiungi Registrazione
          </button>
        </div>
      </div>

      <!-- Pennino table -->
      @if (filteredRows().length > 0) {
        <div class="card mb-5 overflow-hidden p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  <th class="p-3 text-center font-semibold whitespace-nowrap text-red-200">FATT ACQ</th>
                  <th class="p-3 text-left font-semibold whitespace-nowrap">data</th>
                  <th class="p-3 text-left font-semibold whitespace-nowrap">denom</th>
                  <th class="p-3 text-center font-semibold whitespace-nowrap text-emerald-200">vendite</th>
                  <th class="p-3 text-left font-semibold whitespace-nowrap">data vend</th>
                  <th class="p-3 text-left font-semibold whitespace-nowrap">deno vend</th>
                  <th class="p-3 text-center font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody>
                @for (r of filteredRows(); track r.id; let odd = $odd) {
                  <tr [class]="odd ? 'bg-gray-50' : 'bg-white'" class="border-b border-gray-100 hover:bg-indigo-50 transition-colors">
                    <td class="p-3 text-center text-red-600 font-semibold">
                      {{ r.fattAcq > 0 ? '€' + r.fattAcq.toFixed(2) : '—' }}
                    </td>
                    <td class="p-3 text-gray-500 text-xs whitespace-nowrap">{{ r.dataAcq || '—' }}</td>
                    <td class="p-3 text-gray-800 font-medium">{{ r.denom || '—' }}</td>
                    <td class="p-3 text-center text-emerald-700 font-semibold">
                      {{ r.vendite > 0 ? '€' + r.vendite.toFixed(2) : '—' }}
                    </td>
                    <td class="p-3 text-gray-500 text-xs whitespace-nowrap">{{ r.dataVend || '—' }}</td>
                    <td class="p-3 text-gray-800">{{ r.denomVend || '—' }}</td>
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
                  <td class="p-3 text-center text-red-600">€{{ totalAcq() }}</td>
                  <td class="p-3 text-gray-700 text-xs" colspan="2">tot acq+giac</td>
                  <td class="p-3 text-center text-emerald-700">€{{ totalVend() }}</td>
                  <td class="p-3 text-gray-700 text-xs">tot vend</td>
                  <td class="p-3 text-center font-bold"
                    [class.text-emerald-700]="acqMenoVend() >= 0"
                    [class.text-red-700]="acqMenoVend() < 0">
                    acq-vend: €{{ acqMenoVendFormatted() }}
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

  selectedMonth = signal(new Date().toISOString().slice(0, 7));
  newRow = { fattAcq: 0, dataAcq: '', denom: '', vendite: 0, dataVend: '', denomVend: '' };

  filteredRows = computed(() => this.dataService.getAccounting(this.selectedMonth()));
  totalAcq = computed(() => this.filteredRows().reduce((s, r) => s + r.fattAcq, 0).toFixed(2));
  totalVend = computed(() => this.filteredRows().reduce((s, r) => s + r.vendite, 0).toFixed(2));
  acqMenoVend = computed(() =>
    this.filteredRows().reduce((s, r) => s + r.fattAcq, 0) -
    this.filteredRows().reduce((s, r) => s + r.vendite, 0)
  );
  acqMenoVendFormatted = computed(() => this.acqMenoVend().toFixed(2));

  monthLabel = computed(() => {
    const [year, month] = this.selectedMonth().split('-');
    return new Date(+year, +month - 1).toLocaleString('it-IT', { month: 'long', year: 'numeric' });
  });

  addRow(): void {
    if (!this.newRow.denom && !this.newRow.denomVend && !this.newRow.fattAcq && !this.newRow.vendite) return;
    this.dataService.addAccounting({
      mese: this.selectedMonth(),
      fattAcq: this.newRow.fattAcq || 0,
      dataAcq: this.newRow.dataAcq.trim(),
      denom: this.newRow.denom.trim(),
      vendite: this.newRow.vendite || 0,
      dataVend: this.newRow.dataVend.trim(),
      denomVend: this.newRow.denomVend.trim(),
    });
    this.newRow = { fattAcq: 0, dataAcq: '', denom: '', vendite: 0, dataVend: '', denomVend: '' };
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

  exportExcel(): void {
    const rows = this.filteredRows();
    const data = rows.map(r => ({
      'FATT ACQ': r.fattAcq,
      'data': r.dataAcq,
      'denom': r.denom,
      'vendite': r.vendite,
      'data vend': r.dataVend,
      'deno vend': r.denomVend,
    }));
    // Append totals row
    data.push({
      'FATT ACQ': +this.totalAcq(),
      'data': 'tot acq+giac',
      'denom': '',
      'vendite': +this.totalVend(),
      'data vend': 'tot vend',
      'deno vend': `acq-vend: ${this.acqMenoVendFormatted()}`,
    });
    this.excelService.exportToExcel(data, `Pennino_${this.selectedMonth()}`);
  }
}
