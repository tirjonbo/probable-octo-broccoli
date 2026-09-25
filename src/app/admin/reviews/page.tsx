import { ReviewsManager } from "@/components/admin/Managers";
import { listReviews } from "@/lib/admin-store";

export const metadata = { title: "Отзывы" };

export default function AdminReviews() {
  return <ReviewsManager items={listReviews()} />;
}
