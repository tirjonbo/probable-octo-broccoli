import Link from "next/link";
import { searchClients } from "@/lib/admin-store";
import { formatDate, money } from "@/lib/catalog";

export const metadata = { title: "Клиенты" };

export default async function AdminClients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const clients = searchClients(q);
  return (
    <>
      <div className="admin-head">
        <h1>Клиенты</h1>
        <span className="muted">{clients.length}</span>
      </div>
      <form className="admin-filters" action="/admin/clients">
        <input type="search" name="q" defaultValue={q} placeholder="Имя, телефон, e-mail" aria-label="Поиск" />
        <button className="btn btn-ghost btn-sm">Найти</button>
        {q && <Link href="/admin/clients" className="small">Сбросить</Link>}
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Клиент</th>
              <th>Контакты</th>
              <th>Заказов</th>
              <th>Оплачено</th>
              <th>Последний заказ</th>
              <th>Проектов</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/clients/${c.id}`}>
                    <strong>{c.name || c.email || "Без имени"}</strong>
                  </Link>
                  <div className="small">
                    {c.role === "admin" ? <span className="pill pill-ok">админ</span> : c.email ? <span className="pill">аккаунт</span> : <span className="pill">гость</span>}
                  </div>
                </td>
                <td className="small">
                  {c.phone && <div>{c.phone}</div>}
                  {c.email && <div className="muted">{c.email}</div>}
                </td>
                <td>{c.orders}</td>
                <td style={{ whiteSpace: "nowrap" }}>{money(c.spent)}</td>
                <td className="small">{c.last_order ? formatDate(c.last_order, false) : "—"}</td>
                <td>{c.projects}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="muted center">Никого не нашли</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
