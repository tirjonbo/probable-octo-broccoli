"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FREE_DELIVERY_FROM, rub } from "@/lib/catalog";
import type { CartLine } from "@/lib/shop";

export function CartView({ initial }: { initial: CartLine[] }) {
  const [items, setItems] = useState(initial);
  const router = useRouter();

  async function mutate(url: string, method: string, body?: object) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) {
      setItems((await res.json()).items);
      router.refresh();
    }
  }

  if (items.length === 0)
    return (
      <div className="card center" style={{ padding: 48 }}>
        <p>В корзине пока пусто.</p>
        <Link href="/catalog" className="btn">
          Выбрать продукт
        </Link>
      </div>
    );

  const subtotal = items.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const goods = items.filter((l) => !l.certificateAmount).reduce((s, l) => s + l.unitPrice * l.qty, 0);
  return (
    <div className="checkout">
      <div>
        {items.map((l) => (
          <div key={l.id} className="cart-line">
            {l.photo ? <img className="cart-thumb" src={`/api/uploads/${l.photo}`} alt="" /> : <div className="cart-thumb" />}
            <div>
              <strong>{l.title}</strong>
              <div className="muted small">{l.details}</div>
              {l.warning && <div className="pill pill-warn" style={{ marginTop: 6 }}>{l.warning}</div>}
              <div className="row small" style={{ marginTop: 8 }}>
                {l.projectId && <Link href={`/editor/${l.projectId}`}>Редактировать</Link>}
                <button className="link-btn" onClick={() => mutate(`/api/cart/${l.id}`, "DELETE")}>
                  Удалить
                </button>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="qty">
                <button onClick={() => mutate(`/api/cart/${l.id}`, "PATCH", { qty: l.qty - 1 })} aria-label="Меньше">−</button>
                <span>{l.qty}</span>
                <button onClick={() => mutate(`/api/cart/${l.id}`, "PATCH", { qty: l.qty + 1 })} aria-label="Больше">+</button>
              </div>
              <div style={{ marginTop: 8 }}>{rub(l.unitPrice * l.qty)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card summary">
        <div className="summary-row">
          <span>Товары</span>
          <span>{rub(subtotal)}</span>
        </div>
        {goods > 0 && (
          <p className="muted small">
            {goods >= FREE_DELIVERY_FROM
              ? "Доставка бесплатно"
              : `До бесплатной доставки: ${rub(FREE_DELIVERY_FROM - goods)}`}
          </p>
        )}
        <Link href="/checkout" className="btn btn-block" style={{ marginTop: 12 }}>
          Оформить заказ
        </Link>
      </div>
    </div>
  );
}
