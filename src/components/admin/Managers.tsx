"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { money } from "@/lib/catalog";
import type { Certificate, Promo, Review } from "@/lib/admin-store";
import type { Banner } from "@/lib/content-store";
import { api } from "./api";
import { Field, ImageField, Toggle, useSaver } from "./ui";

function useRefresh() {
  const router = useRouter();
  return () => router.refresh();
}

function RowActions({ saver, onDelete }: { saver: ReturnType<typeof useSaver>; onDelete?: () => void }) {
  return (
    <div className="row">
      <button className="btn btn-sm" disabled={saver.busy}>
        {saver.busy ? "…" : "Сохранить"}
      </button>
      {saver.saved && <span className="small" style={{ color: "var(--ok)" }}>Сохранено</span>}
      {saver.error && <span className="error">{saver.error}</span>}
      <div style={{ flex: 1 }} />
      {onDelete && (
        <button type="button" className="link-btn small" style={{ color: "#b3261e" }} onClick={onDelete}>
          Удалить
        </button>
      )}
    </div>
  );
}

// ---------- Баннеры ----------

type BannerDraft = Omit<Banner, "id" | "active"> & { id?: string; active: boolean };

const emptyBanner: BannerDraft = { title: "", text: "", button_label: "", link: "/catalog", image: null, color: "#efe6da", active: true, sort: 0 };

export function BannersManager({ items }: { items: Banner[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <>
      <div className="admin-head">
        <h1>Баннеры на главной</h1>
        <button className="btn" onClick={() => setAdding(true)} disabled={adding}>
          + Новый баннер
        </button>
      </div>
      <p className="muted">Показываются слайдером над главным блоком, по очереди каждые 6 секунд. Скрытые баннеры не видны посетителям.</p>
      <div className="stack">
        {adding && <BannerCard initial={emptyBanner} onDone={() => setAdding(false)} />}
        {items.map((b) => (
          <BannerCard key={b.id} initial={{ ...b, active: !!b.active }} />
        ))}
        {items.length === 0 && !adding && <p className="muted">Баннеров нет.</p>}
      </div>
    </>
  );
}

function BannerCard({ initial, onDone }: { initial: BannerDraft; onDone?: () => void }) {
  const refresh = useRefresh();
  const saver = useSaver();
  const [b, setB] = useState(initial);
  const set = (p: Partial<BannerDraft>) => setB((x) => ({ ...x, ...p }));
  return (
    <form
      className="card stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await saver.run(() => (b.id ? api(`/api/admin/banners/${b.id}`, "PUT", b) : api("/api/admin/banners", "POST", b)));
        if (ok) {
          onDone?.();
          refresh();
        }
      }}
    >
      <div className="banner" style={{ background: b.color, minHeight: 100 }}>
        <div className="banner-text" style={{ padding: 20 }}>
          <strong style={{ fontFamily: "var(--serif)", fontSize: "1.3rem" }}>{b.title || "Заголовок"}</strong>
          {b.text && <div className="muted small">{b.text}</div>}
        </div>
        {b.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="banner-img" src={`/api/media/${b.image}`} alt="" style={{ maxHeight: 120 }} />
        )}
      </div>
      <div className="admin-grid-form">
        <Field label="Заголовок">
          <input required value={b.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Текст">
          <input value={b.text} onChange={(e) => set({ text: e.target.value })} />
        </Field>
        <Field label="Текст кнопки">
          <input value={b.button_label} onChange={(e) => set({ button_label: e.target.value })} placeholder="без кнопки — оставьте пустым" />
        </Field>
        <Field label="Ссылка кнопки" hint="например /catalog/photobook">
          <input value={b.link} onChange={(e) => set({ link: e.target.value })} />
        </Field>
        <Field label="Цвет фона">
          <input type="color" value={b.color} onChange={(e) => set({ color: e.target.value })} style={{ height: 44, padding: 4 }} />
        </Field>
        <Field label="Порядок">
          <input type="number" value={b.sort} onChange={(e) => set({ sort: Number(e.target.value) })} />
        </Field>
      </div>
      <ImageField value={b.image} onChange={(image) => set({ image })} label="Картинка справа (необязательно)" />
      <Toggle checked={b.active} onChange={(active) => set({ active })} label="Показывать на сайте" />
      <RowActions
        saver={saver}
        onDelete={
          b.id
            ? async () => {
                if (!confirm("Удалить баннер?")) return;
                await api(`/api/admin/banners/${b.id}`, "DELETE");
                refresh();
              }
            : onDone
        }
      />
    </form>
  );
}

// ---------- Промокоды ----------

export function PromosManager({ items }: { items: Promo[] }) {
  const refresh = useRefresh();
  const saver = useSaver();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(10);
  return (
    <>
      <div className="admin-head">
        <h1>Промокоды</h1>
      </div>
      <form
        className="card row"
        style={{ alignItems: "flex-end" }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (await saver.run(() => api("/api/admin/promos", "POST", { code, percent, active: true }))) {
            setCode("");
            refresh();
          }
        }}
      >
        <Field label="Код">
          <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER15" />
        </Field>
        <Field label="Скидка, %">
          <input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(Number(e.target.value))} style={{ width: 110 }} />
        </Field>
        <button className="btn" disabled={saver.busy}>Добавить</button>
        {saver.error && <span className="error">{saver.error}</span>}
      </form>
      <p className="muted small">Скидка действует на продукты (не на доставку и сертификаты). Повторное добавление существующего кода меняет процент.</p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Код</th>
              <th>Скидка</th>
              <th>Использован, раз</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.code}>
                <td><code>{p.code}</code></td>
                <td>{p.percent}%</td>
                <td>{p.used}</td>
                <td>
                  <Toggle
                    checked={!!p.active}
                    label={p.active ? "Действует" : "Выключен"}
                    onChange={async (active) => {
                      await api("/api/admin/promos", "POST", { code: p.code, percent: p.percent, active });
                      refresh();
                    }}
                  />
                </td>
                <td>
                  <button
                    className="link-btn small"
                    style={{ color: "#b3261e" }}
                    onClick={async () => {
                      if (!confirm(`Удалить промокод ${p.code}?`)) return;
                      await api(`/api/admin/promos/${encodeURIComponent(p.code)}`, "DELETE");
                      refresh();
                    }}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="muted">Промокодов нет</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------- Сертификаты ----------

export function CertificatesManager({ items }: { items: Certificate[] }) {
  const refresh = useRefresh();
  const saver = useSaver();
  const [amount, setAmount] = useState(300000);
  const [note, setNote] = useState("");
  const [created, setCreated] = useState("");
  return (
    <>
      <div className="admin-head">
        <h1>Подарочные сертификаты</h1>
      </div>
      <form
        className="card row"
        style={{ alignItems: "flex-end" }}
        onSubmit={async (e) => {
          e.preventDefault();
          let code = "";
          if (await saver.run(async () => (code = (await api<{ code: string }>("/api/admin/certificates", "POST", { amount, note })).code))) {
            setCreated(code);
            setNote("");
            refresh();
          }
        }}
      >
        <Field label="Номинал, сум">
          <input type="number" min={1000} step={1000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </Field>
        <Field label="Комментарий">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Кому / за что" />
        </Field>
        <button className="btn" disabled={saver.busy}>Выпустить вручную</button>
        {created && (
          <span>
            Код: <code style={{ fontSize: "1.1rem" }}>{created}</code>
          </span>
        )}
        {saver.error && <span className="error">{saver.error}</span>}
      </form>
      <p className="muted small">Сертификаты из заказов выпускаются автоматически, когда отмечена оплата.</p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Код</th>
              <th>Номинал</th>
              <th>Остаток</th>
              <th>Откуда</th>
              <th>Выпущен</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.code}>
                <td><code>{c.code}</code></td>
                <td style={{ whiteSpace: "nowrap" }}>{money(c.amount)}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    defaultValue={c.balance}
                    style={{ width: 130 }}
                    aria-label="Остаток"
                    onBlur={async (e) => {
                      const v = Number(e.target.value);
                      if (v !== c.balance && confirm(`Изменить остаток на ${money(v)}?`)) {
                        await api(`/api/admin/certificates/${encodeURIComponent(c.code)}`, "PATCH", { balance: v });
                        refresh();
                      }
                    }}
                  />
                </td>
                <td className="small">{c.order_number ? `заказ № ${c.order_number}` : c.note || "вручную"}</td>
                <td className="small">{c.created_at}</td>
                <td>
                  <Toggle
                    checked={!!c.active}
                    label={c.active ? "Активен" : "Выключен"}
                    onChange={async (active) => {
                      await api(`/api/admin/certificates/${encodeURIComponent(c.code)}`, "PATCH", { active });
                      refresh();
                    }}
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="muted">Сертификатов нет</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------- Отзывы ----------

type ReviewDraft = { id?: string; author: string; text: string; rating: number; active: boolean };

export function ReviewsManager({ items }: { items: Review[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <>
      <div className="admin-head">
        <h1>Отзывы</h1>
        <button className="btn" onClick={() => setAdding(true)} disabled={adding}>
          + Добавить отзыв
        </button>
      </div>
      <p className="muted">На главной показываются 6 последних включённых отзывов.</p>
      <div className="grid grid-2">
        {adding && <ReviewCard initial={{ author: "", text: "", rating: 5, active: true }} onDone={() => setAdding(false)} />}
        {items.map((r) => (
          <ReviewCard key={r.id} initial={{ ...r, active: !!r.active }} />
        ))}
      </div>
    </>
  );
}

function ReviewCard({ initial, onDone }: { initial: ReviewDraft; onDone?: () => void }) {
  const refresh = useRefresh();
  const saver = useSaver();
  const [r, setR] = useState(initial);
  return (
    <form
      className="card stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await saver.run(() => (r.id ? api(`/api/admin/reviews/${r.id}`, "PUT", r) : api("/api/admin/reviews", "POST", r)))) {
          onDone?.();
          refresh();
        }
      }}
    >
      <div className="admin-grid-form">
        <Field label="Автор">
          <input required value={r.author} onChange={(e) => setR({ ...r, author: e.target.value })} placeholder="Имя, город" />
        </Field>
        <Field label="Оценка">
          <select value={r.rating} onChange={(e) => setR({ ...r, rating: Number(e.target.value) })}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{"★".repeat(n)}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Текст">
        <textarea required value={r.text} onChange={(e) => setR({ ...r, text: e.target.value })} rows={3} />
      </Field>
      <Toggle checked={r.active} onChange={(active) => setR({ ...r, active })} label="Показывать на сайте" />
      <RowActions
        saver={saver}
        onDelete={
          r.id
            ? async () => {
                if (!confirm("Удалить отзыв?")) return;
                await api(`/api/admin/reviews/${r.id}`, "DELETE");
                refresh();
              }
            : onDone
        }
      />
    </form>
  );
}
