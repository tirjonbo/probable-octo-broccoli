import fs from "node:fs/promises";
import path from "node:path";
import { getUser } from "@/lib/auth";
import { UPLOAD_DIR, db } from "@/lib/db";
import { fail } from "@/lib/http";

// Фото приватные: отдаём владельцу и администратору (для печати).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return fail("Не найдено", 404);
  const row = db().prepare("SELECT user_id, file, mime FROM uploads WHERE id = ?").get(id) as
    | { user_id: string; file: string; mime: string }
    | undefined;
  if (!row || (row.user_id !== user.id && user.role !== "admin")) return fail("Не найдено", 404);
  const data = await fs.readFile(path.join(UPLOAD_DIR, path.basename(row.file)));
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": row.mime, "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
