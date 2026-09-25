import { deletePromo } from "@/lib/admin-store";
import { adminHandle, ok } from "@/lib/http";

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return adminHandle(req, async () => {
    deletePromo(decodeURIComponent((await params).code));
    return ok({ ok: true });
  });
}
