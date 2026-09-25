import { ORDER_STATUSES } from "@/lib/catalog";

export function OrderStatusPill({ status }: { status: string }) {
  const label = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] ?? status;
  const cls = status === "new" ? "pill-warn" : status === "cancelled" ? "" : "pill-ok";
  return <span className={`pill ${cls}`}>{label}</span>;
}
