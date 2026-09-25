import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { db } from "@/lib/db";
import { adminHandle } from "@/lib/http";

/** Согласованная копия базы (VACUUM INTO) — можно скачать в любой момент, не останавливая сайт. */
export async function GET(req: Request) {
  return adminHandle(req, async () => {
    const file = path.join(os.tmpdir(), `backup-${Date.now()}.db`);
    db().prepare("VACUUM INTO ?").run(file);
    const data = await fs.readFile(file);
    await fs.unlink(file).catch(() => {});
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="backup-${stamp}.db"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
