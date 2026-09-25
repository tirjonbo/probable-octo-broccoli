import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { type Product, validateProduct } from "./catalog";
import { type Settings, mergeSettings, validateSettings } from "./config";
import { MEDIA_DIR, db, newId } from "./db";
import { sniffImage } from "./images";

// ---------- Продукты ----------

type RawProduct = { slug: string; data: string; active: number; sort: number };

function parse(r: RawProduct): Product {
  return { ...(JSON.parse(r.data) as Product), slug: r.slug, active: !!r.active, sort: r.sort };
}

/** Все продукты (включая скрытые) — для админки и для уже созданных проектов. */
export const listProducts = cache((activeOnly: boolean = false): Product[] => {
  const rows = db()
    .prepare(`SELECT slug, data, active, sort FROM products ${activeOnly ? "WHERE active = 1" : ""} ORDER BY sort, slug`)
    .all() as RawProduct[];
  return rows.map(parse);
});

export function getProduct(slug: string): Product | undefined {
  const r = db().prepare("SELECT slug, data, active, sort FROM products WHERE slug = ?").get(slug) as RawProduct | undefined;
  return r ? parse(r) : undefined;
}

export class ContentError extends Error {}

export function saveProduct(input: Record<string, unknown>, originalSlug?: string): Product {
  let p: Product;
  try {
    p = validateProduct(input);
  } catch (e) {
    throw new ContentError((e as Error).message);
  }
  const d = db();
  if (originalSlug && originalSlug !== p.slug) {
    // Смена адреса ломает ссылки из проектов — запрещаем, если продукт уже используется.
    const used = d.prepare("SELECT 1 FROM projects WHERE product = ? LIMIT 1").get(originalSlug);
    if (used) throw new ContentError("Адрес нельзя изменить: по продукту уже есть проекты клиентов");
  }
  if ((!originalSlug || originalSlug !== p.slug) && d.prepare("SELECT 1 FROM products WHERE slug = ?").get(p.slug))
    throw new ContentError("Продукт с таким адресом уже есть");
  const data = JSON.stringify(p);
  if (originalSlug)
    d.prepare("UPDATE products SET slug = ?, data = ?, active = ?, sort = ?, updated_at = datetime('now') WHERE slug = ?").run(
      p.slug,
      data,
      p.active ? 1 : 0,
      p.sort,
      originalSlug,
    );
  else d.prepare("INSERT INTO products (slug, data, active, sort) VALUES (?, ?, ?, ?)").run(p.slug, data, p.active ? 1 : 0, p.sort);
  return p;
}

export function deleteProduct(slug: string) {
  const used = db().prepare("SELECT 1 FROM projects WHERE product = ? LIMIT 1").get(slug);
  if (used) throw new ContentError("По продукту есть проекты клиентов — вместо удаления скройте его");
  db().prepare("DELETE FROM products WHERE slug = ?").run(slug);
}

// ---------- Настройки ----------

export const getSettings = cache((): Settings => {
  const rows = db().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const saved: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      saved[r.key] = JSON.parse(r.value);
    } catch {
      /* повреждённое значение — берём значение по умолчанию */
    }
  }
  return mergeSettings(saved);
});

export function saveSettings(input: Record<string, Record<string, unknown>>): Settings {
  const s = validateSettings(input);
  const ins = db().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  for (const [k, v] of Object.entries(s)) ins.run(k, JSON.stringify(v));
  return s;
}

// ---------- Баннеры ----------

export type Banner = {
  id: string;
  title: string;
  text: string;
  button_label: string;
  link: string;
  image: string | null;
  color: string;
  active: number;
  sort: number;
};

export function listBanners(activeOnly = false): Banner[] {
  return db()
    .prepare(`SELECT * FROM banners ${activeOnly ? "WHERE active = 1" : ""} ORDER BY sort, created_at`)
    .all() as Banner[];
}

export function saveBanner(x: Record<string, unknown>, id?: string): void {
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const title = s(x.title, 160);
  if (!title) throw new ContentError("Заполните заголовок баннера");
  const color = /^#[0-9a-fA-F]{6}$/.test(s(x.color, 7)) ? s(x.color, 7) : "#efe6da";
  const vals = [title, s(x.text, 400), s(x.button_label, 60), s(x.link, 300), s(x.image, 60) || null, color, x.active === false ? 0 : 1, Math.round(Number(x.sort)) || 0];
  if (id)
    db()
      .prepare("UPDATE banners SET title = ?, text = ?, button_label = ?, link = ?, image = ?, color = ?, active = ?, sort = ? WHERE id = ?")
      .run(...vals, id);
  else
    db()
      .prepare("INSERT INTO banners (title, text, button_label, link, image, color, active, sort, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...vals, newId());
}

export function deleteBanner(id: string) {
  db().prepare("DELETE FROM banners WHERE id = ?").run(id);
}

// ---------- Медиатека (публичные картинки: баннеры, продукты) ----------

export async function saveMedia(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new ContentError("Картинка больше 10 МБ");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(buf);
  if (!type) throw new ContentError("Поддерживаются JPEG, PNG и WebP");
  const id = newId();
  const name = `${id}.${type.ext}`;
  await fs.writeFile(path.join(MEDIA_DIR, name), buf);
  db().prepare("INSERT INTO media (id, file, mime) VALUES (?, ?, ?)").run(id, name, type.mime);
  return id;
}

export async function readMedia(id: string): Promise<{ data: Buffer; mime: string } | null> {
  const row = db().prepare("SELECT file, mime FROM media WHERE id = ?").get(id) as { file: string; mime: string } | undefined;
  if (!row) return null;
  return { data: await fs.readFile(path.join(MEDIA_DIR, path.basename(row.file))), mime: row.mime };
}

export const mediaUrl = (id: string) => `/api/media/${id}`;
