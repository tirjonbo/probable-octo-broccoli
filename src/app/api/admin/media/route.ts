import { mediaUrl, saveMedia } from "@/lib/content-store";
import { adminHandle, fail, ok } from "@/lib/http";

export async function POST(req: Request) {
  return adminHandle(req, async () => {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) return fail("Файл не передан");
    const id = await saveMedia(file);
    return ok({ id, url: mediaUrl(id) });
  });
}
