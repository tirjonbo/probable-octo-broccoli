import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusPill } from "@/components/OrderStatusPill";
import { getUser } from "@/lib/auth";
import { PAYMENT_METHODS, formatDate, money } from "@/lib/catalog";
import { getOrder } from "@/lib/shop";

export const metadata = { title: "Заказ" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  const order = getOrder((await params).id);
  if (!user || !order || (order.user_id !== user.id && user.role !== "admin")) notFound();
  const payment = PAYMENT_METHODS.find((m) => m.id === order.payment_method);
  const hasGoods = order.items.some((i) => !i.certificate_amount);
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <div className="spread">
        <h1 style={{ margin: 0 }}>Заказ № {order.number}</h1>
        <OrderStatusPill status={order.status} />
      </div>
      <p className="muted">от {formatDate(order.created_at)}</p>

      {order.status === "new" && (
        <div className="card stack" style={{ marginTop: 16 }}>
          <strong>Спасибо, заказ принят!</strong>
          <p className="muted small" style={{ margin: 0 }}>
            Менеджер позвонит на {order.contact.phone}, чтобы подтвердить заказ. Оплата — {payment?.label.toLowerCase()}{" "}
            при получении: {money(order.total)}.
          </p>
        </div>
      )}

      {order.issuedCertificates.length > 0 && (
        <div className="card stack" style={{ marginTop: 16 }}>
          <h3>Ваши сертификаты</h3>
          {order.issuedCertificates.map((c) => (
            <div key={c.code} className="spread">
              <code style={{ fontSize: "1.2rem" }}>{c.code}</code>
              <span>{money(c.amount)}</span>
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
                  <td style={{ textAlign: "right" }}>{money(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ maxWidth: 320, marginLeft: "auto", marginTop: 12 }}>
          {order.discount > 0 && (
            <div className="summary-row">
              <span>Скидка ({order.promo_code})</span>
              <span>−{money(order.discount)}</span>
            </div>
          )}
          {hasGoods && (
            <div className="summary-row">
              <span>Доставка</span>
              <span>{money(order.delivery_price)}</span>
            </div>
          )}
          {order.certificate_used > 0 && (
            <div className="summary-row">
              <span>Сертификат</span>
              <span>−{money(order.certificate_used)}</span>
            </div>
          )}
          <div className="summary-row summary-total">
            <span>Итого</span>
            <span>{money(order.total)}</span>
          </div>
          <div className="summary-row small muted">
            <span>{payment?.label}</span>
            <span>{order.paid_at ? "оплачено" : "не оплачено"}</span>
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
            <strong>Курьер, {order.delivery.city}</strong>
            <div>{order.delivery.address}</div>
            {order.delivery.landmark && <div className="muted">Ориентир: {order.delivery.landmark}</div>}
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
