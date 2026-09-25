import { DELIVERY_METHODS, FREE_DELIVERY_FROM, rub } from "@/lib/catalog";

export const metadata = { title: "Доставка и оплата" };

export default function DeliveryPage() {
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <h1>Доставка и оплата</h1>
      <p className="muted">
        Срок доставки считается с момента, когда заказ напечатан. При заказе от {rub(FREE_DELIVERY_FROM)} доставка
        бесплатная любым способом.
      </p>
      <div className="grid grid-3" style={{ marginTop: 24 }}>
        {DELIVERY_METHODS.map((m) => (
          <div key={m.id} className="card">
            <h3>{m.label}</h3>
            <div>{rub(m.price)}</div>
            <div className="muted small">{m.days}</div>
          </div>
        ))}
      </div>
      <h2 style={{ marginTop: 48 }}>Оплата</h2>
      <p>Банковской картой онлайн, через СБП или подарочным сертификатом. Заказ уходит в печать только после оплаты.</p>
      <h2 style={{ marginTop: 32 }}>Сроки изготовления</h2>
      <ul>
        <li>Фотокниги — 5–7 рабочих дней</li>
        <li>Фотожурналы и календари — 3–5 рабочих дней</li>
        <li>Открытки — 2–4 рабочих дня</li>
      </ul>
    </div>
  );
}
