"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PayButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
          if (!res.ok) setError((await res.json()).error ?? "Ошибка оплаты");
          setBusy(false);
          router.refresh();
        }}
      >
        {busy ? "Оплачиваем…" : "Оплатить (тест)"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
