import { getUser } from "@/lib/auth";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/catalog";
import { body, fail, handle, ok, str } from "@/lib/http";
import { setOrderStatus } from "@/lib/shop";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await getUser();
    if (user?.role !== "admin") return fail("Нет доступа", 403);
    const status = str((await body(req)).status);
    if (!(status in ORDER_STATUSES)) return fail("Неизвестный статус");
    setOrderStatus((await params).id, status as OrderStatus);
    return ok({ ok: true });
  });
}
