import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientEditor } from "@/components/admin/ClientEditor";
import { OrderStatusPill } from "@/components/OrderStatusPill";
import { getClient } from "@/lib/admin-store";
import { getUser } from "@/lib/auth";
import { describeConfig, formatDate, money } from "@/lib/catalog";
import { getProduct } from "@/lib/content-store";
import { listProjects } from "@/lib/shop";

export const metadata = { title: "Клиент" };

export default async function AdminClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) notFound();
  const me = await getUser();
  const projects = listProjects(id);
  // Для гостя имя и телефон берём из последнего заказа.
  const lastContact = client.orderList[0]?.contact;
  return (
    <>
      <div className="admin-head">
        <div>
          <Link href="/admin/clients" className="small">← Все клиенты</Link>
          <h1 style={{ marginTop: 4 }}>{client.name || lastContact?.name || client.email || "Клиент"}</h1>
          <div className="muted small">
            {client.email ? `Аккаунт с ${formatDate(client.created_at, false)}` : "Гость без регистрации"} · заказов: {client.orders} · оплачено: {money(client.spent)}
          </div>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", alignItems: "start" }}>
        <div className="stack">
          <div className="card">
            <h3>Заказы</h3>
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {client.orderList.map((o) => (
                    <tr key={o.id}>
                      <td><Link href={`/admin/orders/${o.id}`}>№ {o.number}</Link></td>
                      <td className="small">{formatDate(o.created_at)}</td>
                      <td className="small">{o.items.map((i) => i.title).join(", ")}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{money(o.total)}</td>
                      <td><OrderStatusPill status={o.status} /></td>
                    </tr>
                  ))}
                  {client.orderList.length === 0 && <tr><td className="muted">Заказов нет</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <h3>Проекты в редакторе</h3>
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {projects.map((p) => {
                    const product = getProduct(p.product);
                    return (
                      <tr key={p.id}>
                        <td>{p.title}</td>
                        <td className="small muted">{product ? `${product.title} · ${describeConfig(product, p.config)}` : p.product}</td>
                        <td className="small">фото: {p.data.library.length}</td>
                        <td className="small">{formatDate(p.updated_at)}</td>
                      </tr>
                    );
                  })}
                  {projects.length === 0 && <tr><td className="muted">Проектов нет</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <ClientEditor
          client={{ id: client.id, name: client.name ?? lastContact?.name ?? "", phone: client.phone ?? lastContact?.phone ?? "", email: client.email, role: client.role }}
          isSelf={me?.id === client.id}
        />
      </div>
    </>
  );
}
