import { BannersManager } from "@/components/admin/Managers";
import { listBanners } from "@/lib/content-store";

export const metadata = { title: "Баннеры" };

export default function AdminBanners() {
  return <BannersManager items={listBanners()} />;
}
