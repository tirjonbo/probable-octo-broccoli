import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { getUser } from "@/lib/auth";
import { getProduct } from "@/lib/catalog";
import { LAYOUTS, THEMES } from "@/lib/project";
import { type ProjectRow, getOrder } from "@/lib/shop";

export const metadata = { title: "Макет для печати" };

/**
 * Заглушка экспорта в типографию: страницы макета в браузере, печать или «Сохранить как PDF».
 * Оригиналы фото можно скачать по ссылкам. Позже заменить на генерацию print-ready PDF с вылетами.
 */
export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (user?.role !== "admin") notFound();
  const order = getOrder((await params).id);
  if (!order) notFound();
  const projects = order.items
    .filter((i) => i.project_snapshot)
    .map((i) => ({ item: i, project: JSON.parse(i.project_snapshot!) as ProjectRow }));
  return (
    <div className="container section print-sheet">
      <div className="spread no-print">
        <h1 style={{ margin: 0 }}>Заказ № {order.number} — макеты</h1>
        <PrintButton />
      </div>
      {projects.map(({ item, project }) => {
        const product = getProduct(project.product)!;
        const aspect = product.formats.find((f) => f.id === project.config.format)?.aspect ?? 1;
        const theme = THEMES.find((t) => t.id === project.data.theme) ?? THEMES[0];
        const w = 340;
        const pages = [
          { label: "Обложка", slots: [[0.1, 0.08, 0.8, 0.6]] as const, photos: [project.data.cover.photo], caption: `${project.data.cover.title} — ${project.data.cover.subtitle}` },
          ...project.data.pages.map((p, i) => ({ label: `Стр. ${i + 1}`, slots: LAYOUTS[p.layout].slots, photos: p.photos, caption: p.caption })),
        ];
        const photos = [...new Set(pages.flatMap((p) => p.photos).filter(Boolean))] as string[];
        return (
          <section key={item.id} style={{ marginTop: 32 }}>
            <h2>{item.title} × {item.qty}</h2>
            <p className="muted">{item.details}</p>
            <div className="row" style={{ alignItems: "flex-start" }}>
              {pages.map((p) => (
                <figure key={p.label} style={{ margin: 0, breakInside: "avoid" }}>
                  <div style={{ position: "relative", width: w, height: w / aspect, background: theme.background, border: "1px solid var(--line)" }}>
                    {p.slots.map((r, s) =>
                      p.photos[s] ? (
                        <img
                          key={s}
                          src={`/api/uploads/${p.photos[s]}`}
                          alt=""
                          style={{ position: "absolute", left: `${r[0] * 100}%`, top: `${r[1] * 100}%`, width: `${r[2] * 100}%`, height: `${r[3] * 100}%`, objectFit: "cover" }}
                        />
                      ) : null,
                    )}
                  </div>
                  <figcaption className="small muted">
                    {p.label}
                    {p.caption && ` · «${p.caption}»`}
                  </figcaption>
                </figure>
              ))}
            </div>
            <details className="no-print" style={{ marginTop: 16 }}>
              <summary>Оригиналы фото ({photos.length})</summary>
              {photos.map((id, i) => (
                <div key={id}>
                  <a href={`/api/uploads/${id}`} download={`${order.number}-${i + 1}`}>
                    Фото {i + 1}
                  </a>
                </div>
              ))}
            </details>
          </section>
        );
      })}
    </div>
  );
}
