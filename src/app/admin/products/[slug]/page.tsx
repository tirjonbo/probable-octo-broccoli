import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProduct } from "@/lib/content-store";
import { db } from "@/lib/db";

export const metadata = { title: "Продукт" };

export default async function EditProduct({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const { c } = db().prepare("SELECT COUNT(*) AS c FROM projects WHERE product = ?").get(product.slug) as { c: number };
  return (
    <>
      <div className="admin-head">
        <div>
          <Link href="/admin/products" className="small">← Все продукты</Link>
          <h1 style={{ marginTop: 4 }}>{product.title}</h1>
          <div className="muted small">Проектов клиентов по этому продукту: {c}</div>
        </div>
        <Link href={`/catalog/${product.slug}`} target="_blank" className="btn btn-ghost">Открыть на сайте ↗</Link>
      </div>
      <ProductForm initial={product} usedByProjects={c > 0} />
    </>
  );
}
