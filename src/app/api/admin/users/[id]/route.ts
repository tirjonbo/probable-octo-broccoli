import { updateClient } from "@/lib/admin-store";
import { adminHandle, body, ok } from "@/lib/http";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminHandle(req, async (admin) => {
    updateClient((await params).id, await body(req), admin.id);
    return ok({ ok: true });
  });
}
