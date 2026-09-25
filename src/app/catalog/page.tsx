import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";
import { PRODUCTS, minPrice, rub } from "@/lib/catalog";

export const metadata = { title: "Каталог" };

export default function Catalog() {
  return (
    <div className="container section">
      <h1>Каталог</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        Все продукты собираются в одном редакторе. Выберите основу — параметры можно поменять и после загрузки фото.
      </p>
      <div className="grid grid-2" style={{ marginTop: 32 }}>
        {PRODUCTS.map((p) => (
          <Link key={p.slug} href={`/catalog/${p.slug}`} className="card product-card catalog-card" style={{ flexDirection: "row", alignItems: "center" }}>
            <div className="thumb" style={{ background: p.color + "55", width: 200, flex: "none" }}>
              <ProductArt product={p} size={180} />
            </div>
            <div>
              <h3>{p.title}</h3>
              <p className="muted small">{p.description}</p>
              <strong>от {rub(minPrice(p))}</strong>
            </div>
          </Link>
        ))}
        <Link href="/certificates" className="card product-card catalog-card" style={{ flexDirection: "row", alignItems: "center" }}>
          <div className="thumb" style={{ background: "#f4e6e1", width: 200, flex: "none" }}>
            <ProductArt product={{ kind: "certificate", color: "#e3b7a8" }} size={180} />
          </div>
          <div>
            <h3>Подарочный сертификат</h3>
            <p className="muted small">Когда хочется подарить книгу, но фото у получателя.</p>
            <strong>от {rub(2000)}</strong>
          </div>
        </Link>
      </div>
    </div>
  );
}
