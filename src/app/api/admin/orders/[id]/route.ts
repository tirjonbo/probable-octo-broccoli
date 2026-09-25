import { getUser } from "@/lib/auth";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/catalog";
import { body, fail, handle, ok, str } from "@/lib/http";
import { markPaid, setOrderStatus } from "@/lib/shop";

/** Менеджер меняет статус заказа и/или отмечает получение оплаты. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await getUser();
    if (user?.role !== "admin") return fail("Нет доступа", 403);
    const { id } = await params;
    const b = await body(req);
    if (b.status !== undefined) {
      const status = str(b.status);
      if (!(status in ORDER_STATUSES)) return fail("Неизвестный статус");
      setOrderStatus(id, status as OrderStatus);
    }
    if (b.paid === true) markPaid(id);
    return ok({ ok: true });
  });
}
