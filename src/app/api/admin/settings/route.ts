import { saveSettings } from "@/lib/content-store";
import { adminHandle, body, ok } from "@/lib/http";

export async function PUT(req: Request) {
  return adminHandle(req, async () => ok({ settings: saveSettings(await body(req)) }));
}
