import { ensureUser } from "@/lib/auth";
import { getProduct, normalizeConfig } from "@/lib/catalog";
import { db, newId } from "@/lib/db";
import { body, fail, handle, ok, str } from "@/lib/http";
import { emptyProject } from "@/lib/project";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const product = getProduct(str(b.product));
    if (!product || product.kind === "certificate") return fail("Неизвестный продукт");
    let config;
    try {
      config = normalizeConfig(product, (b.config ?? {}) as object);
    } catch (e) {
      return fail((e as Error).message);
    }
    const user = await ensureUser();
    const id = newId();
    const title = str(b.title, 80).trim() || "Без названия";
    const data = emptyProject(config.pages, title);
    db()
      .prepare("INSERT INTO projects (id, user_id, product, title, config, data) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, user.id, product.slug, title, JSON.stringify(config), JSON.stringify(data));
    return ok({ id });
  });
}
