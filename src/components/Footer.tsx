import Link from "next/link";
import { getSettings, listProducts } from "@/lib/content-store";

export function Footer() {
  const { site } = getSettings();
  const products = listProducts(true);
  return (
    <footer className="footer">
      <div className="container grid grid-4">
        <div>
          <div className="logo" style={{ marginBottom: 8 }}>
            {site.name}
          </div>
          {site.tagline && <p className="muted small">{site.tagline}</p>}
        </div>
        <div>
          <strong>Продукты</strong>
          {products.map((p) => (
            <Link key={p.slug} href={`/catalog/${p.slug}`}>
              {p.title}
            </Link>
          ))}
          <Link href="/certificates">Подарочный сертификат</Link>
        </div>
        <div>
          <strong>Покупателям</strong>
          <Link href="/delivery">Доставка и оплата</Link>
          <Link href="/faq">Частые вопросы</Link>
          <Link href="/account">Личный кабинет</Link>
          <Link href="/offer">Публичная оферта</Link>
          <Link href="/privacy">Конфиденциальность</Link>
        </div>
        <div>
          <strong>Связь</strong>
          <Link href="/contacts">Контакты</Link>
          {site.phone && <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>}
          {site.telegram && <a href={`https://t.me/${site.telegram}`}>Telegram</a>}
          {site.instagram && <a href={`https://instagram.com/${site.instagram}`}>Instagram</a>}
        </div>
      </div>
      <div className="container muted small" style={{ marginTop: 32 }}>
        © {new Date().getFullYear()} {site.name}
        {site.company && `. ${site.company}`}
      </div>
    </footer>
  );
}
