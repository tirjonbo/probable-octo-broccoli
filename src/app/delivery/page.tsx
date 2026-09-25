import { money } from "@/lib/catalog";
import { getSettings, listProducts } from "@/lib/content-store";

export const metadata = { title: "Доставка и оплата" };

export default function DeliveryPage() {
  const { delivery } = getSettings();
  const products = listProducts(true).filter((p) => p.productionDays);
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <h1>Доставка и оплата</h1>
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Курьер по г. {delivery.city}</h3>
          <div className="price-big">{delivery.price ? money(delivery.price) : "Бесплатно"}</div>
          <p className="muted small">
            {delivery.days && <>Привезём через {delivery.days}. </>}Перед выездом курьер позвонит.
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
      {products.length > 0 && (
        <>
          <h2 style={{ marginTop: 32 }}>Сроки изготовления</h2>
          <ul>
            {products.map((p) => (
              <li key={p.slug}>
                {p.title} — {p.productionDays}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
