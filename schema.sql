-- D1 database schema for Mercatone della Frutta
-- Run with: wrangler d1 execute mercatone-db --file=schema.sql

CREATE TABLE IF NOT EXISTS products (
  id       TEXT PRIMARY KEY,
  mese     TEXT NOT NULL,
  articolo TEXT NOT NULL,
  quantita REAL NOT NULL DEFAULT 0,
  prezzoKg REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS accounting (
  id          TEXT PRIMARY KEY,
  mese        TEXT NOT NULL,
  data        TEXT NOT NULL,
  descrizione TEXT NOT NULL,
  entrate     REAL NOT NULL DEFAULT 0,
  uscite      REAL NOT NULL DEFAULT 0
);
