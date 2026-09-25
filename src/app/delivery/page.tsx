import { DELIVERY, money } from "@/lib/catalog";

export const metadata = { title: "Доставка и оплата" };

export default function DeliveryPage() {
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <h1>Доставка и оплата</h1>
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Курьер по Ташкенту</h3>
          <div className="price-big">{money(DELIVERY.price)}</div>
          <p className="muted small">
            Привезём через {DELIVERY.days}. Перед выездом курьер позвонит. Пока доставляем только по Ташкенту.
          </p>
        </div>
        <div className="card">
          <h3>Оплата наличными</h3>
          <p>Платите курьеру при получении заказа, предоплата не нужна.</p>
          <p className="muted small">Оплата через Payme и Click появится позже.</p>
        </div>
      </div>
      <h2 style={{ marginTop: 48 }}>Как проходит заказ</h2>
      <ol>
        <li>Вы оформляете заказ на сайте.</li>
        <li>Менеджер звонит и подтверждает макет, адрес и время доставки.</li>
        <li>Печатаем и проверяем качество.</li>
        <li>Курьер привозит заказ, вы оплачиваете наличными.</li>
      </ol>
      <h2 style={{ marginTop: 32 }}>Сроки изготовления</h2>
      <ul>
        <li>Фотокниги — 5–7 рабочих дней</li>
        <li>Фотожурналы и календари — 3–5 рабочих дней</li>
        <li>Открытки — 2–4 рабочих дня</li>
      </ul>
    </div>
  );
}
