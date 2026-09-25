import { saveProduct } from "@/lib/content-store";
import { adminHandle, body, ok } from "@/lib/http";

export async function POST(req: Request) {
  return adminHandle(req, async () => ok({ product: saveProduct(await body(req)) }));
}
