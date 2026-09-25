import { PromosManager } from "@/components/admin/Managers";
import { listPromos } from "@/lib/admin-store";

export const metadata = { title: "Промокоды" };

export default function AdminPromos() {
  return <PromosManager items={listPromos()} />;
}
