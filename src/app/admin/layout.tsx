import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getUser } from "@/lib/auth";
import { getSettings } from "@/lib/content-store";
import { db } from "@/lib/db";

export const metadata = { title: "Админка", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (user?.role !== "admin") notFound();
  const { c } = db().prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'new'").get() as { c: number };
  return (
    <div className="admin-shell">
      <AdminNav newOrders={c} siteName={getSettings().site.name} />
      <div className="admin-main">{children}</div>
    </div>
  );
}
