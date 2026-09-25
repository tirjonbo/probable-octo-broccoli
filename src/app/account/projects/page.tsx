import Link from "next/link";
import { DeleteProjectButton } from "@/components/DeleteProjectButton";
import { getUser } from "@/lib/auth";
import { describeConfig, getProduct, priceFor, money } from "@/lib/catalog";
import { filledSlots } from "@/lib/project";
import { listProjects } from "@/lib/shop";

export const metadata = { title: "Мои проекты" };

export default async function AccountProjects() {
  const user = (await getUser())!;
  const projects = listProjects(user.id);
  if (projects.length === 0)
    return (
      <p className="muted">
        Проектов пока нет. <Link href="/catalog">Начать новый →</Link>
      </p>
    );
  return (
    <div className="grid grid-3">
      {projects.map((p) => {
        const product = getProduct(p.product)!;
        const { filled, total } = filledSlots(p.data);
        const cover = p.data.cover.photo ?? p.data.library[0];
        return (
          <div key={p.id} className="card stack">
            <div style={{ aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", background: product.color + "55" }}>
              {cover && <img src={`/api/uploads/${cover}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div>
              <strong>{p.title}</strong>
              <div className="muted small">
                {product.title} · {describeConfig(product, p.config)}
              </div>
              <div className="small" style={{ marginTop: 4 }}>
                Заполнено {filled} из {total} · {money(priceFor(product, p.config))}
              </div>
            </div>
            <div className="spread">
              <Link href={`/editor/${p.id}`} className="btn btn-sm">
                Открыть
              </Link>
              <DeleteProjectButton id={p.id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
