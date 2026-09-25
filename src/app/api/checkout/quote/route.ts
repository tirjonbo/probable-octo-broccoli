import { getUser } from "@/lib/auth";
import { body, handle, ok, str } from "@/lib/http";
import { computeTotals, getCart } from "@/lib/shop";

/** Предварительный расчёт суммы для страницы оформления. */
export async function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const user = await getUser();
    const lines = user ? getCart(user.id) : [];
    const totals = computeTotals(lines, {
      promo: str(b.promo) || undefined,
      certificate: str(b.certificate) || undefined,
    });
    return ok(totals);
  }, req);
}
