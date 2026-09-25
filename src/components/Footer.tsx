import Link from "next/link";
import { PRODUCTS } from "@/lib/catalog";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container grid grid-4">
        <div>
          <div className="logo" style={{ marginBottom: 8 }}>
            Стр<b style={{ color: "var(--accent)", fontWeight: 400 }}>а</b>ницы
          </div>
          <p className="muted small">Печатаем ваши истории на хорошей бумаге.</p>
        </div>
        <div>
          <strong>Продукты</strong>
          {PRODUCTS.map((p) => (
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
        </div>
        <div>
          <strong>Связь</strong>
          <Link href="/contacts">Контакты</Link>
          <a href="mailto:hello@example.com">hello@example.com</a>
        </div>
      </div>
      <div className="container muted small" style={{ marginTop: 32 }}>
        © {new Date().getFullYear()} Страницы. Демонстрационный проект.
      </div>
    </footer>
  );
}
