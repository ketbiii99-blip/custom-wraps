// Database layer: SQLite via Node's built-in node:sqlite (Node 22.5+). No external dependencies.
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "offers.db");

function open(file = DB_PATH) {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id         TEXT PRIMARY KEY,
    name_ar    TEXT NOT NULL,
    name_en    TEXT NOT NULL,
    color      TEXT NOT NULL DEFAULT '#64748b',
    type       TEXT NOT NULL DEFAULT 'super' CHECK (type IN ('super','online','electronics','fashion','home','other')),
    logo       TEXT,
    website    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id         INTEGER PRIMARY KEY,
    name_ar    TEXT NOT NULL,
    name_en    TEXT,
    category   TEXT NOT NULL CHECK (category IN ('grocery','electronics','fashion','home','beauty','kids','more')),
    sub        TEXT,
    icon       TEXT NOT NULL DEFAULT 'tag',
    img        TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (name_ar, category)
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin','merchant')),
    store_id      TEXT REFERENCES stores(id),
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (role = 'admin' OR store_id IS NOT NULL)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

  -- One row = one store's price for one product during a date range.
  CREATE TABLE IF NOT EXISTS offers (
    id           INTEGER PRIMARY KEY,
    product_id   INTEGER NOT NULL REFERENCES products(id),
    store_id     TEXT NOT NULL REFERENCES stores(id),
    price        REAL NOT NULL CHECK (price > 0),
    old_price    REAL CHECK (old_price IS NULL OR old_price > price),
    starts_on    TEXT,
    ends_on      TEXT,
    emirates     TEXT NOT NULL DEFAULT '["all"]',
    source_type  TEXT NOT NULL CHECK (source_type IN ('merchant','admin','flyer','feed','research','demo')),
    source_url   TEXT,
    source_note  TEXT,
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    submitted_by INTEGER REFERENCES users(id),
    reviewed_by  INTEGER REFERENCES users(id),
    review_note  TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on)
  );
  CREATE INDEX IF NOT EXISTS offers_live ON offers(status, ends_on);
  CREATE INDEX IF NOT EXISTS offers_product ON offers(product_id);
  CREATE INDEX IF NOT EXISTS offers_store ON offers(store_id);
  `);
}

module.exports = { open, DB_PATH };
