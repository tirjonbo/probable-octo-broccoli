import { logout } from "@/lib/auth";
import { handle, ok } from "@/lib/http";

export async function POST(req: Request) {
  return handle(async () => {
    await logout();
    return ok({ ok: true });
  }, req);
}
