import Link from "next/link";
import { notFound } from "next/navigation";
import { PayButton } from "@/components/PayButton";
import { getUser } from "@/lib/auth";
import { DELIVERY_METHODS, ORDER_STATUSES, rub } from "@/lib/catalog";
import { getOrder } from "@/lib/shop";

export const metadata = { title: "Заказ" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  const order = getOrder((await params).id);
  if (!user || !order || (order.user_id !== user.id && user.role !== "admin")) notFound();
  const method = DELIVERY_METHODS.find((m) => m.id === order.delivery.method);
  const hasGoods = order.items.some((i) => !i.certificate_amount);
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <div className="spread">
        <h1 style={{ margin: 0 }}>Заказ № {order.number}</h1>
        <span className={`pill ${order.status === "awaiting_payment" ? "pill-warn" : "pill-ok"}`}>{ORDER_STATUSES[order.status]}</span>
      </div>
      <p className="muted">от {new Date(order.created_at + "Z").toLocaleString("ru-RU")}</p>

      {order.status === "awaiting_payment" && (
        <div className="card stack" style={{ marginTop: 16 }}>
          <strong>К оплате: {rub(order.total)}</strong>
          <p className="muted small" style={{ margin: 0 }}>
            Платёжный шлюз не подключён — это тестовая оплата. Для продакшена подключите ЮKassa, CloudPayments или другой
            провайдер (см. README).
          </p>
          <PayButton orderId={order.id} />
        </div>
      )}

      {order.issuedCertificates.length > 0 && (
        <div className="card stack" style={{ marginTop: 16 }}>
          <h3>Ваши сертификаты</h3>
          {order.issuedCertificates.map((c) => (
            <div key={c.code} className="spread">
              <code style={{ fontSize: "1.2rem" }}>{c.code}</code>
              <span>{rub(c.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Кол-во</th>
                <th style={{ textAlign: "right" }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td>
                    {i.title}
                    <div className="muted small">{i.details}</div>
                  </td>
                  <td>{i.qty}</td>
                  <td style={{ textAlign: "right" }}>{rub(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ maxWidth: 320, marginLeft: "auto", marginTop: 12 }}>
          {order.discount > 0 && (
            <div className="summary-row">
              <span>Скидка ({order.promo_code})</span>
              <span>−{rub(order.discount)}</span>
            </div>
          )}
          {hasGoods && (
            <div className="summary-row">
              <span>Доставка</span>
              <span>{order.delivery_price ? rub(order.delivery_price) : "бесплатно"}</span>
            </div>
          )}
          {order.certificate_used > 0 && (
            <div className="summary-row">
              <span>Сертификат</span>
              <span>−{rub(order.certificate_used)}</span>
            </div>
          )}
          <div className="summary-row summary-total">
            <span>Итого</span>
            <span>{rub(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card small">
          <strong>Получатель</strong>
          <div>{order.contact.name}</div>
          <div className="muted">
            {order.contact.phone} · {order.contact.email}
          </div>
        </div>
        {hasGoods && (
          <div className="card small">
            <strong>{method?.label}</strong>
            <div>
              {order.delivery.city}, {order.delivery.address}
            </div>
            {order.delivery.comment && <div className="muted">{order.delivery.comment}</div>}
          </div>
        )}
      </div>
      <p style={{ marginTop: 24 }}>
        <Link href={user.email ? "/account" : "/catalog"}>{user.email ? "← Мои заказы" : "← В каталог"}</Link>
      </p>
    </div>
  );
}
