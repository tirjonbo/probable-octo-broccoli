import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkPaidButton, StatusSelect } from "@/components/StatusSelect";
import { getUser } from "@/lib/auth";
import { ORDER_STATUSES, type OrderStatus, formatDate, money } from "@/lib/catalog";
import { listOrders } from "@/lib/shop";

export const metadata = { title: "Админка" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await getUser();
  if (user?.role !== "admin") notFound();
  const { status } = await searchParams;
  const all = listOrders();
  const orders = status ? all.filter((o) => o.status === status) : all;
  const revenue = all.filter((o) => o.paid_at && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const unpaid = all.filter((o) => !o.paid_at && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  return (
    <div className="container section">
      <h1>Заказы</h1>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="muted small">Новые</div>
          <div className="price-big">{all.filter((o) => o.status === "new").length}</div>
        </div>
        <div className="card">
          <div className="muted small">В работе</div>
          <div className="price-big">{all.filter((o) => ["confirmed", "printing", "shipped"].includes(o.status)).length}</div>
        </div>
        <div className="card">
          <div className="muted small">Получено</div>
          <div className="price-big" style={{ fontSize: "1.6rem" }}>{money(revenue)}</div>
        </div>
        <div className="card">
          <div className="muted small">Ожидается наличными</div>
          <div className="price-big" style={{ fontSize: "1.6rem" }}>{money(unpaid)}</div>
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
              <th>Клиент и адрес</th>
              <th>Состав</th>
              <th>Сумма</th>
              <th>Оплата</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/orders/${o.id}`}>{o.number}</Link>
                </td>
                <td className="small">{formatDate(o.created_at)}</td>
                <td>
                  {o.contact.name}
                  <div className="small">
                    <a href={`tel:${o.contact.phone.replace(/\s/g, "")}`}>{o.contact.phone}</a>
                  </div>
                  <div className="muted small">
                    {o.delivery.address}
                    {o.delivery.landmark && <> · {o.delivery.landmark}</>}
                    {o.delivery.comment && <div>«{o.delivery.comment}»</div>}
                  </div>
                </td>
                <td className="small">
                  {o.items.map((i) => (
                    <div key={i.id}>
                      {i.title} × {i.qty}
                    </div>
                  ))}
                  {o.items.some((i) => i.project_snapshot) && (
                    <Link href={`/admin/orders/${o.id}`} className="small">
                      Макет для печати →
                    </Link>
                  )}
                </td>
                <td>{money(o.total)}</td>
                <td>{o.paid_at ? <span className="pill pill-ok">Оплачен</span> : <MarkPaidButton id={o.id} />}</td>
                <td>
                  <StatusSelect id={o.id} status={o.status as OrderStatus} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="muted center">
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
