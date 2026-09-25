import { updateCertificate } from "@/lib/admin-store";
import { adminHandle, body, ok } from "@/lib/http";

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return adminHandle(req, async () => {
    updateCertificate(decodeURIComponent((await params).code), await body(req));
    return ok({ ok: true });
  });
}
