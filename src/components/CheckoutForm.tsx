"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DELIVERY_METHODS, type DeliveryId, rub } from "@/lib/catalog";
import type { CartLine, Totals } from "@/lib/shop";

export function CheckoutForm({ items, defaults }: { items: CartLine[]; defaults: { name: string; email: string; phone: string } }) {
  const router = useRouter();
  const [contact, setContact] = useState(defaults);
  const [method, setMethod] = useState<DeliveryId>("pickup");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [certInput, setCertInput] = useState("");
  const [promo, setPromo] = useState("");
  const [cert, setCert] = useState("");
  const [totals, setTotals] = useState<Totals | null>(null);
  const [codeError, setCodeError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const needsShipping = items.some((l) => !l.certificateAmount);

  async function quote(next: { promo: string; cert: string }) {
    const res = await fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delivery: method, promo: next.promo, certificate: next.cert }),
    });
    const json = await res.json();
    if (!res.ok) return json.error as string;
    setTotals(json);
    return null;
  }

  useEffect(() => {
    quote({ promo, cert });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  async function applyCode(kind: "promo" | "cert") {
    setCodeError("");
    const next = kind === "promo" ? { promo: promoInput.trim(), cert } : { promo, cert: certInput.trim() };
    const err = await quote(next);
    if (err) return setCodeError(err);
    setPromo(next.promo);
    setCert(next.cert);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact, delivery: { method, city, address, comment }, promo, certificate: cert }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      setBusy(false);
      return;
    }
    router.push(`/orders/${json.id}`);
    router.refresh();
  }

  const c = (k: keyof typeof contact) => ({
    value: contact[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setContact({ ...contact, [k]: e.target.value }),
  });

  return (
    <form className="checkout" onSubmit={submit}>
      <div className="stack">
        <div className="card stack">
          <h3>Контакты</h3>
          <div className="grid grid-3">
            <label className="field">
              <span>Имя и фамилия</span>
              <input required autoComplete="name" {...c("name")} />
            </label>
            <label className="field">
              <span>Телефон</span>
              <input required type="tel" autoComplete="tel" placeholder="+7 900 000-00-00" {...c("phone")} />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input required type="email" autoComplete="email" {...c("email")} />
            </label>
          </div>
        </div>

        <div className="card stack">
          <h3>Доставка</h3>
          {needsShipping ? (
            <>
              <div className="choices">
                {DELIVERY_METHODS.map((m) => (
                  <button key={m.id} type="button" className="choice" aria-pressed={method === m.id} onClick={() => setMethod(m.id)}>
                    {m.label}
                    <small>
                      {m.days} · {rub(m.price)}
                    </small>
                  </button>
                ))}
              </div>
              <div className="grid grid-2">
                <label className="field">
                  <span>Город</span>
                  <input required value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
                </label>
                <label className="field">
                  <span>{method === "pickup" ? "Адрес пункта выдачи" : "Улица, дом, квартира"}</span>
                  <input required value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
                </label>
              </div>
              <label className="field">
                <span>Комментарий к заказу</span>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
              </label>
            </>
          ) : (
            <p className="muted">Сертификаты электронные — код придёт на e-mail и появится на странице заказа.</p>
          )}
        </div>

        <div className="card stack">
          <h3>Скидки</h3>
          <div className="grid grid-2">
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input placeholder="Промокод" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} aria-label="Промокод" />
              <button type="button" className="btn btn-ghost" onClick={() => applyCode("promo")}>
                Применить
              </button>
            </div>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input placeholder="Код сертификата" value={certInput} onChange={(e) => setCertInput(e.target.value)} aria-label="Код сертификата" />
              <button type="button" className="btn btn-ghost" onClick={() => applyCode("cert")}>
                Применить
              </button>
            </div>
          </div>
          {codeError && <p className="error">{codeError}</p>}
          {(promo || cert) && !codeError && (
            <p className="small" style={{ color: "var(--ok)" }}>
              {[promo && `Промокод ${promo} применён`, cert && `Сертификат ${cert} применён`].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="card summary">
        <h3>Ваш заказ</h3>
        {items.map((l) => (
          <div key={l.id} className="summary-row small">
            <span>
              {l.title} × {l.qty}
            </span>
            <span>{rub(l.unitPrice * l.qty)}</span>
          </div>
        ))}
        {totals && (
          <>
            <div className="summary-row" style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 12 }}>
              <span>Товары</span>
              <span>{rub(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="summary-row">
                <span>Скидка</span>
                <span>−{rub(totals.discount)}</span>
              </div>
            )}
            {needsShipping && (
              <div className="summary-row">
                <span>Доставка</span>
                <span>{totals.delivery === 0 ? "бесплатно" : rub(totals.delivery)}</span>
              </div>
            )}
            {totals.certificate > 0 && (
              <div className="summary-row">
                <span>Сертификат</span>
                <span>−{rub(totals.certificate)}</span>
              </div>
            )}
            <div className="summary-row summary-total">
              <span>Итого</span>
              <span>{rub(totals.total)}</span>
            </div>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" style={{ marginTop: 16 }} disabled={busy}>
          {busy ? "Оформляем…" : totals?.total === 0 ? "Подтвердить заказ" : "Перейти к оплате"}
        </button>
        <p className="muted small" style={{ marginTop: 10 }}>
          Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных.
        </p>
      </div>
    </form>
  );
}
