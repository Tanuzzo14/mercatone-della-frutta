# Gestionale PWA — ***** della Frutta

Progressive Web App (PWA) realizzata con **Angular 18** e **TailwindCSS** per sostituire i fogli Excel di gestione prodotti e contabilità. Installabile su Android come app nativa.

---

## Funzionalità principali

| Funzione | Dettaglio |
|---|---|
| 🔐 Login ***** | Accesso ***** con OTP a 6 cifre + fallback password |
| 📦 Gestione Prodotti | Inserimento articoli con calcolo automatico prezzi ingrosso/dettaglio |
| 💰 Contabilità Pennino | Registrazione entrate/uscite con IVA fissa al 1.04 |
| 📅 Navigazione mensile | Frecce avanti/indietro + input mese per ogni sezione |
| 📱 Mobile-first | Inserimento dati da mobile, footer bar di navigazione |
| 📥 Export XLSX | Esportazione mensilità per ogni sezione |
| ☁️ Persistenza dati | Dati salvati su Cloudflare D1 (SQLite serverless) |
| ✅ Installabile | PWA con Service Worker, installabile su Android da Chrome |

---

## Regole di business

- **Prodotti**: `Prezzo Ingrosso = Prezzo/KG × 1.10` (+10%) · `Prezzo Dettaglio = Prezzo/KG × 1.25` (+25%)
- **Contabilità**: `Totale Lordo = (Entrate − Uscite) × 1.04` (IVA fissa 4%)

---

## Credenziali demo

| Attività | Business ID | Password |
|---|---|---|
| ***** della Frutta | `*****` | `*****2025!` |

> **2FA demo**: l'OTP viene stampato nella **console del browser** (DevTools → Console). Se il provider OTP è esaurito/non disponibile, è possibile accedere con la password ***** e cambiarla da **La mia pagina**.

---

## Deploy su Cloudflare Pages da GitHub

### Tutto automatizzato — basta un push su `main`.

### 1. Crea il database D1

```bash
# Installa wrangler (una volta sola)
npm install -g wrangler
wrangler login

# Crea il database D1
wrangler d1 create *****-db

# Copia il database_id mostrato nell'output e incollalo in wrangler.toml
# Sostituisci YOUR_D1_DATABASE_ID con l'ID ottenuto

# Inizializza le tabelle
wrangler d1 execute *****-db --file=schema.sql
```

### 2. Aggiorna `wrangler.toml`

Apri `wrangler.toml` e sostituisci `YOUR_D1_DATABASE_ID` con l'ID ottenuto al passo precedente:

```toml
name = "*****-della-frutta"
pages_build_output_dir = "dist/gestionale-pwa/browser"

[[d1_databases]]
binding = "DB"
database_name = "*****-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← il tuo ID
```

### 3. Collega il repository a Cloudflare Pages

1. Vai su [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Seleziona il repository `*****-della-frutta`
3. Impostazioni di build:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/gestionale-pwa/browser`
   - *(Cloudflare leggerà queste impostazioni anche da `wrangler.toml`)*
4. Clicca **Save and Deploy**

### 4. Collega il database D1 al progetto Pages

1. Vai su **Workers & Pages** → il tuo progetto → **Settings** → **Bindings**
2. Clicca **Add binding** → **D1 database**
3. Imposta:
   - **Variable name**: `DB`
   - **D1 database**: seleziona `*****-db`
4. Salva e rideploya

### 5. Push e deploy automatico

Da questo momento ogni push su `main` avvia automaticamente il deploy:

```bash
git add .
git commit -m "feat: aggiornamento"
git push origin main
```

L'app sarà disponibile su `https://*****-della-frutta.pages.dev`

---

## Architettura backend (Cloudflare Functions + D1)

Le API serverless si trovano nella cartella `functions/` e vengono eseguite automaticamente da Cloudflare Pages:

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/api/products` | `GET` | Legge tutti i prodotti dal database D1 |
| `/api/products` | `POST` | Salva un nuovo prodotto su D1 |
| `/api/products/:id` | `DELETE` | Elimina un prodotto da D1 |
| `/api/accounting` | `GET` | Legge tutte le registrazioni contabili da D1 |
| `/api/accounting` | `POST` | Salva una nuova registrazione su D1 |
| `/api/accounting/:id` | `DELETE` | Elimina una registrazione da D1 |
| `/api/auth/send-otp` | `POST` | Invia OTP per login ***** |
| `/api/auth/verify-otp` | `POST` | Verifica OTP ***** |
| `/api/auth/login-password` | `POST` | Login fallback con password ***** |
| `/api/auth/change-password` | `POST` | Cambio password da La mia pagina |

L'app Angular chiama queste API tramite HTTP per leggere e salvare i dati.

---

## Sviluppo locale

```bash
# Installa le dipendenze
npm install

# Sviluppo locale CON le funzioni (richiede wrangler)
npx wrangler pages dev -- ng serve --configuration development

# Solo frontend senza backend (le API non saranno disponibili)
npm run start

# Build di produzione
npm run build
```

---

## Struttura del progetto

```
src/
├── app/
│   ├── auth/
│   │   ├── auth.service.ts      # Autenticazione + 2FA
│   │   ├── auth.guard.ts        # Route guard
│   │   ├── data.service.ts      # Chiamate HTTP alle API D1
│   │   └── excel.service.ts     # Export XLSX
│   ├── login/
│   │   └── login.component.ts   # Login ***** con OTP + fallback password
│   ├── products/
│   │   └── products.component.ts # Gestione prodotti
│   ├── accounting/
│   │   └── accounting.component.ts # Contabilità Pennino
│   ├── profile/
│   │   └── profile.component.ts   # La mia pagina (cambio password)
│   ├── app.component.ts         # Layout con Navbar e Footer bar
│   ├── app.routes.ts            # Routing con lazy loading
│   └── app.config.ts            # Configurazione app + PWA + HttpClient
├── index.html
└── styles.css                   # TailwindCSS
functions/
├── api/
│   ├── products/
│   │   ├── index.js             # GET /api/products, POST /api/products
│   │   └── [id].js              # DELETE /api/products/:id
│   ├── accounting/
│   │   ├── index.js             # GET /api/accounting, POST /api/accounting
│   │   └── [id].js              # DELETE /api/accounting/:id
│   └── auth/
│       ├── send-otp.js          # POST /api/auth/send-otp
│       ├── verify-otp.js        # POST /api/auth/verify-otp
│       ├── login-password.js    # POST /api/auth/login-password
│       └── change-password.js   # POST /api/auth/change-password
public/
├── manifest.webmanifest         # Manifest PWA
└── icons/                       # Icone per installazione
schema.sql                       # Schema SQL per inizializzare D1
wrangler.toml                    # Configurazione Cloudflare Pages + D1
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

*Progettato e sviluppato per ***** della Frutta — PWA v2.0*
