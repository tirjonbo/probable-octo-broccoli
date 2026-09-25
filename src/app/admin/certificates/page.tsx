import { CertificatesManager } from "@/components/admin/Managers";
import { listCertificates } from "@/lib/admin-store";
import { formatDate } from "@/lib/catalog";

export const metadata = { title: "Сертификаты" };

export default function AdminCertificates() {
  return <CertificatesManager items={listCertificates().map((c) => ({ ...c, created_at: formatDate(c.created_at, false) }))} />;
}
