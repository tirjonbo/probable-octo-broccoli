"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUSES, type OrderStatus, money, recalcTotals } from "@/lib/catalog";
import type { OrderRow } from "@/lib/shop";
import { api } from "./api";
import { Field, SaveBar, useSaver } from "./ui";

type Item = { id?: string; title: string; details: string; price: number; qty: number; fromProject: boolean; certificate: boolean };

export function OrderEditor({ order, events }: { order: OrderRow; events: { author: string; text: string; created_at: string }[] }) {
  const router = useRouter();
  const saver = useSaver();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [contact, setContact] = useState(order.contact);
  const [delivery, setDelivery] = useState(order.delivery);
  const [note, setNote] = useState(order.admin_note ?? "");
  const [discount, setDiscount] = useState(order.discount);
  const [deliveryPrice, setDeliveryPrice] = useState(order.delivery_price);
  const [items, setItems] = useState<Item[]>(
    order.items.map((i) => ({
      id: i.id,
      title: i.title,
      details: i.details,
      price: i.price,
      qty: i.qty,
      fromProject: !!i.project_snapshot,
      certificate: !!i.certificate_amount,
    })),
  );
  const totals = recalcTotals(items, { discount, delivery_price: deliveryPrice, certificate_used: order.certificate_used });
  const setItem = (k: number, patch: Partial<Item>) => setItems((xs) => xs.map((x, i) => (i === k ? { ...x, ...patch } : x)));

  async function save(extra: Record<string, unknown> = {}) {
    const ok = await saver.run(() =>
      api(`/api/admin/orders/${order.id}`, "PATCH", {
        status,
        contact,
        delivery,
        admin_note: note,
        discount,
        delivery_price: deliveryPrice,
        items: items.map(({ id, title, details, price, qty }) => ({ id, title, details, price, qty })),
        ...extra,
      }),
    );
    if (ok) router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", alignItems: "start" }}>
        <div className="stack">
          <div className="card stack">
            <h3>Позиции</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th style={{ width: 130 }}>Цена, сум</th>
                    <th style={{ width: 80 }}>Кол-во</th>
                    <th style={{ width: 120, textAlign: "right" }}>Сумма</th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, k) => (
                    <tr key={it.id ?? `new-${k}`}>
                      <td>
                        <input value={it.title} onChange={(e) => setItem(k, { title: e.target.value })} aria-label="Название" />
                        <input
                          value={it.details}
                          onChange={(e) => setItem(k, { details: e.target.value })}
                          placeholder="Параметры"
                          aria-label="Параметры"
                          style={{ marginTop: 4, fontSize: 13 }}
                        />
                        {it.fromProject && <div className="muted small">макет клиента</div>}
                        {it.certificate && <div className="muted small">подарочный сертификат</div>}
                      </td>
                      <td>
                        <input type="number" min={0} step={1000} value={it.price} onChange={(e) => setItem(k, { price: Number(e.target.value) })} aria-label="Цена" />
                      </td>
                      <td>
                        <input type="number" min={1} value={it.qty} onChange={(e) => setItem(k, { qty: Number(e.target.value) })} aria-label="Количество" />
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{money(it.price * it.qty)}</td>
                      <td>
                        <button
                          type="button"
                          className="link-btn"
                          aria-label="Удалить позицию"
                          disabled={items.length === 1}
                          onClick={() => confirm("Удалить позицию из заказа?") && setItems((xs) => xs.filter((_, i) => i !== k))}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: "flex-start" }}
              onClick={() => setItems((xs) => [...xs, { title: "Доп. услуга", details: "", price: 0, qty: 1, fromProject: false, certificate: false }])}
            >
              + Добавить позицию
            </button>
            <div style={{ maxWidth: 360, marginLeft: "auto", width: "100%" }}>
              <div className="summary-row">
                <span>Товары</span>
                <span>{money(totals.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Скидка{order.promo_code ? ` (${order.promo_code})` : ""}</span>
                <input type="number" min={0} step={1000} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} style={{ width: 140 }} aria-label="Скидка" />
              </div>
              <div className="summary-row">
                <span>Доставка</span>
                <input type="number" min={0} step={1000} value={deliveryPrice} onChange={(e) => setDeliveryPrice(Number(e.target.value))} style={{ width: 140 }} aria-label="Доставка" />
              </div>
              {order.certificate_used > 0 && (
                <div className="summary-row">
                  <span>Сертификат {order.certificate_code}</span>
                  <span>−{money(order.certificate_used)}</span>
                </div>
              )}
              <div className="summary-row summary-total">
                <span>К оплате</span>
                <span>{money(totals.total)}</span>
              </div>
            </div>
          </div>

          <div className="card stack">
            <h3>Клиент и доставка</h3>
            <div className="admin-grid-form">
              <Field label="Имя">
                <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
              </Field>
              <Field label="Телефон">
                <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              </Field>
              <Field label="E-mail">
                <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              </Field>
            </div>
            <Field label={`Адрес${delivery.city ? `, г. ${delivery.city}` : ""}`}>
              <input value={delivery.address} onChange={(e) => setDelivery({ ...delivery, address: e.target.value })} />
            </Field>
            <div className="admin-grid-form">
              <Field label="Ориентир">
                <input value={delivery.landmark ?? ""} onChange={(e) => setDelivery({ ...delivery, landmark: e.target.value })} />
              </Field>
              <Field label="Комментарий клиента">
                <input value={delivery.comment} onChange={(e) => setDelivery({ ...delivery, comment: e.target.value })} />
              </Field>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card stack">
            <h3>Статус</h3>
            <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} aria-label="Статус">
              {Object.entries(ORDER_STATUSES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <div className="spread">
              <span>
                Оплата: {order.paid_at ? <span className="pill pill-ok">получена</span> : <span className="pill pill-warn">не получена</span>}
              </span>
              {order.paid_at ? (
                <button type="button" className="link-btn small" onClick={() => confirm("Снять отметку об оплате?") && save({ paid: false })}>
                  Снять отметку
                </button>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => save({ paid: true })}>
                  Оплата получена
                </button>
              )}
            </div>
            {order.issuedCertificates.length > 0 && (
              <div className="small">
                Выпущенные сертификаты:
                {order.issuedCertificates.map((c) => (
                  <div key={c.code}>
                    <code>{c.code}</code> — {money(c.amount)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card stack">
            <h3>Заметка менеджера</h3>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Видна только в админке" rows={4} />
          </div>
          <div className="card">
            <h3>История</h3>
            <ul className="timeline">
              {events.map((e, i) => (
                <li key={i}>
                  <div>{e.text}</div>
                  <div className="muted small">
                    {e.created_at} · {e.author}
                  </div>
                </li>
              ))}
              {events.length === 0 && <li className="muted">Пусто</li>}
            </ul>
          </div>
          {status === "cancelled" && order.status === "cancelled" && (
            <button
              type="button"
              className="link-btn small"
              style={{ color: "#b3261e" }}
              onClick={async () => {
                if (!confirm("Удалить заказ навсегда?")) return;
                await api(`/api/admin/orders/${order.id}`, "DELETE");
                router.push("/admin/orders");
                router.refresh();
              }}
            >
              Удалить заказ
            </button>
          )}
        </div>
      </div>
      <SaveBar {...saver} label="Сохранить заказ" />
    </form>
  );
}
