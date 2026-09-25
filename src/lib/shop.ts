import "server-only";
import crypto from "node:crypto";
import { db, newId, tx } from "./db";
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  type OrderStatus,
  type PaymentMethod,
  type ProjectConfig,
  describeConfig,
  normalizePhone,
  priceFor,
} from "./catalog";
import { getProduct, getSettings } from "./content-store";
import { notify } from "./notify";
import type { ProjectData } from "./project";

export type ProjectRow = {
  id: string;
  user_id: string;
  product: string;
  title: string;
  config: ProjectConfig;
  data: ProjectData;
  created_at: string;
  updated_at: string;
};

type RawProject = Omit<ProjectRow, "config" | "data"> & { config: string; data: string };

function parseProject(r: RawProject): ProjectRow {
  return { ...r, config: JSON.parse(r.config), data: JSON.parse(r.data) };
}

export function getProject(id: string, userId: string): ProjectRow | null {
  const r = db().prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?").get(id, userId) as RawProject | undefined;
  return r ? parseProject(r) : null;
}

export function listProjects(userId: string): ProjectRow[] {
  const rows = db()
    .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId) as RawProject[];
  return rows.map(parseProject);
}

export class ShopError extends Error {}

// ---------- Корзина ----------

export type CartLine = {
  id: string;
  qty: number;
  title: string;
  details: string;
  unitPrice: number;
  projectId: string | null;
  productSlug: string | null;
  certificateAmount: number | null;
  photo: string | null;
  warning: string | null;
};

export function getCart(userId: string): CartLine[] {
  const rows = db()
    .prepare(
      `SELECT c.id, c.qty, c.certificate_amount, p.id AS project_id, p.product, p.title, p.config, p.data
       FROM cart_items c LEFT JOIN projects p ON p.id = c.project_id
       WHERE c.user_id = ? ORDER BY c.created_at`,
    )
    .all(userId) as {
    id: string;
    qty: number;
    certificate_amount: number | null;
    project_id: string | null;
    product: string | null;
    title: string | null;
    config: string | null;
    data: string | null;
  }[];

  const lines: CartLine[] = [];
  for (const r of rows) {
    if (r.certificate_amount) {
      lines.push({
        id: r.id,
        qty: r.qty,
        title: "Подарочный сертификат",
        details: "Электронный код — появится на странице заказа после оплаты",
        unitPrice: r.certificate_amount,
        projectId: null,
        productSlug: null,
        certificateAmount: r.certificate_amount,
        photo: null,
        warning: null,
      });
      continue;
    }
    const product = r.product ? getProduct(r.product) : undefined;
    if (!product || !r.config || !r.data) continue;
    const config = JSON.parse(r.config) as ProjectConfig;
    const data = JSON.parse(r.data) as ProjectData;
    const empty = data.pages.reduce((n, p) => n + p.photos.filter((x) => !x).length, 0);
    lines.push({
      id: r.id,
      qty: r.qty,
      title: `${product.title} «${r.title}»`,
      details: describeConfig(product, config),
      unitPrice: priceFor(product, config),
      projectId: r.project_id,
      productSlug: product.slug,
      certificateAmount: null,
      photo: data.cover.photo ?? data.library[0] ?? null,
      warning: empty > 0 ? `Пустых мест для фото: ${empty}` : null,
    });
  }
  return lines;
}

export function addProjectToCart(userId: string, projectId: string) {
  if (!getProject(projectId, userId)) throw new ShopError("Проект не найден");
  const d = db();
  const existing = d
    .prepare("SELECT id FROM cart_items WHERE user_id = ? AND project_id = ?")
    .get(userId, projectId) as { id: string } | undefined;
  if (existing) return;
  d.prepare("INSERT INTO cart_items (id, user_id, project_id) VALUES (?, ?, ?)").run(newId(), userId, projectId);
}

export function addCertificateToCart(userId: string, amount: number) {
  if (!getSettings().certificates.nominals.includes(amount)) throw new ShopError("Недопустимый номинал");
  db()
    .prepare("INSERT INTO cart_items (id, user_id, certificate_amount) VALUES (?, ?, ?)")
    .run(newId(), userId, amount);
}

export function setCartQty(userId: string, itemId: string, qty: number) {
  const q = Math.max(1, Math.min(50, Math.round(qty)));
  db().prepare("UPDATE cart_items SET qty = ? WHERE id = ? AND user_id = ?").run(q, itemId, userId);
}

export function removeCartItem(userId: string, itemId: string) {
  db().prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?").run(itemId, userId);
}

export function cartCount(userId: string): number {
  const r = db().prepare("SELECT COALESCE(SUM(qty), 0) AS n FROM cart_items WHERE user_id = ?").get(userId) as {
    n: number;
  };
  return r.n;
}

// ---------- Промокоды и сертификаты ----------

export function findPromo(code: string): { code: string; percent: number } | null {
  const r = db()
    .prepare("SELECT code, percent FROM promo_codes WHERE code = ? AND active = 1")
    .get(code.trim().toUpperCase()) as { code: string; percent: number } | undefined;
  return r ?? null;
}

export function findCertificate(code: string): { code: string; balance: number } | null {
  const r = db()
    .prepare("SELECT code, balance FROM certificates WHERE code = ? AND active = 1 AND balance > 0")
    .get(code.trim().toUpperCase()) as { code: string; balance: number } | undefined;
  return r ?? null;
}

export type Totals = {
  subtotal: number;
  discount: number;
  delivery: number;
  certificate: number;
  total: number;
  promo: string | null;
  certificateCode: string | null;
};

/** Считает итог. Промокод не действует на сертификаты; сертификатом нельзя оплатить сертификат. */
export function computeTotals(lines: CartLine[], opts: { promo?: string; certificate?: string }): Totals {
  const goods = lines.filter((l) => !l.certificateAmount).reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const certs = lines.filter((l) => l.certificateAmount).reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const promo = opts.promo ? findPromo(opts.promo) : null;
  if (opts.promo && !promo) throw new ShopError("Промокод не найден");
  const discount = promo ? Math.round((goods * promo.percent) / 100) : 0;
  const delivery = goods > 0 ? getSettings().delivery.price : 0;
  const cert = opts.certificate ? findCertificate(opts.certificate) : null;
  if (opts.certificate && !cert) throw new ShopError("Сертификат не найден или уже израсходован");
  const payableByCert = goods - discount + delivery;
  const certificate = cert ? Math.min(cert.balance, payableByCert) : 0;
  return {
    subtotal: goods + certs,
    discount,
    delivery,
    certificate,
    total: goods + certs - discount + delivery - certificate,
    promo: promo?.code ?? null,
    certificateCode: cert?.code ?? null,
  };
}

// ---------- Заказы ----------

export type Contact = { name: string; phone: string; email: string };
export type Delivery = { city: string; address: string; landmark: string; comment: string };

export type OrderRow = {
  id: string;
  number: number;
  user_id: string;
  status: OrderStatus;
  contact: Contact;
  delivery: Delivery;
  subtotal: number;
  discount: number;
  delivery_price: number;
  certificate_used: number;
  total: number;
  promo_code: string | null;
  certificate_code: string | null;
  payment_method: PaymentMethod;
  admin_note: string;
  created_at: string;
  paid_at: string | null;
  items: {
    id: string;
    title: string;
    details: string;
    price: number;
    qty: number;
    certificate_amount: number | null;
    project_snapshot: string | null;
  }[];
  issuedCertificates: { code: string; amount: number }[];
};

function validateCheckout(contact: Contact, delivery: Delivery, needsShipping: boolean, payment: string): Contact {
  if (contact.name.trim().length < 2) throw new ShopError("Укажите имя");
  const phone = normalizePhone(contact.phone);
  if (!phone) throw new ShopError("Укажите номер в формате +998 XX XXX XX XX");
  const email = contact.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ShopError("Проверьте e-mail");
  if (!PAYMENT_METHODS.some((m) => m.id === payment && m.available)) throw new ShopError("Выберите способ оплаты");
  if (needsShipping && delivery.address.trim().length < 3) throw new ShopError("Укажите адрес доставки");
  return { name: contact.name.trim(), phone, email };
}

export function createOrder(
  userId: string,
  input: { contact: Contact; delivery: Delivery; payment: string; promo?: string; certificate?: string },
): OrderRow {
  const order = tx(() => {
    const lines = getCart(userId);
    if (lines.length === 0) throw new ShopError("Корзина пуста");
    const needsShipping = lines.some((l) => !l.certificateAmount);
    const contact = validateCheckout(input.contact, input.delivery, needsShipping, input.payment);
    const delivery: Delivery = needsShipping
      ? {
          city: getSettings().delivery.city,
          address: input.delivery.address.trim(),
          landmark: input.delivery.landmark.trim(),
          comment: input.delivery.comment.trim(),
        }
      : { city: "", address: "", landmark: "", comment: input.delivery.comment.trim() };
    const totals = computeTotals(lines, {
      promo: input.promo || undefined,
      certificate: input.certificate || undefined,
    });
    const d = db();
    const { n } = d.prepare("SELECT COALESCE(MAX(number), 10000) + 1 AS n FROM orders").get() as { n: number };
    const id = newId();
    const status: OrderStatus = "new";
    d.prepare(
      `INSERT INTO orders (id, number, user_id, status, contact, delivery, subtotal, discount, delivery_price,
         certificate_used, total, promo_code, certificate_code, payment_method, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      n,
      userId,
      status,
      JSON.stringify(contact),
      JSON.stringify(delivery),
      totals.subtotal,
      totals.discount,
      totals.delivery,
      totals.certificate,
      totals.total,
      totals.promo,
      totals.certificateCode,
      input.payment,
      // Полностью оплачен сертификатом — оплата не требуется.
      totals.total === 0 ? new Date().toISOString() : null,
    );
    const insItem = d.prepare(
      `INSERT INTO order_items (id, order_id, title, details, price, qty, project_snapshot, certificate_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const l of lines) {
      // Снимок проекта фиксирует макет в момент заказа — дальнейшие правки не попадут в печать.
      const snapshot = l.projectId ? JSON.stringify(getProject(l.projectId, userId)) : null;
      insItem.run(newId(), id, l.title, l.details, l.unitPrice, l.qty, snapshot, l.certificateAmount);
    }
    if (totals.certificateCode) {
      d.prepare("UPDATE certificates SET balance = balance - ? WHERE code = ?").run(
        totals.certificate,
        totals.certificateCode,
      );
    }
    d.prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId);
    d.prepare("UPDATE users SET name = COALESCE(name, ?), phone = ? WHERE id = ?").run(contact.name, contact.phone, userId);
    if (totals.total === 0) issueCertificates(id);
    addEvent(id, "Клиент", "Заказ оформлен на сайте");
    return getOrder(id)!;
  });
  notify("order.created", { number: order.number, total: order.total, phone: order.contact.phone });
  return order;
}

function issueCertificates(orderId: string) {
  const d = db();
  const items = d
    .prepare("SELECT certificate_amount, qty FROM order_items WHERE order_id = ? AND certificate_amount IS NOT NULL")
    .all(orderId) as { certificate_amount: number; qty: number }[];
  const ins = d.prepare("INSERT INTO certificates (code, amount, balance, order_id, active) VALUES (?, ?, ?, ?, 1)");
  for (const it of items) {
    for (let i = 0; i < it.qty; i++) {
      const code = "GIFT-" + crypto.randomBytes(4).toString("hex").toUpperCase();
      ins.run(code, it.certificate_amount, it.certificate_amount, orderId);
    }
  }
}

/**
 * Отмечает, что деньги получены (наличные у курьера — отмечает менеджер в админке).
 * После подключения Payme/Click сюда же придёт вебхук провайдера после проверки подписи.
 * Выпускает оплаченные сертификаты. Повторный вызов ничего не делает.
 */
export function markPaid(orderId: string, author = "Система") {
  const changed = tx(() => {
    const r = db()
      .prepare("UPDATE orders SET paid_at = ? WHERE id = ? AND paid_at IS NULL AND status != 'cancelled'")
      .run(new Date().toISOString(), orderId);
    if (r.changes === 1) {
      issueCertificates(orderId);
      addEvent(orderId, author, "Оплата получена");
    }
    return r.changes === 1;
  });
  if (changed) notify("order.paid", { orderId });
}

type RawOrder = Omit<OrderRow, "contact" | "delivery" | "items" | "issuedCertificates"> & {
  contact: string;
  delivery: string;
};

function hydrate(r: RawOrder): OrderRow {
  const d = db();
  return {
    ...r,
    contact: JSON.parse(r.contact),
    delivery: JSON.parse(r.delivery),
    items: d.prepare("SELECT * FROM order_items WHERE order_id = ?").all(r.id) as OrderRow["items"],
    issuedCertificates: d
      .prepare("SELECT code, amount FROM certificates WHERE order_id = ?")
      .all(r.id) as OrderRow["issuedCertificates"],
  };
}

export function getOrder(id: string): OrderRow | null {
  const r = db().prepare("SELECT * FROM orders WHERE id = ?").get(id) as RawOrder | undefined;
  return r ? hydrate(r) : null;
}

export function listOrders(userId?: string): OrderRow[] {
  const rows = (
    userId
      ? db().prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(userId)
      : db().prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 500").all()
  ) as RawOrder[];
  return rows.map(hydrate);
}

/** Снимает отметку об оплате (ошибка менеджера). Выпущенные сертификаты деактивируются, если не потрачены. */
export function unmarkPaid(orderId: string, author: string) {
  tx(() => {
    const d = db();
    const r = d.prepare("UPDATE orders SET paid_at = NULL WHERE id = ? AND paid_at IS NOT NULL").run(orderId);
    if (r.changes !== 1) return;
    d.prepare("UPDATE certificates SET active = 0 WHERE order_id = ? AND balance = amount").run(orderId);
    addEvent(orderId, author, "Отметка об оплате снята");
  });
}

export function addEvent(orderId: string, author: string, text: string) {
  db().prepare("INSERT INTO order_events (id, order_id, author, text) VALUES (?, ?, ?, ?)").run(newId(), orderId, author, text);
}

export function listEvents(orderId: string): { author: string; text: string; created_at: string }[] {
  return db()
    .prepare("SELECT author, text, created_at FROM order_events WHERE order_id = ? ORDER BY created_at, rowid")
    .all(orderId) as { author: string; text: string; created_at: string }[];
}

export function setOrderStatus(id: string, status: OrderStatus, author = "Система") {
  const changed = tx(() => {
    const d = db();
    const prev = d.prepare("SELECT status, certificate_code, certificate_used FROM orders WHERE id = ?").get(id) as
      | { status: OrderStatus; certificate_code: string | null; certificate_used: number }
      | undefined;
    if (!prev || prev.status === status) return false;
    d.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    addEvent(id, author, `Статус: ${ORDER_STATUSES[prev.status] ?? prev.status} → ${ORDER_STATUSES[status]}`);
    // Сертификат списывается при оформлении — при отмене возвращаем остаток, при восстановлении снова списываем.
    if (prev.certificate_code && prev.certificate_used > 0) {
      const delta = status === "cancelled" ? prev.certificate_used : prev.status === "cancelled" ? -prev.certificate_used : 0;
      if (delta) d.prepare("UPDATE certificates SET balance = balance + ? WHERE code = ?").run(delta, prev.certificate_code);
    }
    return true;
  });
  if (!changed) return;
  // Доставлен наличными — значит, курьер получил оплату.
  if (status === "delivered") markPaid(id, author);
  notify("order.status", { orderId: id, status: ORDER_STATUSES[status] });
}
