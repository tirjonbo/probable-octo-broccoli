import { readMedia } from "@/lib/content-store";
import { fail } from "@/lib/http";

// Публичные картинки медиатеки (баннеры, продукты). Файлы неизменяемые — кэшируем надолго.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return fail("Не найдено", 404);
  const m = await readMedia(id);
  if (!m) return fail("Не найдено", 404);
  return new Response(new Uint8Array(m.data), {
    headers: { "Content-Type": m.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
