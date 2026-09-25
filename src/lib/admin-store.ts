import "server-only";
import crypto from "node:crypto";
import { type OrderStatus, ORDER_STATUSES, normalizePhone, recalcTotals } from "./catalog";
import { ContentError } from "./content-store";
import { db, newId, tx } from "./db";
import { hashPassword } from "./password";
import { type OrderRow, addEvent, getOrder, listOrders as listUserOrders, markPaid, setOrderStatus, unmarkPaid } from "./shop";

const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const n = (v: unknown) => {
  const x = Math.round(Number(v));
  return Number.isFinite(x) ? x : 0;
};

// ---------- Заказы ----------

export function searchOrders(q: { status?: string; search?: string; page?: number; userId?: string }) {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (q.status && q.status in ORDER_STATUSES) {
    where.push("status = ?");
    args.push(q.status);
  }
  if (q.status === "unpaid") where.push("paid_at IS NULL AND status != 'cancelled'");
  if (q.userId) {
    where.push("user_id = ?");
    args.push(q.userId);
  }
  const term = q.search?.trim();
  if (term) {
    const digits = term.replace(/\D/g, "");
    const parts = ["contact LIKE ?", "delivery LIKE ?"];
    args.push(`%${term}%`, `%${term}%`);
    if (digits) {
      parts.push("CAST(number AS TEXT) = ?", "REPLACE(contact, ' ', '') LIKE ?");
      args.push(digits, `%${digits.slice(-7)}%`);
    }
    where.push(`(${parts.join(" OR ")})`);
  }
  const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const pageSize = 50;
  const page = Math.max(1, q.page ?? 1);
  const total = (db().prepare(`SELECT COUNT(*) AS c FROM orders ${sqlWhere}`).get(...args) as { c: number }).c;
  const ids = db()
    .prepare(`SELECT id FROM orders ${sqlWhere} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...args, pageSize, (page - 1) * pageSize) as { id: string }[];
  return { orders: ids.map((r) => getOrder(r.id)!), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export type OrderEdit = {
  status?: string;
  paid?: boolean;
  contact?: { name?: string; phone?: string; email?: string };
  delivery?: { address?: string; landmark?: string; comment?: string };
  admin_note?: string;
  discount?: number;
  delivery_price?: number;
  items?: { id?: string; title?: string; details?: string; price?: number; qty?: number }[];
};

/** Полное редактирование заказа менеджером. Суммы пересчитываются на сервере. */
export function updateOrder(id: string, e: OrderEdit, author: string): OrderRow {
  const order = getOrder(id);
  if (!order) throw new ContentError("Заказ не найден");
  tx(() => {
    const d = db();
    const changes: string[] = [];

    if (e.contact) {
      const phone = e.contact.phone !== undefined ? normalizePhone(s(e.contact.phone, 40)) : order.contact.phone;
      if (!phone) throw new ContentError("Телефон в формате +998 XX XXX XX XX");
      const contact = {
        name: e.contact.name !== undefined ? s(e.contact.name, 100) : order.contact.name,
        phone,
        email: e.contact.email !== undefined ? s(e.contact.email, 200) : order.contact.email,
      };
      if (!contact.name) throw new ContentError("Укажите имя клиента");
      if (JSON.stringify(contact) !== JSON.stringify(order.contact)) {
        d.prepare("UPDATE orders SET contact = ? WHERE id = ?").run(JSON.stringify(contact), id);
        changes.push("контакты");
      }
    }
    if (e.delivery) {
      const delivery = {
        ...order.delivery,
        address: e.delivery.address !== undefined ? s(e.delivery.address, 300) : order.delivery.address,
        landmark: e.delivery.landmark !== undefined ? s(e.delivery.landmark, 200) : order.delivery.landmark,
        comment: e.delivery.comment !== undefined ? s(e.delivery.comment, 500) : order.delivery.comment,
      };
      if (JSON.stringify(delivery) !== JSON.stringify(order.delivery)) {
        d.prepare("UPDATE orders SET delivery = ? WHERE id = ?").run(JSON.stringify(delivery), id);
        changes.push("адрес");
      }
    }
    if (e.admin_note !== undefined && s(e.admin_note, 2000) !== order.admin_note) {
      d.prepare("UPDATE orders SET admin_note = ? WHERE id = ?").run(s(e.admin_note, 2000), id);
      changes.push("заметка");
    }

    let items = order.items;
    if (e.items) {
      if (e.items.length === 0) throw new ContentError("В заказе должна остаться хотя бы одна позиция");
      const keep = new Set(e.items.map((i) => i.id).filter(Boolean));
      for (const old of order.items) if (!keep.has(old.id)) d.prepare("DELETE FROM order_items WHERE id = ?").run(old.id);
      for (const it of e.items) {
        const title = s(it.title, 200);
        const price = n(it.price);
        const qty = Math.max(1, Math.min(999, n(it.qty)));
        if (!title) throw new ContentError("У позиции должно быть название");
        if (price < 0) throw new ContentError("Цена не может быть отрицательной");
        const existing = order.items.find((o) => o.id === it.id);
        if (existing)
          d.prepare("UPDATE order_items SET title = ?, details = ?, price = ?, qty = ? WHERE id = ?").run(
            title,
            s(it.details, 300),
            price,
            qty,
            existing.id,
          );
        else
          d.prepare("INSERT INTO order_items (id, order_id, title, details, price, qty) VALUES (?, ?, ?, ?, ?, ?)").run(
            newId(),
            id,
            title,
            s(it.details, 300),
            price,
            qty,
          );
      }
      items = d.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as OrderRow["items"];
      changes.push("позиции");
    }
    const discount = e.discount !== undefined ? Math.max(0, n(e.discount)) : order.discount;
    const deliveryPrice = e.delivery_price !== undefined ? Math.max(0, n(e.delivery_price)) : order.delivery_price;
    if (discount !== order.discount) changes.push(`скидка ${discount}`);
    if (deliveryPrice !== order.delivery_price) changes.push(`доставка ${deliveryPrice}`);
    const totals = recalcTotals(items, { discount, delivery_price: deliveryPrice, certificate_used: order.certificate_used });
    d.prepare(
      "UPDATE orders SET subtotal = ?, discount = ?, delivery_price = ?, total = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(totals.subtotal, discount, deliveryPrice, totals.total, id);
    if (totals.total !== order.total) changes.push(`итого ${order.total} → ${totals.total}`);
    if (changes.length) addEvent(id, author, `Изменено: ${changes.join(", ")}`);
  });
  if (e.status && e.status in ORDER_STATUSES) setOrderStatus(id, e.status as OrderStatus, author);
  if (e.paid === true) markPaid(id, author);
  if (e.paid === false) unmarkPaid(id, author);
  return getOrder(id)!;
}

export function deleteOrder(id: string) {
  const o = getOrder(id);
  if (!o) return;
  if (o.status !== "cancelled") throw new ContentError("Удалить можно только отменённый заказ");
  db().prepare("DELETE FROM orders WHERE id = ?").run(id);
}

// ---------- Статистика ----------

export function dashboardStats() {
  const d = db();
  const one = <T,>(sql: string, ...a: (string | number)[]) => d.prepare(sql).get(...a) as T;
  const since = (days: number) => new Date(Date.now() - days * 864e5).toISOString().replace("T", " ").slice(0, 19);
  return {
    newOrders: one<{ c: number }>("SELECT COUNT(*) AS c FROM orders WHERE status = 'new'").c,
    inWork: one<{ c: number }>("SELECT COUNT(*) AS c FROM orders WHERE status IN ('confirmed','printing','shipped')").c,
    unpaidSum: one<{ s: number }>("SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE paid_at IS NULL AND status != 'cancelled'").s,
    revenue30: one<{ s: number }>(
      "SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE paid_at IS NOT NULL AND status != 'cancelled' AND created_at >= ?",
      since(30),
    ).s,
    orders30: one<{ c: number }>("SELECT COUNT(*) AS c FROM orders WHERE created_at >= ?", since(30)).c,
    clients: one<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE email IS NOT NULL").c,
    projects: one<{ c: number }>("SELECT COUNT(*) AS c FROM projects").c,
    byDay: d
      .prepare(
        `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS c, COALESCE(SUM(total),0) AS s FROM orders
         WHERE created_at >= ? AND status != 'cancelled' GROUP BY day ORDER BY day`,
      )
      .all(since(14)) as { day: string; c: number; s: number }[],
  };
}

// ---------- Клиенты ----------

export type ClientRow = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  orders: number;
  spent: number;
  last_order: string | null;
  projects: number;
};

/** Клиенты — зарегистрированные пользователи и гости, у которых есть заказы. */
export function searchClients(search?: string): ClientRow[] {
  const args: string[] = [];
  let filter = "";
  const term = search?.trim();
  if (term) {
    const digits = term.replace(/\D/g, "");
    filter = `AND (u.email LIKE ? OR u.name LIKE ? ${digits ? "OR REPLACE(u.phone, ' ', '') LIKE ?" : ""}
      OR EXISTS (SELECT 1 FROM orders o2 WHERE o2.user_id = u.id AND o2.contact LIKE ?))`;
    args.push(`%${term}%`, `%${term}%`);
    if (digits) args.push(`%${digits.slice(-7)}%`);
    args.push(`%${term}%`);
  }
  return db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.phone, u.role, u.created_at,
         (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders,
         (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.user_id = u.id AND o.paid_at IS NOT NULL AND o.status != 'cancelled') AS spent,
         (SELECT MAX(created_at) FROM orders o WHERE o.user_id = u.id) AS last_order,
         (SELECT COUNT(*) FROM projects p WHERE p.user_id = u.id) AS projects
       FROM users u
       WHERE (u.email IS NOT NULL OR EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)) ${filter}
       ORDER BY COALESCE(last_order, u.created_at) DESC LIMIT 500`,
    )
    .all(...args) as ClientRow[];
}

export function getClient(id: string) {
  const row = searchClients().find((c) => c.id === id) ??
    (db().prepare("SELECT id, email, name, phone, role, created_at, 0 AS orders, 0 AS spent, NULL AS last_order, 0 AS projects FROM users WHERE id = ?").get(id) as ClientRow | undefined);
  if (!row) return null;
  return { ...row, orderList: listUserOrders(id) };
}

export function updateClient(id: string, x: Record<string, unknown>, actorId: string) {
  const d = db();
  const u = d.prepare("SELECT id, email FROM users WHERE id = ?").get(id) as { id: string; email: string | null } | undefined;
  if (!u) throw new ContentError("Клиент не найден");
  if (x.name !== undefined) d.prepare("UPDATE users SET name = ? WHERE id = ?").run(s(x.name, 100), id);
  if (x.phone !== undefined) {
    const raw = s(x.phone, 40);
    const phone = raw ? normalizePhone(raw) : "";
    if (phone === null) throw new ContentError("Телефон в формате +998 XX XXX XX XX");
    d.prepare("UPDATE users SET phone = ? WHERE id = ?").run(phone || null, id);
  }
  if (x.role !== undefined) {
    if (x.role !== "admin" && x.role !== "customer") throw new ContentError("Неизвестная роль");
    if (!u.email) throw new ContentError("Администратором может быть только зарегистрированный пользователь");
    if (id === actorId && x.role !== "admin") throw new ContentError("Нельзя снять права администратора с себя");
    d.prepare("UPDATE users SET role = ? WHERE id = ?").run(x.role, id);
  }
  if (x.password !== undefined) {
    const pw = s(x.password, 200);
    if (pw.length < 8) throw new ContentError("Пароль — минимум 8 символов");
    if (!u.email) throw new ContentError("У гостя нет пароля — клиенту нужно зарегистрироваться");
    d.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(pw), id);
    // Выход со всех устройств после смены пароля.
    d.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  }
}

// ---------- Промокоды ----------

export type Promo = { code: string; percent: number; active: number; used: number };

export function listPromos(): Promo[] {
  return db()
    .prepare(
      `SELECT p.code, p.percent, p.active, (SELECT COUNT(*) FROM orders o WHERE o.promo_code = p.code) AS used
       FROM promo_codes p ORDER BY p.active DESC, p.code`,
    )
    .all() as Promo[];
}

export function savePromo(x: Record<string, unknown>) {
  const code = s(x.code, 40).toUpperCase();
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw new ContentError("Код: 3–40 символов, латиница, цифры, - и _");
  const percent = n(x.percent);
  if (percent < 1 || percent > 100) throw new ContentError("Скидка — от 1 до 100%");
  db()
    .prepare(
      "INSERT INTO promo_codes (code, percent, active, created_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(code) DO UPDATE SET percent = excluded.percent, active = excluded.active",
    )
    .run(code, percent, x.active === false ? 0 : 1);
}

export function deletePromo(code: string) {
  db().prepare("DELETE FROM promo_codes WHERE code = ?").run(code);
}

// ---------- Сертификаты ----------

export type Certificate = { code: string; amount: number; balance: number; active: number; note: string; created_at: string; order_number: number | null };

export function listCertificates(): Certificate[] {
  return db()
    .prepare(
      `SELECT c.code, c.amount, c.balance, c.active, c.note, c.created_at, o.number AS order_number
       FROM certificates c LEFT JOIN orders o ON o.id = c.order_id ORDER BY c.created_at DESC LIMIT 500`,
    )
    .all() as Certificate[];
}

/** Ручной выпуск сертификата (например, продали в офисе или подарок от магазина). */
export function createCertificate(x: Record<string, unknown>): string {
  const amount = n(x.amount);
  if (amount < 1000) throw new ContentError("Номинал — от 1 000 сум");
  const code = "GIFT-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  db()
    .prepare("INSERT INTO certificates (code, amount, balance, active, note) VALUES (?, ?, ?, 1, ?)")
    .run(code, amount, amount, s(x.note, 200));
  return code;
}

export function updateCertificate(code: string, x: Record<string, unknown>) {
  const d = db();
  if (x.active !== undefined) d.prepare("UPDATE certificates SET active = ? WHERE code = ?").run(x.active ? 1 : 0, code);
  if (x.balance !== undefined) d.prepare("UPDATE certificates SET balance = ? WHERE code = ?").run(Math.max(0, n(x.balance)), code);
  if (x.note !== undefined) d.prepare("UPDATE certificates SET note = ? WHERE code = ?").run(s(x.note, 200), code);
}

// ---------- Отзывы ----------

export type Review = { id: string; author: string; text: string; rating: number; active: number; created_at: string };

export function listReviews(activeOnly = false): Review[] {
  return db()
    .prepare(`SELECT * FROM reviews ${activeOnly ? "WHERE active = 1" : ""} ORDER BY created_at DESC`)
    .all() as Review[];
}

export function saveReview(x: Record<string, unknown>, id?: string) {
  const author = s(x.author, 100);
  const text = s(x.text, 1000);
  const rating = Math.min(5, Math.max(1, n(x.rating) || 5));
  if (!author || !text) throw new ContentError("Заполните автора и текст отзыва");
  const active = x.active === false ? 0 : 1;
  if (id) db().prepare("UPDATE reviews SET author = ?, text = ?, rating = ?, active = ? WHERE id = ?").run(author, text, rating, active, id);
  else db().prepare("INSERT INTO reviews (id, author, text, rating, active) VALUES (?, ?, ?, ?, ?)").run(newId(), author, text, rating, active);
}

export function deleteReview(id: string) {
  db().prepare("DELETE FROM reviews WHERE id = ?").run(id);
}
