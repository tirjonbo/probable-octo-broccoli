import { savePromo } from "@/lib/admin-store";
import { adminHandle, body, ok } from "@/lib/http";

/** Создать или обновить промокод (по коду). */
export async function POST(req: Request) {
  return adminHandle(req, async () => {
    savePromo(await body(req));
    return ok({ ok: true });
  });
}
