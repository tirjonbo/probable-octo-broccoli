"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type ProjectConfig, type Product, defaultConfig, priceFor, money } from "@/lib/catalog";

export function ConfigFields({
  product,
  config,
  onChange,
}: {
  product: Product;
  config: ProjectConfig;
  onChange: (c: ProjectConfig) => void;
}) {
  const set = (patch: Partial<ProjectConfig>) => onChange({ ...config, ...patch });
  const unit = product.kind === "cards" ? "Количество открыток" : product.kind === "calendar" ? "Листов" : "Страниц";
  return (
    <div className="stack">
      <Group label="Формат">
        {product.formats.map((f) => (
          <button key={f.id} type="button" className="choice" aria-pressed={config.format === f.id} onClick={() => set({ format: f.id })}>
            {f.label}
            <small>{money(f.price)}</small>
          </button>
        ))}
      </Group>
      {product.covers.length > 1 && (
        <Group label="Обложка">
          {product.covers.map((c) => (
            <button key={c.id} type="button" className="choice" aria-pressed={config.cover === c.id} onClick={() => set({ cover: c.id })}>
              {c.label}
              <small>{c.price ? `+ ${money(c.price)}` : "включено"}</small>
            </button>
          ))}
        </Group>
      )}
      {product.papers.length > 1 && (
        <Group label="Бумага">
          {product.papers.map((c) => (
            <button key={c.id} type="button" className="choice" aria-pressed={config.paper === c.id} onClick={() => set({ paper: c.id })}>
              {c.label}
              <small>{c.price ? `+ ${money(c.price)}` : "включено"}</small>
            </button>
          ))}
        </Group>
      )}
      {product.pages.min !== product.pages.max && (
        <Group label={`${unit}: ${config.pages}`}>
          <input
            type="range"
            min={product.pages.min}
            max={product.pages.max}
            step={product.pages.step}
            value={config.pages}
            onChange={(e) => set({ pages: Number(e.target.value) })}
            aria-label={unit}
            style={{ padding: 0, border: 0 }}
          />
          <div className="muted small">
            {product.pages.min}–{product.pages.max}, каждые {product.pages.step} сверх {product.pages.included} — +
            {money(product.pages.pricePerStep)}
          </div>
        </Group>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="muted small" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div className="choices">{children}</div>
    </div>
  );
}

export function Configurator({ product }: { product: Product }) {
  const slug = product.slug;
  const router = useRouter();
  const [config, setConfig] = useState(() => defaultConfig(product));
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: slug, config, title }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Не удалось создать проект");
      setBusy(false);
      return;
    }
    router.push(`/editor/${json.id}`);
  }

  return (
    <div className="card stack" style={{ marginTop: 24 }}>
      <ConfigFields product={product} config={config} onChange={setConfig} />
      <label className="field">
        <span>Название проекта</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, «Лето на Байкале»" maxLength={80} />
      </label>
      <div className="spread" style={{ marginTop: 20 }}>
        <div className="price-big">{money(priceFor(product, config))}</div>
        <button className="btn" onClick={start} disabled={busy}>
          {busy ? "Создаём…" : "Перейти в редактор"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
