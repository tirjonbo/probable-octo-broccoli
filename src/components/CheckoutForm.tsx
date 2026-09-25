"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PAYMENT_METHODS, type PaymentMethod, money } from "@/lib/catalog";
import type { CartLine, Totals } from "@/lib/shop";

export function CheckoutForm({
  items,
  defaults,
  delivery,
}: {
  items: CartLine[];
  defaults: { name: string; email: string; phone: string };
  delivery: { city: string; price: number; days: string };
}) {
  const router = useRouter();
  const [contact, setContact] = useState({ ...defaults, phone: defaults.phone || "+998 " });
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [comment, setComment] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
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
      body: JSON.stringify({ promo: next.promo, certificate: next.cert }),
    });
    const json = await res.json();
    if (!res.ok) return json.error as string;
    setTotals(json);
    return null;
  }

  useEffect(() => {
    quote({ promo: "", cert: "" });
  }, []);

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
      body: JSON.stringify({ contact, delivery: { address, landmark, comment }, payment, promo, certificate: cert }),
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
              <span>Имя</span>
              <input required autoComplete="name" {...c("name")} />
            </label>
            <label className="field">
              <span>Телефон</span>
              <input required type="tel" autoComplete="tel" placeholder="+998 90 123 45 67" {...c("phone")} />
            </label>
            <label className="field">
              <span>E-mail (необязательно)</span>
              <input type="email" autoComplete="email" {...c("email")} />
            </label>
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            Менеджер позвонит, чтобы подтвердить заказ перед печатью.
          </p>
        </div>

        {needsShipping ? (
          <div className="card stack">
            <div className="spread">
              <h3 style={{ margin: 0 }}>Доставка, г. {delivery.city}</h3>
              <span>{money(delivery.price)}</span>
            </div>
            <p className="muted small" style={{ margin: 0 }}>
              Курьер привезёт заказ{delivery.days && ` через ${delivery.days}`}. Сейчас доставляем только по г. {delivery.city}.
            </p>
            <label className="field">
              <span>Адрес: район, улица, дом, квартира</span>
              <input required value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
            </label>
            <label className="field">
              <span>Ориентир</span>
              <input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Например, рядом с метро или школой" />
            </label>
            <label className="field">
              <span>Комментарий к заказу</span>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
            </label>
          </div>
        ) : (
          <div className="card">
            <h3>Получение</h3>
            <p className="muted" style={{ margin: 0 }}>
              Сертификат электронный: код появится на странице заказа после оплаты. Менеджер свяжется с вами, чтобы
              договориться об оплате.
            </p>
          </div>
        )}

        <div className="card stack">
          <h3>Оплата</h3>
          <div className="choices">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="choice"
                aria-pressed={payment === m.id}
                disabled={!m.available}
                style={m.available ? undefined : { opacity: 0.5, cursor: "not-allowed" }}
                onClick={() => setPayment(m.id)}
              >
                {m.label}
                <small>{m.hint}</small>
              </button>
            ))}
          </div>
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
            <span>{money(l.unitPrice * l.qty)}</span>
          </div>
        ))}
        {totals && (
          <>
            <div className="summary-row" style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 12 }}>
              <span>Товары</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="summary-row">
                <span>Скидка</span>
                <span>−{money(totals.discount)}</span>
              </div>
            )}
            {needsShipping && (
              <div className="summary-row">
                <span>Доставка</span>
                <span>{money(totals.delivery)}</span>
              </div>
            )}
            {totals.certificate > 0 && (
              <div className="summary-row">
                <span>Сертификат</span>
                <span>−{money(totals.certificate)}</span>
              </div>
            )}
            <div className="summary-row summary-total">
              <span>К оплате</span>
              <span>{money(totals.total)}</span>
            </div>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" style={{ marginTop: 16 }} disabled={busy}>
          {busy ? "Оформляем…" : "Оформить заказ"}
        </button>
        <p className="muted small" style={{ marginTop: 10 }}>
          Нажимая кнопку, вы принимаете <Link href="/offer">условия оферты</Link> и{" "}
          <Link href="/privacy">политику конфиденциальности</Link>.
        </p>
      </div>
    </form>
  );
}
