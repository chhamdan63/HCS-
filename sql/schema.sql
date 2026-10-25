-- Hamdan Commission Shop Portal — PostgreSQL schema
-- The live schema is defined in src/db/schema.ts (Drizzle ORM) and applied with `npx drizzle-kit push`.
-- This file mirrors it and is provided for reference/manual installs.

CREATE TYPE store_status AS ENUM ('Active', 'Inactive', 'Fixed');
CREATE TYPE ledger_ref_type AS ENUM ('invoice', 'invoice_expense', 'purchase', 'manual');

CREATE TABLE users (
  id                  SERIAL PRIMARY KEY,
  username            VARCHAR(50) NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stores (
  id            SERIAL PRIMARY KEY,
  store_name    VARCHAR(255) NOT NULL,
  store_address TEXT,
  store_phone   VARCHAR(20),
  store_bank    VARCHAR(100),
  status        store_status NOT NULL DEFAULT 'Active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX stores_store_name_lower_idx ON stores (lower(store_name));

CREATE TABLE settings (
  setting_key   VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id            SERIAL PRIMARY KEY,
  invoice_date  DATE NOT NULL,
  agent_code    VARCHAR(50) NOT NULL,
  bilty_no      VARCHAR(50) NOT NULL,
  vehicle_no    VARCHAR(50) NOT NULL,
  permit_no     VARCHAR(50),
  corncost      NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission    NUMERIC(12,2) NOT NULL DEFAULT 0,
  labour        NUMERIC(12,2) NOT NULL DEFAULT 0,
  thread        NUMERIC(12,2) NOT NULL DEFAULT 0,
  brokery       NUMERIC(12,2) NOT NULL DEFAULT 0,
  plastic_bag   NUMERIC(12,2) NOT NULL DEFAULT 0,
  market_fee    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_bori    INTEGER NOT NULL DEFAULT 0,
  total_weight  NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_snapshot JSONB NOT NULL DEFAULT '{}',
  charge_overrides JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoice_items (
  id           SERIAL PRIMARY KEY,
  invoice_id   INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  store_id     INTEGER NOT NULL REFERENCES stores(id),
  store_name   VARCHAR(255) NOT NULL,
  qty_bori     INTEGER NOT NULL,
  qty_kg       NUMERIC(10,2) NOT NULL DEFAULT 0,
  price        NUMERIC(10,2) NOT NULL,
  total_weight NUMERIC(12,2) NOT NULL,
  amount       NUMERIC(12,2) NOT NULL
);
CREATE INDEX invoice_items_invoice_idx ON invoice_items (invoice_id);
CREATE INDEX invoice_items_store_idx ON invoice_items (store_id);

CREATE TABLE purchases (
  id            SERIAL PRIMARY KEY,
  purchase_date DATE NOT NULL,
  store_id      INTEGER NOT NULL REFERENCES stores(id),
  store_name    VARCHAR(255) NOT NULL,
  total_bori    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_weight  NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_items (
  id          SERIAL PRIMARY KEY,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  qty_bori    NUMERIC(10,2) NOT NULL DEFAULT 0,
  qty_kg      NUMERIC(10,2) NOT NULL DEFAULT 0,
  rate        NUMERIC(10,2) NOT NULL,
  weight_kg   NUMERIC(12,2) NOT NULL,
  amount      NUMERIC(12,2) NOT NULL
);
CREATE INDEX purchase_items_purchase_idx ON purchase_items (purchase_id);

CREATE TABLE store_ledger (
  id               SERIAL PRIMARY KEY,
  store_id         INTEGER NOT NULL REFERENCES stores(id),
  store_name       VARCHAR(255) NOT NULL,
  transaction_date DATE NOT NULL,
  description      TEXT NOT NULL,
  debit            NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit           NUMERIC(15,2) NOT NULL DEFAULT 0,
  ref_type         ledger_ref_type NOT NULL,
  ref_id           INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_side_only CHECK (debit > 0 OR credit > 0)
);
CREATE INDEX store_ledger_store_date_idx ON store_ledger (store_id, transaction_date);
CREATE INDEX store_ledger_ref_idx ON store_ledger (ref_type, ref_id);

CREATE TABLE audit_log (
  id          SERIAL PRIMARY KEY,
  action      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   INTEGER NOT NULL,
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE login_attempts (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50) NOT NULL,
  ip         VARCHAR(64) NOT NULL DEFAULT '',
  success    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_user_idx ON login_attempts (username, created_at);
