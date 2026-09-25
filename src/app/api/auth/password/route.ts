import { changePassword, getUser } from "@/lib/auth";
import { body, fail, handle, ok, str } from "@/lib/http";

export async function POST(req: Request) {
  return handle(async () => {
    const user = await getUser();
    if (!user?.email) return fail("Нужно войти", 401);
    const b = await body(req);
    await changePassword(user.id, str(b.current, 200), str(b.next, 200));
    return ok({ ok: true });
  }, req);
}
