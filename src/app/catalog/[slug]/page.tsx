import { notFound } from "next/navigation";
import { ProductArt } from "@/components/ProductArt";
import { Configurator } from "@/components/Configurator";
import { getProduct } from "@/lib/content-store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  return { title: p?.title ?? "Продукт" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug);
  if (!product || !product.active) notFound();
  return (
    <div className="container product-layout">
      <div>
        <div className="card" style={{ background: product.color + "55", border: 0, display: "grid", placeItems: "center", padding: 48 }}>
          <ProductArt product={product} size={440} />
        </div>
        <div className="grid grid-3" style={{ marginTop: 20 }}>
          {product.features.map((f) => (
            <div key={f} className="card small" style={{ padding: 16 }}>
              {f}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h1 style={{ fontSize: "2.4rem" }}>{product.title}</h1>
        <p className="muted">{product.description}</p>
        <Configurator product={product} />
        <p className="muted small" style={{ marginTop: 16 }}>
          Изготовление: {product.productionDays}. Параметры можно изменить в редакторе.
        </p>
      </div>
    </div>
  );
}
