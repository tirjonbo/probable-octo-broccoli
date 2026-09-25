import { getUser } from "@/lib/auth";
import { normalizeConfig } from "@/lib/catalog";
import { getProduct } from "@/lib/content-store";
import { db } from "@/lib/db";
import { body, fail, handle, ok, str } from "@/lib/http";
import { isProjectData, resizePages } from "@/lib/project";
import { getProject } from "@/lib/shop";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await getUser();
    const project = user && getProject((await params).id, user.id);
    return project ? ok(project) : fail("Не найдено", 404);
  });
}

/** Автосохранение редактора: название, конфигурация и содержимое. */
export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await getUser();
    const project = user && getProject((await params).id, user.id);
    if (!project) return fail("Не найдено", 404);
    const product = getProduct(project.product)!;
    const b = await body(req);
    const config = b.config ? normalizeConfig(product, b.config as object) : project.config;
    let data = b.data ?? project.data;
    if (!isProjectData(data)) return fail("Некорректные данные проекта");
    if (JSON.stringify(data).length > 2_000_000) return fail("Проект слишком большой");
    data = resizePages(data, config.pages);
    const title = str(b.title, 80).trim() || project.title;
    db()
      .prepare("UPDATE projects SET title = ?, config = ?, data = ?, updated_at = datetime('now') WHERE id = ?")
      .run(title, JSON.stringify(config), JSON.stringify(data), project.id);
    return ok({ ...project, title, config, data });
  }, req);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await getUser();
    if (!user) return fail("Не найдено", 404);
    db().prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run((await params).id, user.id);
    return ok({ ok: true });
  }, _req);
}
