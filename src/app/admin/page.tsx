import Link from "next/link";
import { OrderStatusPill } from "@/components/OrderStatusPill";
import { dashboardStats, searchOrders } from "@/lib/admin-store";
import { formatDate, money } from "@/lib/catalog";

export default function AdminDashboard() {
  const st = dashboardStats();
  const recent = searchOrders({ page: 1 }).orders.slice(0, 8);
  const max = Math.max(1, ...st.byDay.map((d) => d.c));
  return (
    <>
      <div className="admin-head">
        <h1>Сводка</h1>
      </div>
      <div className="grid grid-4">
        <Link href="/admin/orders?status=new" className="card" style={{ textDecoration: "none" }}>
          <div className="muted small">Новые заказы</div>
          <div className="stat-big">{st.newOrders}</div>
        </Link>
        <Link href="/admin/orders?status=unpaid" className="card" style={{ textDecoration: "none" }}>
          <div className="muted small">Ожидается наличными</div>
          <div className="stat-big">{money(st.unpaidSum)}</div>
        </Link>
        <div className="card">
          <div className="muted small">Получено за 30 дней</div>
          <div className="stat-big">{money(st.revenue30)}</div>
        </div>
        <div className="card">
          <div className="muted small">Заказов за 30 дней</div>
          <div className="stat-big">{st.orders30}</div>
          <div className="muted small">
            в работе: {st.inWork} · клиентов: {st.clients} · проектов: {st.projects}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="muted small">Заказы за 14 дней</div>
        {st.byDay.length === 0 ? (
          <p className="muted">Пока нет заказов.</p>
        ) : (
          <div className="chart-bars">
            {st.byDay.map((d) => (
              <div key={d.day} style={{ height: `${(d.c / max) * 100}%` }} title={`${d.day}: ${d.c} зак., ${money(d.s)}`} />
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="spread">
          <h3 style={{ margin: 0 }}>Последние заказы</h3>
          <Link href="/admin/orders">Все заказы →</Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>№ {o.number}</Link>
                  </td>
                  <td className="small">{formatDate(o.created_at)}</td>
                  <td>{o.contact.name}</td>
                  <td>{money(o.total)}</td>
                  <td>
                    <OrderStatusPill status={o.status} />
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td className="muted">Заказов пока нет</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
