import { saveBanner } from "@/lib/content-store";
import { adminHandle, body, ok } from "@/lib/http";

export async function POST(req: Request) {
  return adminHandle(req, async () => {
    saveBanner(await body(req));
    return ok({ ok: true });
  });
}
