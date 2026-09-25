import { getSettings } from "@/lib/content-store";

export const metadata = { title: "Частые вопросы" };

export default function FaqPage() {
  const { faq } = getSettings();
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <h1>Частые вопросы</h1>
      {faq.map((f) => (
        <details key={f.q} className="faq">
          <summary>{f.q}</summary>
          <p style={{ whiteSpace: "pre-line" }}>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
