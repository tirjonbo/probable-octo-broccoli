import { FAQ } from "@/lib/content";

export const metadata = { title: "Частые вопросы" };

export default function FaqPage() {
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <h1>Частые вопросы</h1>
      {FAQ.map((f) => (
        <details key={f.q} className="faq">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
