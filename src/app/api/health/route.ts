import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Для мониторинга и healthcheck Docker: проверяет, что база отвечает. */
export function GET() {
  try {
    db().prepare("SELECT 1").get();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
