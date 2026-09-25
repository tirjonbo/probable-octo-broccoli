"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Settings } from "@/lib/config";
import { api } from "./api";
import { Field, SaveBar, useSaver } from "./ui";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const saver = useSaver();
  const [s, setS] = useState(initial);
  const [nominals, setNominals] = useState(initial.certificates.nominals.join(", "));
  function set<K extends keyof Settings>(key: K, patch: Partial<Settings[K]>) {
    setS((x) => ({ ...x, [key]: { ...(x[key] as object), ...patch } }));
  }
  const inp = <K extends keyof Settings>(key: K, field: keyof Settings[K] & string) => ({
    value: String(s[key][field] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, { [field]: e.target.value } as Partial<Settings[K]>),
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const body = {
          ...s,
          certificates: { ...s.certificates, nominals: nominals.split(/[,;\s]+/).map((x) => Number(x.replace(/\D/g, ""))).filter(Boolean) },
        };
        if (await saver.run(() => api("/api/admin/settings", "PUT", body))) router.refresh();
      }}
      className="stack"
    >
      <div className="admin-head">
        <h1>Настройки сайта</h1>
      </div>

      <div className="card stack">
        <h3>Магазин и контакты</h3>
        <div className="admin-grid-form">
          <Field label="Название магазина"><input required {...inp("site", "name")} /></Field>
          <Field label="Подпись под логотипом (в подвале)"><input {...inp("site", "tagline")} /></Field>
          <Field label="Телефон"><input {...inp("site", "phone")} placeholder="+998 90 123 45 67" /></Field>
          <Field label="Telegram" hint="логин без @"><input {...inp("site", "telegram")} /></Field>
          <Field label="Instagram" hint="логин без @"><input {...inp("site", "instagram")} /></Field>
          <Field label="E-mail"><input {...inp("site", "email")} /></Field>
          <Field label="Часы работы"><input {...inp("site", "hours")} /></Field>
        </div>
        <Field label="Адрес"><input {...inp("site", "address")} /></Field>
        <Field label="Юрлицо и реквизиты (в подвале и на странице контактов)"><input {...inp("site", "company")} /></Field>
      </div>

      <div className="card stack">
        <h3>Доставка</h3>
        <div className="admin-grid-form">
          <Field label="Город"><input required {...inp("delivery", "city")} /></Field>
          <Field label="Стоимость, сум" hint="0 — бесплатно">
            <input type="number" min={0} step={1000} value={s.delivery.price} onChange={(e) => set("delivery", { price: Number(e.target.value) })} />
          </Field>
          <Field label="Срок доставки"><input {...inp("delivery", "days")} placeholder="1–2 дня после изготовления" /></Field>
        </div>
        <p className="muted small" style={{ margin: 0 }}>Новая цена применяется к новым заказам. В уже оформленных заказах доставку можно поменять вручную.</p>
      </div>

      <div className="card stack">
        <h3>Главная страница</h3>
        <Field label="Плашка над заголовком"><input {...inp("home", "badge")} /></Field>
        <Field label="Заголовок"><input required {...inp("home", "heroTitle")} /></Field>
        <Field label="Текст под заголовком"><textarea rows={2} {...inp("home", "heroText")} /></Field>
        <div className="admin-grid-form">
          <Field label="Текст кнопки"><input {...inp("home", "buttonLabel")} /></Field>
          <Field label="Ссылка кнопки"><input {...inp("home", "buttonLink")} placeholder="/catalog/photobook" /></Field>
        </div>
        <p className="muted small" style={{ margin: 0 }}>Баннеры-слайдер настраиваются в разделе «Баннеры».</p>
      </div>

      <div className="card stack">
        <h3>Подарочные сертификаты</h3>
        <div className="admin-grid-form">
          <Field label="Номиналы, сум" hint="через запятую"><input value={nominals} onChange={(e) => setNominals(e.target.value)} /></Field>
          <Field label="Срок действия"><input {...inp("certificates", "validity")} placeholder="1 год" /></Field>
        </div>
      </div>

      <div className="card stack">
        <h3>SEO — как сайт выглядит в поиске и мессенджерах</h3>
        <Field label="Заголовок"><input {...inp("seo", "title")} /></Field>
        <Field label="Описание"><textarea rows={2} {...inp("seo", "description")} /></Field>
      </div>

      <div className="card stack">
        <div className="spread">
          <h3 style={{ margin: 0 }}>Частые вопросы</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setS((x) => ({ ...x, faq: [...x.faq, { q: "", a: "" }] }))}>
            + Вопрос
          </button>
        </div>
        {s.faq.map((f, i) => (
          <div key={i} className="stack" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input value={f.q} placeholder="Вопрос" aria-label="Вопрос" onChange={(e) => setS((x) => ({ ...x, faq: x.faq.map((y, k) => (k === i ? { ...y, q: e.target.value } : y)) }))} />
              <button type="button" className="btn btn-ghost btn-sm" disabled={i === 0} aria-label="Выше" onClick={() => setS((x) => { const faq = [...x.faq]; [faq[i - 1], faq[i]] = [faq[i], faq[i - 1]]; return { ...x, faq }; })}>↑</button>
              <button type="button" className="btn btn-ghost btn-sm" aria-label="Удалить" onClick={() => setS((x) => ({ ...x, faq: x.faq.filter((_, k) => k !== i) }))}>✕</button>
            </div>
            <textarea value={f.a} placeholder="Ответ" aria-label="Ответ" rows={2} onChange={(e) => setS((x) => ({ ...x, faq: x.faq.map((y, k) => (k === i ? { ...y, a: e.target.value } : y)) }))} />
          </div>
        ))}
      </div>

      <div className="card stack">
        <h3>Юридические тексты</h3>
        <p className="muted small" style={{ margin: 0 }}>Обычный текст. Пустая строка — новый абзац.</p>
        <Field label="Публичная оферта (/offer)"><textarea rows={10} {...inp("legal", "offer")} /></Field>
        <Field label="Политика конфиденциальности (/privacy)"><textarea rows={8} {...inp("legal", "privacy")} /></Field>
      </div>

      <SaveBar {...saver} label="Сохранить настройки" />
    </form>
  );
}
