import { CertificateBuy } from "@/components/CertificateBuy";
import { ProductArt } from "@/components/ProductArt";
import { getSettings } from "@/lib/content-store";

export const metadata = { title: "Подарочные сертификаты" };

export default function CertificatesPage() {
  const { certificates } = getSettings();
  return (
    <div className="container product-layout">
      <div className="card" style={{ background: "#f4e6e1", border: 0, display: "grid", placeItems: "center", padding: 48 }}>
        <ProductArt product={{ kind: "certificate", color: "#e3b7a8" }} size={420} />
      </div>
      <div>
        <h1 style={{ fontSize: "2.4rem" }}>Подарочный сертификат</h1>
        <p className="muted">
          Электронный код, которым можно оплатить любой продукт полностью или частично. Остаток сохраняется — его можно
          потратить в следующий раз.{certificates.validity && ` Срок действия — ${certificates.validity}.`}
        </p>
        <CertificateBuy nominals={certificates.nominals} />
      </div>
    </div>
  );
}
