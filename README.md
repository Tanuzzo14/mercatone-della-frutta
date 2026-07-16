# Gestionale PWA — Mercatone della Frutta

Progressive Web App (PWA) realizzata con **Angular 18** e **TailwindCSS** per sostituire i fogli Excel di gestione prodotti e contabilità. Installabile su Android come app nativa.

---

## Funzionalità principali

| Funzione | Dettaglio |
|---|---|
| 🔐 Login con 2FA | Selezione attività + password + OTP a 6 cifre |
| 📦 Gestione Prodotti | Inserimento articoli con calcolo automatico prezzi ingrosso/dettaglio |
| 💰 Contabilità Pennino | Registrazione entrate/uscite con IVA fissa al 1.04 |
| 📅 Navigazione mensile | Frecce avanti/indietro + input mese per ogni sezione |
| 📱 Mobile-first | Inserimento dati da mobile, footer bar di navigazione |
| 📥 Export XLSX | Esportazione mensilità per ogni sezione |
| 💾 Persistenza dati | Dati salvati in localStorage (no backend necessario) |
| ✅ Installabile | PWA con Service Worker, installabile su Android da Chrome |

---

## Regole di business

- **Prodotti**: `Prezzo Ingrosso = Prezzo/KG × 1.10` (+10%) · `Prezzo Dettaglio = Prezzo/KG × 1.25` (+25%)
- **Contabilità**: `Totale Lordo = (Entrate − Uscite) × 1.04` (IVA fissa 4%)

---

## Credenziali demo

| Attività | Business ID | Password |
|---|---|---|
| Pennino Contabilità | `pennino` | `pennino2024` |
| Mercatone della Frutta | `mercatone` | `frutta2024` |

> **2FA demo**: l'OTP viene stampato nella **console del browser** (DevTools → Console). In produzione sostituire con invio via SMS o email.

---

## Sviluppo locale

```bash
# Installa le dipendenze
npm install

# Avvia server di sviluppo (http://localhost:4200)
npm run start

# Build di produzione
npm run build -- --configuration production
```

---

## Deploy su Cloudflare Pages via GitLab CI/CD

### Nessun tool locale richiesto — tutto automatizzato tramite GitLab.

### 1. Prerequisiti

- Un account su [Cloudflare](https://cloudflare.com)
- Un repository su GitLab con questo codice
- Un progetto Cloudflare Pages già creato (o verrà creato al primo deploy)

### 2. Genera un API Token Cloudflare

1. Vai su [Cloudflare Dashboard](https://dash.cloudflare.com) → **My Profile** → **API Tokens**
2. Clicca **Create Token** → usa il template **Edit Cloudflare Workers**
3. Aggiungi il permesso: `Account > Cloudflare Pages > Edit`
4. Copia il token generato

### 3. Ottieni il tuo Account ID

Vai su **Cloudflare Dashboard** → sidebar destra → copia il valore sotto **Account ID**.

### 4. Configura le variabili su GitLab

Nel tuo repository GitLab, vai su **Settings → CI/CD → Variables** e aggiungi:

| Variabile | Valore | Opzioni |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Il tuo Account ID Cloudflare | Protected, Masked |
| `CLOUDFLARE_API_TOKEN` | Il token API generato | Protected, Masked |
| `CLOUDFLARE_PROJECT_NAME` | Nome del progetto Pages (es. `gestionale-pwa`) | Protected |

### 5. Push e deploy automatico

```bash
git add .
git commit -m "feat: initial deploy"
git push origin main
```

La pipeline GitLab si avvierà automaticamente e:
1. **Build**: installa dipendenze e compila Angular in produzione
2. **Deploy**: pubblica `dist/gestionale-pwa/browser/` su Cloudflare Pages

L'app sarà disponibile su `https://<CLOUDFLARE_PROJECT_NAME>.pages.dev`

### 6. Configurazione dominio personalizzato (opzionale)

Su Cloudflare Dashboard → Pages → il tuo progetto → **Custom domains** → aggiungi il tuo dominio.

---

## Struttura del progetto

```
src/
├── app/
│   ├── auth/
│   │   ├── auth.service.ts      # Autenticazione + 2FA
│   │   ├── auth.guard.ts        # Route guard
│   │   ├── data.service.ts      # Persistenza dati (localStorage)
│   │   └── excel.service.ts     # Export XLSX
│   ├── login/
│   │   └── login.component.ts   # Pagina di login con 2FA
│   ├── products/
│   │   └── products.component.ts # Gestione prodotti (media 15-7)
│   ├── accounting/
│   │   └── accounting.component.ts # Contabilità Pennino
│   ├── app.component.ts         # Layout con Navbar e Footer bar
│   ├── app.routes.ts            # Routing con lazy loading
│   └── app.config.ts            # Configurazione app + PWA
├── index.html
└── styles.css                   # TailwindCSS
public/
├── manifest.webmanifest         # Manifest PWA
└── icons/                       # Icone per installazione
.gitlab-ci.yml                   # Pipeline CI/CD per Cloudflare Pages
```

---

## Installazione come app Android

1. Apri l'URL della tua app in **Chrome** su Android
2. Chrome mostrerà automaticamente il banner "Aggiungi alla schermata Home"
3. In alternativa: menu (⋮) → **Installa app** / **Aggiungi a schermata Home**
4. L'app si aprirà senza barra del browser, come un'app nativa

---

## Note sulla sicurezza

Il sistema 2FA incluso è una **implementazione dimostrativa** con OTP visibile in console. Per un ambiente di produzione si raccomanda:

- Integrazione con servizio SMS (Twilio, Vonage) o email transazionale
- Backend con session management sicuro (JWT / HttpOnly cookies)
- HTTPS obbligatorio (Cloudflare Pages lo fornisce automaticamente)

---

*Progettato e sviluppato per Mercatone della Frutta — PWA v1.0*
