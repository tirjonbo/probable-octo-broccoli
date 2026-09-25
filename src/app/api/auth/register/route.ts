import { register } from "@/lib/auth";
import { body, handle, ok, str } from "@/lib/http";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const user = await register({ email: str(b.email), password: str(b.password, 200), name: str(b.name, 100) });
    return ok({ user });
  }, req);
}
