import fs from "node:fs/promises";
import path from "node:path";
import { ensureUser } from "@/lib/auth";
import { UPLOAD_DIR, db, newId } from "@/lib/db";
import { fail, handle, ok } from "@/lib/http";

const MAX_BYTES = 15 * 1024 * 1024;

/** Определяет тип по сигнатуре файла, а не по заявленному браузером. */
function sniff(buf: Buffer): { mime: string; ext: string } | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: "image/png", ext: "png" };
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  return null;
}

export async function POST(req: Request) {
  return handle(async () => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("Файл не передан");
    if (file.size > MAX_BYTES) return fail("Файл больше 15 МБ");
    const buf = Buffer.from(await file.arrayBuffer());
    const type = sniff(buf);
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
  });
}
