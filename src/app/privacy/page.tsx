import { LegalText } from "@/components/LegalText";
import { getSettings } from "@/lib/content-store";

export const metadata = { title: "Политика конфиденциальности" };

export default function PrivacyPage() {
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <h1>Политика конфиденциальности</h1>
      <LegalText text={getSettings().legal.privacy} />
    </div>
  );
}
