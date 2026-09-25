import { createCertificate } from "@/lib/admin-store";
import { adminHandle, body, ok } from "@/lib/http";

export async function POST(req: Request) {
  return adminHandle(req, async () => ok({ code: createCertificate(await body(req)) }));
}
