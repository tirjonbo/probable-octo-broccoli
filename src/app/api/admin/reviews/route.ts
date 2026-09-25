import { saveReview } from "@/lib/admin-store";
import { adminHandle, body, ok } from "@/lib/http";

export async function POST(req: Request) {
  return adminHandle(req, async () => {
    saveReview(await body(req));
    return ok({ ok: true });
  });
}
