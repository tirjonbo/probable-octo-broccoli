import { deleteProduct, saveProduct } from "@/lib/content-store";
import { adminHandle, body, ok } from "@/lib/http";

type Ctx = { params: Promise<{ slug: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  return adminHandle(req, async () => ok({ product: saveProduct(await body(req), (await params).slug) }));
}

export async function DELETE(req: Request, { params }: Ctx) {
  return adminHandle(req, async () => {
    deleteProduct((await params).slug);
    return ok({ ok: true });
  });
}
