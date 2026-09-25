import { deleteReview, saveReview } from "@/lib/admin-store";
import { adminHandle, body, ok } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  return adminHandle(req, async () => {
    saveReview(await body(req), (await params).id);
    return ok({ ok: true });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return adminHandle(req, async () => {
    deleteReview((await params).id);
    return ok({ ok: true });
  });
}
