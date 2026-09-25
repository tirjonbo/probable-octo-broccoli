import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";
import { PRODUCT_KINDS, minPrice, money } from "@/lib/catalog";
import { listProducts } from "@/lib/content-store";

export const metadata = { title: "Продукты" };

export default function AdminProducts() {
  const products = listProducts();
  return (
    <>
      <div className="admin-head">
        <h1>Продукты и цены</h1>
        <Link href="/admin/products/new" className="btn">+ Новый продукт</Link>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th />
              <th>Продукт</th>
              <th>Тип</th>
              <th>Форматы</th>
              <th>Цена от</th>
              <th>На сайте</th>
              <th>Порядок</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.slug}>
                <td style={{ width: 84 }}>
                  <div style={{ width: 72, height: 54, borderRadius: 8, overflow: "hidden", background: p.color + "55", display: "grid", placeItems: "center" }}>
                    <ProductArt product={p} size={70} />
                  </div>
                </td>
                <td>
                  <Link href={`/admin/products/${p.slug}`}><strong>{p.title}</strong></Link>
                  <div className="muted small">/catalog/{p.slug}</div>
                </td>
                <td className="small">{PRODUCT_KINDS[p.kind]}</td>
                <td className="small">{p.formats.map((f) => f.label).join(", ")}</td>
                <td style={{ whiteSpace: "nowrap" }}>{money(minPrice(p))}</td>
                <td>{p.active ? <span className="pill pill-ok">Показан</span> : <span className="pill">Скрыт</span>}</td>
                <td>{p.sort}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
