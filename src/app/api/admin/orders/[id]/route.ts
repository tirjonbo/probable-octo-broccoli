import { type OrderEdit, deleteOrder, updateOrder } from "@/lib/admin-store";
import { adminHandle, authorName, body, ok } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

/** Менеджер редактирует заказ: статус, оплата, контакты, адрес, позиции, скидка, доставка, заметка. */
export async function PATCH(req: Request, { params }: Ctx) {
  return adminHandle(req, async (admin) => {
    const order = updateOrder((await params).id, await body<OrderEdit>(req), authorName(admin));
    return ok({ order });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return adminHandle(req, async () => {
    deleteOrder((await params).id);
    return ok({ ok: true });
  });
}
