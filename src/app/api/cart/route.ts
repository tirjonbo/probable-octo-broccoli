import { ensureUser, getUser } from "@/lib/auth";
import { body, handle, ok, str } from "@/lib/http";
import { addCertificateToCart, addProjectToCart, getCart } from "@/lib/shop";

export async function GET() {
  return handle(async () => {
    const user = await getUser();
    return ok({ items: user ? getCart(user.id) : [] });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const user = await ensureUser();
    if (b.certificateAmount) addCertificateToCart(user.id, Number(b.certificateAmount));
    else addProjectToCart(user.id, str(b.projectId));
    return ok({ items: getCart(user.id) });
  });
}
