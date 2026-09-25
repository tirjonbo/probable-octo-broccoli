import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusSelect } from "@/components/StatusSelect";
import { getUser } from "@/lib/auth";
import { ORDER_STATUSES, type OrderStatus, rub } from "@/lib/catalog";
import { listOrders } from "@/lib/shop";

export const metadata = { title: "Админка" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await getUser();
  if (user?.role !== "admin") notFound();
  const { status } = await searchParams;
  const all = listOrders();
  const orders = status ? all.filter((o) => o.status === status) : all;
  const revenue = all.filter((o) => o.paid_at && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  return (
    <div className="container section">
      <h1>Заказы</h1>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="muted small">Всего заказов</div>
          <div className="price-big">{all.length}</div>
        </div>
        <div className="card">
          <div className="muted small">Ждут оплаты</div>
          <div className="price-big">{all.filter((o) => o.status === "awaiting_payment").length}</div>
        </div>
        <div className="card">
          <div className="muted small">В работе</div>
          <div className="price-big">{all.filter((o) => o.status === "paid" || o.status === "printing").length}</div>
        </div>
        <div className="card">
          <div className="muted small">Выручка</div>
          <div className="price-big">{rub(revenue)}</div>
        </div>
      </div>
      <div className="tabs" style={{ flexWrap: "wrap" }}>
        <Link href="/admin" className={!status ? "active" : ""}>
          Все
        </Link>
        {Object.entries(ORDER_STATUSES).map(([id, label]) => (
          <Link key={id} href={`/admin?status=${id}`} className={status === id ? "active" : ""}>
            {label}
          </Link>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>№</th>
              <th>Дата</th>
              <th>Клиент</th>
              <th>Состав</th>
              <th>Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/orders/${o.id}`}>{o.number}</Link>
                </td>
                <td>{new Date(o.created_at + "Z").toLocaleString("ru-RU")}</td>
                <td>
                  {o.contact.name}
                  <div className="muted small">
                    {o.contact.phone}
                    <br />
                    {o.contact.email}
                  </div>
                </td>
                <td className="small">
                  {o.items.map((i) => (
                    <div key={i.id}>
                      {i.title} × {i.qty}
                    </div>
                  ))}
                </td>
                <td>{rub(o.total)}</td>
                <td>
                  <StatusSelect id={o.id} status={o.status as OrderStatus} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="muted center">
                  Заказов нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
