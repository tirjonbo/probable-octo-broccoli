import { LegalText } from "@/components/LegalText";
import { getSettings } from "@/lib/content-store";

export const metadata = { title: "Публичная оферта" };

export default function OfferPage() {
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <h1>Публичная оферта</h1>
      <LegalText text={getSettings().legal.offer} />
    </div>
  );
}
