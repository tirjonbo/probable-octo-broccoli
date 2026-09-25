import { getUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/http";
import { getOrder, markPaid } from "@/lib/shop";

/** Тестовый платёжный шлюз — см. комментарий к markPaid. Отключается в продакшене. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_PAYMENTS !== "1")
      return fail("Тестовая оплата отключена", 403);
    const user = await getUser();
    const order = getOrder((await params).id);
    if (!user || !order || order.user_id !== user.id) return fail("Не найдено", 404);
    markPaid(order.id);
    return ok({ ok: true });
  });
}
