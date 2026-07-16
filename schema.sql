-- D1 database schema for Mercatone della Frutta
-- Run with: wrangler d1 execute mercatone-db --file=schema.sql

-- Foglio: Inserimento Prodotti (media 15-7.xlsx)
-- Colonne: ARTICOLO | QUANTI | PREZ KG | IVA | DIVI | tot casse | tot impo (calcolato)
CREATE TABLE IF NOT EXISTS products (
  id        TEXT PRIMARY KEY,
  mese      TEXT NOT NULL,
  articolo  TEXT NOT NULL,
  quantita  REAL NOT NULL DEFAULT 0,
  prezzoKg  REAL NOT NULL DEFAULT 0,
  iva       REAL NOT NULL DEFAULT 1.04,
  divi      REAL NOT NULL DEFAULT 1,
  totCasse  REAL NOT NULL DEFAULT 0
);

-- OTP codes (expire after 60 s; used = 1 once consumed)
CREATE TABLE IF NOT EXISTS otp_codes (
  id          TEXT    PRIMARY KEY,
  business_id TEXT    NOT NULL,
  code        TEXT    NOT NULL,
  expires_at  INTEGER NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0
);

-- Password login for Mercatone (SHA-256 hash)
CREATE TABLE IF NOT EXISTS auth_passwords (
  business_id   TEXT    PRIMARY KEY,
  password_hash TEXT    NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- Password hash of default value: Mercatone2025!
INSERT OR IGNORE INTO auth_passwords (business_id, password_hash, updated_at)
VALUES ('mercatone', 'e81c8ec60ccf885a3b8a1f43c752a3dfeeb22228de5354af3efa96a0c9b7f3b2', strftime('%s', 'now') * 1000);

-- Foglio: Pennino (PENNINO AZIENDA CALCOLO ENTRATE +USCITE REVISIONATO.xlsx - acq+ vendite revisio)
-- Colonne: FATT ACQ | data | denom | vendite | data vend | deno vend
-- Totali calcolati: tot acq+giac (somma fattAcq), tot vend (somma vendite), acq-vend
CREATE TABLE IF NOT EXISTS accounting (
  id         TEXT PRIMARY KEY,
  mese       TEXT NOT NULL,
  fattAcq    REAL NOT NULL DEFAULT 0,
  dataAcq    TEXT NOT NULL DEFAULT '',
  denom      TEXT NOT NULL DEFAULT '',
  vendite    REAL NOT NULL DEFAULT 0,
  dataVend   TEXT NOT NULL DEFAULT '',
  denomVend  TEXT NOT NULL DEFAULT ''
);
