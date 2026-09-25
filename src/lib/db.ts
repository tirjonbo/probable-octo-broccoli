import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { hashPassword } from "./password";
import { DEFAULT_PRODUCTS } from "./catalog";

export const DATA_DIR = process.env.DATA_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), "data");
export const UPLOAD_DIR = path.join(/* turbopackIgnore: true */ DATA_DIR, "uploads");
export const MEDIA_DIR = path.join(/* turbopackIgnore: true */ DATA_DIR, "media");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  title TEXT NOT NULL,
  config TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file TEXT NOT NULL,
  mime TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  certificate_amount INTEGER,
  qty INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  contact TEXT NOT NULL,
  delivery TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  delivery_price INTEGER NOT NULL,
  certificate_used INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  promo_code TEXT,
  certificate_code TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  project_snapshot TEXT,
  certificate_amount INTEGER
);
CREATE TABLE IF NOT EXISTS promo_codes (
  code TEXT PRIMARY KEY,
  percent INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS certificates (
  code TEXT PRIMARY KEY,
  amount INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  order_id TEXT REFERENCES orders(id),
  active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  button_label TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  image TEXT,
  color TEXT NOT NULL DEFAULT '#efe6da',
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  file TEXT NOT NULL,
  mime TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_order_events ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

function seed(db: DatabaseSync) {
  const first = (db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n === 0;
  if (first) {
    // Первый запуск: стартовый каталог, приветственный промокод и баннер.
    const ins = db.prepare("INSERT INTO products (slug, data, active, sort) VALUES (?, ?, 1, ?)");
    for (const p of DEFAULT_PRODUCTS) ins.run(p.slug, JSON.stringify(p), p.sort);
    db.prepare("INSERT OR IGNORE INTO promo_codes (code, percent) VALUES (?, ?)").run("WELCOME10", 10);
    if ((db.prepare("SELECT COUNT(*) AS n FROM banners").get() as { n: number }).n === 0)
      db.prepare("INSERT INTO banners (id, title, text, button_label, link, color, sort) VALUES (?, ?, ?, ?, ?, ?, 0)").run(
        newId(),
        "Скидка 10% на первый заказ",
        "Введите промокод WELCOME10 при оформлении.",
        "Выбрать продукт",
        "/catalog",
        "#f4e6e1",
      );
  }
  const count = db.prepare("SELECT COUNT(*) AS n FROM reviews").get() as { n: number };
  if (count.n === 0) {
    const ins = db.prepare("INSERT INTO reviews (id, author, text, rating) VALUES (?, ?, ?, ?)");
    ins.run(newId(), "Анна, Казань", "Собрала книгу о первом годе дочки за вечер — автозаполнение сделало половину работы.", 5);
    ins.run(newId(), "Игорь, Москва", "Заказал льняную обложку в подарок родителям. Цвета на печати совпали с экраном.", 5);
    ins.run(newId(), "Марина, Пермь", "Календари на весь офис — удобно, что можно отметить свои праздники.", 4);
  }
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail) as { id: string } | undefined;
    if (existing) db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
    else
      db.prepare("INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, 'admin')").run(
        newId(),
        adminEmail,
        "Администратор",
        hashPassword(adminPassword),
      );
  }
}

/** Добавляет колонки, появившиеся после создания базы. */
function migrate(db: DatabaseSync) {
  const has = (table: string, col: string) =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).some((c) => c.name === col);
  if (!has("orders", "payment_method")) db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'");
  if (!has("orders", "admin_note")) db.exec("ALTER TABLE orders ADD COLUMN admin_note TEXT NOT NULL DEFAULT ''");
  if (!has("orders", "updated_at")) db.exec("ALTER TABLE orders ADD COLUMN updated_at TEXT");
  if (!has("reviews", "active")) db.exec("ALTER TABLE reviews ADD COLUMN active INTEGER NOT NULL DEFAULT 1");
  if (!has("promo_codes", "created_at")) db.exec("ALTER TABLE promo_codes ADD COLUMN created_at TEXT");
  if (!has("certificates", "note")) db.exec("ALTER TABLE certificates ADD COLUMN note TEXT NOT NULL DEFAULT ''");
  // Старые сессии копятся — чистим просроченные при старте.
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
}

/**
 * node:sqlite отдаёт строки как объекты без прототипа — React не может передать их
 * в клиентские компоненты. Превращаем результаты get/all в обычные объекты.
 */
function plainRows(d: DatabaseSync) {
  const prepare = d.prepare.bind(d);
  d.prepare = ((sql: string) => {
    const st = prepare(sql);
    const get = st.get.bind(st);
    const all = st.all.bind(st);
    st.get = ((...args: Parameters<typeof get>) => {
      const r = get(...args);
      return r ? { ...r } : r;
    }) as typeof st.get;
    st.all = ((...args: Parameters<typeof all>) => all(...args).map((r) => ({ ...r }))) as typeof st.all;
    return st;
  }) as typeof d.prepare;
}

const globalForDb = globalThis as unknown as { __db?: DatabaseSync };

export function db(): DatabaseSync {
  if (!globalForDb.__db) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
    const d = new DatabaseSync(path.join(DATA_DIR, "app.db"));
    plainRows(d);
    d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    d.exec(SCHEMA);
    migrate(d);
    seed(d);
    globalForDb.__db = d;
  }
  return globalForDb.__db;
}

export function newId(): string {
  return crypto.randomUUID();
}

/** Выполняет fn в транзакции. */
export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const r = fn();
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
