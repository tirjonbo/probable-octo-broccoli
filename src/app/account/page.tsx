import Link from "next/link";
import { getUser } from "@/lib/auth";
import { ORDER_STATUSES, rub } from "@/lib/catalog";
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
              <td>{new Date(o.created_at + "Z").toLocaleDateString("ru-RU")}</td>
              <td>{o.items.map((i) => i.title).join(", ")}</td>
              <td>{rub(o.total)}</td>
              <td>
                <span className={`pill ${o.status === "awaiting_payment" ? "pill-warn" : "pill-ok"}`}>{ORDER_STATUSES[o.status]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
