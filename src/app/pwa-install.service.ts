import { Injectable, computed, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type InstallFeedbackType = 'info' | 'success' | 'error';

interface InstallFeedback {
  type: InstallFeedbackType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);

  readonly isInstalling = signal(false);
  readonly isInstalled = signal(false);
  readonly isIos = signal(false);
  readonly feedback = signal<InstallFeedback | null>(null);

  readonly canInstall = computed(() => !!this.deferredPrompt() && !this.isInstalled());
  readonly availabilityMessage = computed(() => {
    if (this.isInstalled()) return 'App già installata su questo dispositivo.';
    if (this.isIos()) return 'Su iOS usa Safari: Condividi → Aggiungi a schermata Home.';
    if (this.canInstall()) return 'Installazione disponibile su Android/Windows.';
    return 'Installazione non disponibile su questo browser/dispositivo.';
  });

  constructor() {
    if (typeof window === 'undefined') return;

    this.isIos.set(this.detectIos());
    this.isInstalled.set(this.detectInstalled());

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt.set(event as BeforeInstallPromptEvent);
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.deferredPrompt.set(null);
      this.feedback.set({
        type: 'success',
        message: 'App installata correttamente.'
      });
    });
  }

  async installApp(): Promise<void> {
    this.feedback.set(null);

    if (this.isInstalled()) {
      this.feedback.set({ type: 'info', message: 'App già installata su questo dispositivo.' });
      return;
    }

    if (this.isIos()) {
      this.feedback.set({
        type: 'info',
        message: 'Su iOS installa da Safari con Condividi → Aggiungi a schermata Home.'
      });
      return;
    }

    const promptEvent = this.deferredPrompt();
    if (!promptEvent) {
      this.feedback.set({
        type: 'error',
        message: 'Installazione non disponibile al momento su questo dispositivo.'
      });
      return;
    }

    this.isInstalling.set(true);
    try {
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        this.feedback.set({ type: 'success', message: 'Installazione avviata.' });
      } else {
        this.feedback.set({ type: 'info', message: 'Installazione annullata.' });
      }
      this.deferredPrompt.set(null);
    } catch {
      this.feedback.set({
        type: 'error',
        message: "Errore durante l'installazione. Riprova più tardi."
      });
    } finally {
      this.isInstalling.set(false);
    }
  }

  private detectIos(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  private detectInstalled(): boolean {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    return isStandalone || isIosStandalone;
  }
}
