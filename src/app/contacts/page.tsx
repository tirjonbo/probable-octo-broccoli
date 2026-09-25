import { SITE } from "@/lib/site";

export const metadata = { title: "Контакты" };

export default function ContactsPage() {
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <h1>Контакты</h1>
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Поддержка</h3>
          <p>
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
            <br />
            <a href={`https://t.me/${SITE.telegram}`}>Telegram: @{SITE.telegram}</a>
            <br />
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
          <p className="muted small">{SITE.hours}</p>
        </div>
        <div className="card">
          <h3>Производство</h3>
          <p>{SITE.address}</p>
          <p className="muted small">{SITE.company}</p>
        </div>
      </div>
    </div>
  );
}
