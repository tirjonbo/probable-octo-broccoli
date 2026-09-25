"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/catalog";

export function StatusSelect({ id, status }: { id: string; status: OrderStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  return (
    <select
      value={value}
      aria-label="Статус заказа"
      onChange={async (e) => {
        const next = e.target.value as OrderStatus;
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (res.ok) {
          setValue(next);
          router.refresh();
        }
      }}
      style={{ width: "auto" }}
    >
      {Object.entries(ORDER_STATUSES).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  );
}

export function MarkPaidButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn btn-ghost btn-sm"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Отметить, что оплата получена?")) return;
        setBusy(true);
        await fetch(`/api/admin/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paid: true }),
        });
        router.refresh();
      }}
    >
      Оплата получена
    </button>
  );
}
