"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CERTIFICATE_NOMINALS, money } from "@/lib/catalog";

export function CertificateBuy() {
  const router = useRouter();
  const [amount, setAmount] = useState(CERTIFICATE_NOMINALS[1]);
  const [busy, setBusy] = useState(false);
  return (
    <div className="card stack" style={{ marginTop: 24 }}>
      <div className="muted small">Номинал</div>
      <div className="choices">
        {CERTIFICATE_NOMINALS.map((n) => (
          <button key={n} type="button" className="choice" aria-pressed={amount === n} onClick={() => setAmount(n)}>
            {money(n)}
          </button>
        ))}
      </div>
      <div className="spread" style={{ marginTop: 16 }}>
        <div className="price-big">{money(amount)}</div>
        <button
          className="btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const res = await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ certificateAmount: amount }),
            });
            if (res.ok) {
              router.push("/cart");
              router.refresh();
            } else setBusy(false);
          }}
        >
          В корзину
        </button>
      </div>
    </div>
  );
}
