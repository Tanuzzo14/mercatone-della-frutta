import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
      <h2 class="text-2xl font-bold text-gray-900">La mia pagina</h2>
      <p class="text-sm text-gray-500">Cambia la password di accesso Mercatone inserendo vecchia e nuova password.</p>

      <div class="card space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Vecchia password</label>
          <input
            type="password"
            class="input-field"
            [(ngModel)]="oldPassword"
            placeholder="Inserisci la vecchia password"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nuova password</label>
          <input
            type="password"
            class="input-field"
            [(ngModel)]="newPassword"
            placeholder="Inserisci la nuova password"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Conferma nuova password</label>
          <input
            type="password"
            class="input-field"
            [(ngModel)]="confirmNewPassword"
            placeholder="Conferma la nuova password"
          />
        </div>

        @if (errorMsg()) {
          <div class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {{ errorMsg() }}
          </div>
        }

        @if (successMsg()) {
          <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {{ successMsg() }}
          </div>
        }

        <button class="btn-primary" (click)="changePassword()" [disabled]="loading()">
          @if (loading()) {
            Salvataggio...
          } @else {
            Salva nuova password
          }
        </button>
      </div>
    </section>
  `,
})
export class ProfileComponent {
  private auth = inject(AuthService);

  oldPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  async changePassword(): Promise<void> {
    this.errorMsg.set('');
    this.successMsg.set('');

    if (!this.oldPassword || !this.newPassword || !this.confirmNewPassword) {
      this.errorMsg.set('Compila tutti i campi.');
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.errorMsg.set('La nuova password e la conferma non coincidono.');
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMsg.set('La nuova password deve contenere almeno 8 caratteri.');
      return;
    }

    this.loading.set(true);
    try {
      const changed = await this.auth.changePassword(this.oldPassword, this.newPassword);
      if (!changed) {
        this.errorMsg.set('Vecchia password non valida o errore durante il cambio password.');
        return;
      }

      this.successMsg.set('Password aggiornata con successo.');
      this.oldPassword = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
    } finally {
      this.loading.set(false);
    }
  }
}
