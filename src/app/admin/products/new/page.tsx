import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { DEFAULT_PRODUCTS } from "@/lib/catalog";

export const metadata = { title: "Новый продукт" };

export default function NewProduct() {
  const template = { ...DEFAULT_PRODUCTS[0], slug: "", title: "", short: "", description: "", image: null, sort: 100, features: [] };
  return (
    <>
      <div className="admin-head">
        <div>
          <Link href="/admin/products" className="small">← Все продукты</Link>
          <h1 style={{ marginTop: 4 }}>Новый продукт</h1>
        </div>
      </div>
      <ProductForm initial={template} isNew />
    </>
  );
}
