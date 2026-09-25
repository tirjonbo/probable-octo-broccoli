"use client";
import { useState } from "react";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="card stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await fetch("/api/auth/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current, next }),
        });
        const json = await res.json().catch(() => ({}));
        setMsg(res.ok ? { ok: true, text: "Пароль изменён. На других устройствах нужно будет войти заново." } : { ok: false, text: json.error ?? "Ошибка" });
        if (res.ok) {
          setCurrent("");
          setNext("");
        }
        setBusy(false);
      }}
    >
      <h3>Смена пароля</h3>
      <label className="field">
        <span>Текущий пароль</span>
        <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label className="field">
        <span>Новый пароль</span>
        <input type="password" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </label>
      {msg && <p className={msg.ok ? "small" : "error"} style={msg.ok ? { color: "var(--ok)" } : undefined}>{msg.text}</p>}
      <button className="btn" disabled={busy}>Сменить пароль</button>
    </form>
  );
}
