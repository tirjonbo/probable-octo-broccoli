import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderEditor } from "@/components/admin/OrderEditor";
import { formatDate } from "@/lib/catalog";
import { getOrder, listEvents } from "@/lib/shop";

export const metadata = { title: "Заказ" };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const order = getOrder((await params).id);
  if (!order) notFound();
  const events = listEvents(order.id).map((e) => ({ ...e, created_at: formatDate(e.created_at) }));
  return (
    <>
      <div className="admin-head">
        <div>
          <Link href="/admin/orders" className="small">
            ← Все заказы
          </Link>
          <h1 style={{ marginTop: 4 }}>Заказ № {order.number}</h1>
          <div className="muted small">
            Оформлен {formatDate(order.created_at)}
            {order.user_id && (
              <>
                {" · "}
                <Link href={`/admin/clients/${order.user_id}`}>карточка клиента</Link>
              </>
            )}
          </div>
        </div>
        <div className="row">
          {order.items.some((i) => i.project_snapshot) && (
            <Link href={`/admin/orders/${order.id}/print`} className="btn btn-ghost">
              Макет для печати
            </Link>
          )}
          <Link href={`/orders/${order.id}`} className="btn btn-ghost" target="_blank">
            Как видит клиент ↗
          </Link>
        </div>
      </div>
      <OrderEditor order={order} events={events} />
    </>
  );
}
