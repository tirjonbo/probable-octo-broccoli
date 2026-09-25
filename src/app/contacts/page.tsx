import { getSettings } from "@/lib/content-store";

export const metadata = { title: "Контакты" };

export default function ContactsPage() {
  const { site } = getSettings();
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <h1>Контакты</h1>
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Связаться с нами</h3>
          <p>
            {site.phone && (
              <>
                <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>
                <br />
              </>
            )}
            {site.telegram && (
              <>
                <a href={`https://t.me/${site.telegram}`}>Telegram: @{site.telegram}</a>
                <br />
              </>
            )}
            {site.instagram && (
              <>
                <a href={`https://instagram.com/${site.instagram}`}>Instagram: @{site.instagram}</a>
                <br />
              </>
            )}
            {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
          </p>
          {site.hours && <p className="muted small">{site.hours}</p>}
        </div>
        <div className="card">
          <h3>Адрес</h3>
          <p>{site.address}</p>
          {site.company && <p className="muted small">{site.company}</p>}
        </div>
      </div>
    </div>
  );
}
