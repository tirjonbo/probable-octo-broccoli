import { login } from "@/lib/auth";
import { body, handle, ok, str } from "@/lib/http";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const user = await login(str(b.email), str(b.password, 200));
    return ok({ user });
  }, req);
}
