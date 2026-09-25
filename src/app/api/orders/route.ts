import { getUser } from "@/lib/auth";
import type { DeliveryId } from "@/lib/catalog";
import { body, fail, handle, ok, str } from "@/lib/http";
import { createOrder } from "@/lib/shop";

export async function POST(req: Request) {
  return handle(async () => {
    const user = await getUser();
    if (!user) return fail("Корзина пуста");
    const b = await body<{ contact?: Record<string, unknown>; delivery?: Record<string, unknown> } & Record<string, unknown>>(req);
    const c = b.contact ?? {};
    const d = b.delivery ?? {};
    const order = createOrder(user.id, {
      contact: { name: str(c.name, 100), phone: str(c.phone, 30), email: str(c.email, 200) },
      delivery: {
        method: str(d.method) as DeliveryId,
        city: str(d.city, 100),
        address: str(d.address, 300),
        comment: str(d.comment, 500),
      },
      promo: str(b.promo, 40),
      certificate: str(b.certificate, 40),
    });
    return ok({ id: order.id, status: order.status });
  });
}
