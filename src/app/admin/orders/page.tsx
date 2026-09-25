import Link from "next/link";
import { OrderStatusPill } from "@/components/OrderStatusPill";
import { searchOrders } from "@/lib/admin-store";
import { ORDER_STATUSES, formatDate, money } from "@/lib/catalog";

export const metadata = { title: "Заказы" };

type SP = Promise<{ status?: string; q?: string; page?: string }>;

export default async function AdminOrders({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { orders, total, page, pages } = searchOrders({ status: sp.status, search: sp.q, page: Number(sp.page) || 1 });
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status: sp.status, q: sp.q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };
  const tabs: [string | undefined, string][] = [[undefined, "Все"], ...Object.entries(ORDER_STATUSES), ["unpaid", "Не оплачены"]];
  return (
    <>
      <div className="admin-head">
        <h1>Заказы</h1>
        <span className="muted">Найдено: {total}</span>
      </div>
      <form className="admin-filters" action="/admin/orders">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input type="search" name="q" defaultValue={sp.q} placeholder="№ заказа, телефон, имя, адрес" aria-label="Поиск" />
        <button className="btn btn-ghost btn-sm">Найти</button>
        {sp.q && (
          <Link href={link({ q: undefined, page: undefined })} className="small">
            Сбросить
          </Link>
        )}
      </form>
      <div className="tabs" style={{ flexWrap: "wrap" }}>
        {tabs.map(([id, label]) => (
          <Link key={label} href={link({ status: id, page: undefined })} className={sp.status === id ? "active" : ""}>
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
              <th>Адрес</th>
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
                  <Link href={`/admin/orders/${o.id}`}>
                    <strong>{o.number}</strong>
                  </Link>
                </td>
                <td className="small">{formatDate(o.created_at)}</td>
                <td>
                  {o.contact.name}
                  <div className="small">
                    <a href={`tel:${o.contact.phone.replace(/\s/g, "")}`}>{o.contact.phone}</a>
                  </div>
                </td>
                <td className="small muted" style={{ maxWidth: 220 }}>
                  {o.delivery.address || "—"}
                  {o.delivery.landmark && <div>{o.delivery.landmark}</div>}
                </td>
                <td className="small">
                  {o.items.map((i) => (
                    <div key={i.id}>
                      {i.title} × {i.qty}
                    </div>
                  ))}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{money(o.total)}</td>
                <td>{o.paid_at ? <span className="pill pill-ok">Оплачен</span> : <span className="pill">Нет</span>}</td>
                <td>
                  <OrderStatusPill status={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="muted center">
                  Заказов нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="row" style={{ marginTop: 16 }}>
          {page > 1 && <Link href={link({ page: String(page - 1) })}>← Назад</Link>}
          <span className="muted small">
            Страница {page} из {pages}
          </span>
          {page < pages && <Link href={link({ page: String(page + 1) })}>Вперёд →</Link>}
        </div>
      )}
    </>
  );
}
