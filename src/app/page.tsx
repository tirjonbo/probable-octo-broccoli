import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";
import { PRODUCTS, minPrice, rub } from "@/lib/catalog";
import { db } from "@/lib/db";
import { FAQ } from "@/lib/content";

export default function Home() {
  const reviews = db().prepare("SELECT author, text, rating FROM reviews ORDER BY created_at DESC LIMIT 6").all() as {
    author: string;
    text: string;
    rating: number;
  }[];
  return (
    <>
      <section className="container hero">
        <div>
          <span className="pill">Печать от 3 дней</span>
          <h1 style={{ marginTop: 16 }}>Ваши фотографии заслуживают страниц, а не папки на телефоне</h1>
          <p className="lead">
            Загрузите снимки, выберите оформление — редактор сам разложит их по страницам. Останется поправить детали и
            оформить заказ.
          </p>
          <div className="row" style={{ marginTop: 24 }}>
            <Link href="/catalog/photobook" className="btn">
              Создать фотокнигу
            </Link>
            <Link href="/catalog" className="btn btn-ghost">
              Весь каталог
            </Link>
          </div>
        </div>
        <div className="card" style={{ display: "grid", placeItems: "center", background: "#efe6da", border: 0, padding: 40 }}>
          <ProductArt product={PRODUCTS[0]} size={420} />
        </div>
      </section>

      <section className="container section">
        <div className="spread" style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Что можно сделать</h2>
          <Link href="/catalog" className="muted">
            Смотреть всё →
          </Link>
        </div>
        <div className="grid grid-4">
          {PRODUCTS.map((p) => (
            <Link key={p.slug} href={`/catalog/${p.slug}`} className="product-card">
              <div className="thumb" style={{ background: p.color + "55" }}>
                <ProductArt product={p} />
              </div>
              <div>
                <h3 style={{ marginBottom: 4 }}>{p.title}</h3>
                <div className="muted small">{p.short}</div>
                <div style={{ marginTop: 6 }}>от {rub(minPrice(p))}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
              <h3>Получите книгу</h3>
              <p className="muted">Печатаем, проверяем и отправляем курьером, в пункт выдачи или почтой.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>Отзывы</h2>
        <div className="grid grid-3" style={{ marginTop: 24 }}>
          {reviews.map((r, i) => (
            <div key={i} className="card">
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

      <section className="container section" style={{ maxWidth: 800 }}>
        <h2>Частые вопросы</h2>
        {FAQ.slice(0, 5).map((f) => (
          <details key={f.q} className="faq">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <p style={{ marginTop: 20 }}>
          <Link href="/faq">Все вопросы →</Link>
        </p>
      </section>
    </>
  );
}
