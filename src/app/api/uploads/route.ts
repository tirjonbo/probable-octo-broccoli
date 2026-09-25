import fs from "node:fs/promises";
import path from "node:path";
import { ensureUser } from "@/lib/auth";
import { UPLOAD_DIR, db, newId } from "@/lib/db";
import { fail, handle, ok } from "@/lib/http";
import { sniffImage } from "@/lib/images";

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(req: Request) {
  return handle(async () => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("Файл не передан");
    if (file.size > MAX_BYTES) return fail("Файл больше 15 МБ");
    const buf = Buffer.from(await file.arrayBuffer());
    const type = sniffImage(buf);
    if (!type) return fail("Поддерживаются JPEG, PNG и WebP");
    const width = Number(form.get("width")) || null;
    const height = Number(form.get("height")) || null;
    const user = await ensureUser();
    const id = newId();
    const name = `${id}.${type.ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
    db()
      .prepare("INSERT INTO uploads (id, user_id, file, mime, width, height) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, user.id, name, type.mime, width, height);
    return ok({ id, url: `/api/uploads/${id}`, width, height });
  }, req);
}
