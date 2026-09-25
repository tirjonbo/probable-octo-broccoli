import { getUser } from "@/lib/auth";
import { body, fail, handle, ok } from "@/lib/http";
import { getCart, removeCartItem, setCartQty } from "@/lib/shop";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await getUser();
    if (!user) return fail("Нет корзины", 404);
    const b = await body(req);
    setCartQty(user.id, (await params).id, Number(b.qty));
    return ok({ items: getCart(user.id) });
  }, req);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await getUser();
    if (!user) return fail("Нет корзины", 404);
    removeCartItem(user.id, (await params).id);
    return ok({ items: getCart(user.id) });
  }, _req);
}
