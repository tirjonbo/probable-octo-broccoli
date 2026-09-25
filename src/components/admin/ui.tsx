"use client";
import { useRef, useState } from "react";
import { uploadMedia } from "./api";

/** Состояние сохранения формы: кнопка, «Сохранено», текст ошибки. */
export function useSaver() {
  const [state, setState] = useState<{ busy: boolean; error: string; saved: boolean }>({ busy: false, error: "", saved: false });
  async function run(fn: () => Promise<unknown>) {
    setState({ busy: true, error: "", saved: false });
    try {
      await fn();
      setState({ busy: false, error: "", saved: true });
      setTimeout(() => setState((s) => ({ ...s, saved: false })), 2500);
      return true;
    } catch (e) {
      setState({ busy: false, error: (e as Error).message, saved: false });
      return false;
    }
  }
  return { ...state, run };
}

export function SaveBar({ busy, error, saved, label = "Сохранить", extra }: { busy: boolean; error: string; saved: boolean; label?: string; extra?: React.ReactNode }) {
  return (
    <div className="admin-savebar">
      <button className="btn" disabled={busy}>
        {busy ? "Сохраняем…" : label}
      </button>
      {saved && <span style={{ color: "var(--ok)" }}>Сохранено</span>}
      {error && <span className="error">{error}</span>}
      <div style={{ flex: 1 }} />
      {extra}
    </div>
  );
}

export function ImageField({ value, onChange, label = "Картинка" }: { value: string | null; onChange: (id: string | null) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="field">
      <span className="muted small">{label}</span>
      <div className="row" style={{ marginTop: 4 }}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/media/${value}`} alt="" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
        ) : (
          <div className="admin-noimage">нет</div>
        )}
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Загружаем…" : value ? "Заменить" : "Загрузить"}
        </button>
        {value && (
          <button type="button" className="link-btn small" onClick={() => onChange(null)}>
            Убрать
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setError("");
            try {
              onChange(await uploadMedia(f));
            } catch (err) {
              setError((err as Error).message);
            }
            setBusy(false);
          }}
        />
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="admin-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
