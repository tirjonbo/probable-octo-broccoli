import Link from "next/link";
import { BannerSlider } from "@/components/BannerSlider";
import { ProductArt } from "@/components/ProductArt";
import { listReviews } from "@/lib/admin-store";
import { minPrice, money } from "@/lib/catalog";
import { safeLink } from "@/lib/config";
import { getSettings, listBanners, listProducts } from "@/lib/content-store";

export default function Home() {
  const settings = getSettings();
  const { home } = settings;
  const products = listProducts(true);
  const banners = listBanners(true).map((b) => ({ ...b, link: safeLink(b.link) }));
  const reviews = listReviews(true).slice(0, 6);
  const hero = products[0];
  return (
    <>
      <BannerSlider banners={banners} />

      <section className="container hero">
        <div>
          {home.badge && <span className="pill">{home.badge}</span>}
          <h1 style={{ marginTop: 16 }}>{home.heroTitle}</h1>
          {home.heroText && <p className="lead">{home.heroText}</p>}
          <div className="row" style={{ marginTop: 24 }}>
            {home.buttonLabel && (
              <Link href={safeLink(home.buttonLink || "/catalog")} className="btn">
                {home.buttonLabel}
              </Link>
            )}
            <Link href="/catalog" className="btn btn-ghost">
              Весь каталог
            </Link>
          </div>
        </div>
        {hero && (
          <div className="card hero-art" style={{ background: hero.color + "55", border: 0 }}>
            <ProductArt product={hero} size={420} />
          </div>
        )}
      </section>

      {products.length > 0 && (
        <section className="container section">
          <div className="spread" style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0 }}>Что можно сделать</h2>
            <Link href="/catalog" className="muted">
              Смотреть всё →
            </Link>
          </div>
          <div className="grid grid-4">
            {products.map((p) => (
              <Link key={p.slug} href={`/catalog/${p.slug}`} className="product-card">
                <div className="thumb" style={{ background: p.color + "55" }}>
                  <ProductArt product={p} />
                </div>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{p.title}</h3>
                  <div className="muted small">{p.short}</div>
                  <div style={{ marginTop: 6 }}>от {money(minPrice(p))}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section" style={{ background: "var(--soft)" }}>
        <div className="container">
          <h2>Как это работает</h2>
          <div className="grid grid-4 steps" style={{ marginTop: 24 }}>
            <div className="step">
              <h3>Выберите продукт</h3>
              <p className="muted">Формат, обложку, бумагу и количество страниц — цена видна сразу.</p>
            </div>
            <div className="step">
              <h3>Загрузите фото</h3>
              <p className="muted">С компьютера или телефона. Проект сохраняется автоматически.</p>
            </div>
            <div className="step">
              <h3>Соберите макет</h3>
              <p className="muted">Автозаполнение, макеты страниц, подписи и темы оформления.</p>
            </div>
            <div className="step">
              <h3>Получите заказ</h3>
              <p className="muted">
                Печатаем, проверяем и привозим курьером по г. {settings.delivery.city}. Оплата наличными при получении.
              </p>
            </div>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="container section">
          <h2>Отзывы</h2>
          <div className="grid grid-3" style={{ marginTop: 24 }}>
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div aria-label={`Оценка ${r.rating} из 5`} style={{ color: "var(--accent)" }}>
                  {"★".repeat(r.rating)}
                  <span style={{ color: "var(--line)" }}>{"★".repeat(5 - r.rating)}</span>
                </div>
                <p style={{ margin: "12px 0" }}>{r.text}</p>
                <div className="muted small">{r.author}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {settings.faq.length > 0 && (
        <section className="container section" style={{ maxWidth: 800 }}>
          <h2>Частые вопросы</h2>
          {settings.faq.slice(0, 5).map((f) => (
            <details key={f.q} className="faq">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
          <p style={{ marginTop: 20 }}>
            <Link href="/faq">Все вопросы →</Link>
          </p>
        </section>
      )}
    </>
  );
}
