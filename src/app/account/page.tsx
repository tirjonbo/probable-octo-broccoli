import Link from "next/link";
import { getUser } from "@/lib/auth";
import { OrderStatusPill } from "@/components/OrderStatusPill";
import { formatDate, money } from "@/lib/catalog";
import { listOrders } from "@/lib/shop";

export const metadata = { title: "Мои заказы" };

export default async function AccountOrders() {
  const user = (await getUser())!;
  const orders = listOrders(user.id);
  if (orders.length === 0)
    return (
      <p className="muted">
        Заказов пока нет. <Link href="/catalog">Выбрать продукт →</Link>
      </p>
    );
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>№</th>
            <th>Дата</th>
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
              <td>{formatDate(o.created_at, false)}</td>
              <td>{o.items.map((i) => i.title).join(", ")}</td>
              <td>{money(o.total)}</td>
              <td>
                <OrderStatusPill status={o.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
