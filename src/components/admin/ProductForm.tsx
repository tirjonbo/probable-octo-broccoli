"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Format, type OptionChoice, PRODUCT_KINDS, type Product, type ProductKind, defaultConfig, money, priceFor } from "@/lib/catalog";
import { api } from "./api";
import { Field, ImageField, SaveBar, Toggle, useSaver } from "./ui";

const newId = () => Math.random().toString(36).slice(2, 8);

type FormatRow = Format & { width: number; height: number };

function toRows(formats: Format[]): FormatRow[] {
  return formats.map((f) => ({
    ...f,
    width: f.width ?? Math.round(f.aspect * 20 * 10) / 10,
    height: f.height ?? 20,
  }));
}

export function ProductForm({ initial, isNew = false, usedByProjects = false }: { initial: Product; isNew?: boolean; usedByProjects?: boolean }) {
  const router = useRouter();
  const saver = useSaver();
  const [p, setP] = useState<Product>(initial);
  const [formats, setFormats] = useState<FormatRow[]>(toRows(initial.formats));
  const set = (patch: Partial<Product>) => setP((x) => ({ ...x, ...patch }));

  const preview = { ...p, formats };
  let example = "";
  try {
    example = money(priceFor(preview, defaultConfig(preview)));
  } catch {
    example = "—";
  }

  async function save() {
    const body = { ...p, formats };
    const ok = await saver.run(async () => {
      const r = await api<{ product: Product }>(isNew ? "/api/admin/products" : `/api/admin/products/${initial.slug}`, isNew ? "POST" : "PUT", body);
      if (isNew || r.product.slug !== initial.slug) router.replace(`/admin/products/${r.product.slug}`);
    });
    if (ok) router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="stack"
    >
      <div className="card stack">
        <h3>Основное</h3>
        <div className="admin-grid-form">
          <Field label="Название">
            <input required value={p.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Адрес страницы (slug)" hint={usedByProjects ? "Нельзя изменить: есть проекты клиентов" : "латиница, цифры и дефис: /catalog/…"}>
            <input
              required
              value={p.slug}
              disabled={usedByProjects}
              pattern="[a-z0-9-]+"
              onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            />
          </Field>
          <Field label="Тип (как устроен редактор)">
            <select value={p.kind} onChange={(e) => set({ kind: e.target.value as ProductKind })}>
              {Object.entries(PRODUCT_KINDS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Короткое описание (в карточке каталога)">
          <input value={p.short} onChange={(e) => set({ short: e.target.value })} maxLength={160} />
        </Field>
        <Field label="Описание на странице продукта">
          <textarea value={p.description} onChange={(e) => set({ description: e.target.value })} rows={3} />
        </Field>
        <div className="admin-grid-form">
          <Field label="Срок изготовления">
            <input value={p.productionDays} onChange={(e) => set({ productionDays: e.target.value })} placeholder="5–7 рабочих дней" />
          </Field>
          <Field label="Цвет фона карточки">
            <input type="color" value={p.color} onChange={(e) => set({ color: e.target.value })} style={{ height: 44, padding: 4 }} />
          </Field>
          <Field label="Порядок в каталоге" hint="меньше — выше">
            <input type="number" value={p.sort} onChange={(e) => set({ sort: Number(e.target.value) })} />
          </Field>
        </div>
        <ImageField label="Фото продукта (если нет — рисуется иллюстрация)" value={p.image} onChange={(image) => set({ image })} />
        <Field label="Преимущества (по одному в строке, до 6)">
          <textarea value={p.features.join("\n")} onChange={(e) => set({ features: e.target.value.split("\n") })} rows={3} />
        </Field>
        <Toggle checked={p.active} onChange={(active) => set({ active })} label="Показывать на сайте" />
      </div>

      <div className="card stack">
        <div className="spread">
          <h3 style={{ margin: 0 }}>Форматы и базовые цены</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFormats((f) => [...f, { id: newId(), label: "Новый формат", aspect: 1, price: 0, width: 20, height: 20 }])}>
            + Формат
          </button>
        </div>
        <p className="muted small" style={{ margin: 0 }}>
          Размеры задают пропорции страницы в редакторе. Цена — стоимость продукта с минимальным числом страниц.
        </p>
        {formats.map((f, i) => (
          <div key={f.id} className="admin-list-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1.3fr auto" }}>
            <Field label="Название">
              <input value={f.label} onChange={(e) => setFormats((xs) => xs.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
            </Field>
            <Field label="Ширина, см">
              <input type="number" step="0.1" min={1} value={f.width} onChange={(e) => setFormats((xs) => xs.map((x, k) => (k === i ? { ...x, width: Number(e.target.value) } : x)))} />
            </Field>
            <Field label="Высота, см">
              <input type="number" step="0.1" min={1} value={f.height} onChange={(e) => setFormats((xs) => xs.map((x, k) => (k === i ? { ...x, height: Number(e.target.value) } : x)))} />
            </Field>
            <Field label="Цена, сум">
              <input type="number" min={0} step={1000} value={f.price} onChange={(e) => setFormats((xs) => xs.map((x, k) => (k === i ? { ...x, price: Number(e.target.value) } : x)))} />
            </Field>
            <RemoveBtn disabled={formats.length === 1} onClick={() => setFormats((xs) => xs.filter((_, k) => k !== i))} />
          </div>
        ))}
      </div>

      <OptionsEditor title="Обложки" hint="Доплата к цене формата" items={p.covers} onChange={(covers) => set({ covers })} />
      <OptionsEditor title="Бумага" hint="Доплата к цене формата" items={p.papers} onChange={(papers) => set({ papers })} />

      <div className="card stack">
        <h3>{p.kind === "cards" ? "Количество открыток" : p.kind === "calendar" ? "Листы" : "Страницы"}</h3>
        <div className="admin-grid-form">
          <Field label="Минимум">
            <input type="number" min={1} value={p.pages.min} onChange={(e) => set({ pages: { ...p.pages, min: Number(e.target.value) } })} />
          </Field>
          <Field label="Максимум">
            <input type="number" min={1} value={p.pages.max} onChange={(e) => set({ pages: { ...p.pages, max: Number(e.target.value) } })} />
          </Field>
          <Field label="Шаг">
            <input type="number" min={1} value={p.pages.step} onChange={(e) => set({ pages: { ...p.pages, step: Number(e.target.value) } })} />
          </Field>
          <Field label="Входит в базовую цену">
            <input type="number" min={0} value={p.pages.included} onChange={(e) => set({ pages: { ...p.pages, included: Number(e.target.value) } })} />
          </Field>
          <Field label="Доплата за каждый шаг, сум">
            <input type="number" min={0} step={1000} value={p.pages.pricePerStep} onChange={(e) => set({ pages: { ...p.pages, pricePerStep: Number(e.target.value) } })} />
          </Field>
        </div>
        <p className="muted small" style={{ margin: 0 }}>
          Если минимум равен максимуму, выбор количества на сайте не показывается. Цена с первыми вариантами и минимумом: <strong>{example}</strong>
        </p>
      </div>

      <SaveBar
        {...saver}
        label={isNew ? "Создать продукт" : "Сохранить"}
        extra={
          !isNew && (
            <button
              type="button"
              className="link-btn small"
              style={{ color: "#b3261e" }}
              onClick={async () => {
                if (!confirm("Удалить продукт? Если по нему есть проекты клиентов, удаление запрещено — тогда скройте его.")) return;
                try {
                  await api(`/api/admin/products/${initial.slug}`, "DELETE");
                  router.push("/admin/products");
                  router.refresh();
                } catch (e) {
                  alert((e as Error).message);
                }
              }}
            >
              Удалить продукт
            </button>
          )
        }
      />
    </form>
  );
}

function RemoveBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={onClick} disabled={disabled} aria-label="Удалить" title={disabled ? "Нужен хотя бы один вариант" : "Удалить"}>
      ✕
    </button>
  );
}

function OptionsEditor({ title, hint, items, onChange }: { title: string; hint: string; items: OptionChoice[]; onChange: (x: OptionChoice[]) => void }) {
  const upd = (i: number, patch: Partial<OptionChoice>) => onChange(items.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (
    <div className="card stack">
      <div className="spread">
        <h3 style={{ margin: 0 }}>{title}</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...items, { id: newId(), label: "Новый вариант", price: 0 }])}>
          + Вариант
        </button>
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        {hint}. Первый вариант выбран по умолчанию. Если вариант один, выбор на сайте не показывается.
      </p>
      {items.map((o, i) => (
        <div key={o.id} className="admin-list-row" style={{ gridTemplateColumns: "2fr 2fr 1.3fr auto" }}>
          <Field label="Название">
            <input value={o.label} onChange={(e) => upd(i, { label: e.target.value })} />
          </Field>
          <Field label="Подсказка">
            <input value={o.hint ?? ""} onChange={(e) => upd(i, { hint: e.target.value })} />
          </Field>
          <Field label="Доплата, сум">
            <input type="number" min={0} step={1000} value={o.price} onChange={(e) => upd(i, { price: Number(e.target.value) })} />
          </Field>
          <RemoveBtn disabled={items.length === 1} onClick={() => onChange(items.filter((_, k) => k !== i))} />
        </div>
      ))}
    </div>
  );
}
