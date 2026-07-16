import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExcelService {
  exportToExcel(data: Record<string, unknown>[], filename: string): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    // Auto-size columns
    const colWidths = Object.keys(data[0] ?? {}).map(key => ({
      wch: Math.max(key.length, ...data.map(r => String(r[key] ?? '').length)) + 2
    }));
    ws['!cols'] = colWidths;
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dati Mensili');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}
