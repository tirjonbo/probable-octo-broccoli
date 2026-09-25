"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json()).error);
      setBusy(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  const f = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <form className="card stack" onSubmit={submit}>
      <h1 style={{ fontSize: "2rem" }}>{mode === "login" ? "Вход" : "Регистрация"}</h1>
      <p className="muted small">
        {mode === "login"
          ? "Проекты, которые вы начали без входа, перенесутся в аккаунт."
          : "Аккаунт нужен, чтобы открывать проекты с любого устройства и видеть историю заказов."}
      </p>
      {mode === "register" && (
        <label className="field">
          <span>Имя</span>
          <input required autoComplete="name" {...f("name")} />
        </label>
      )}
      <label className="field">
        <span>E-mail</span>
        <input required type="email" autoComplete="email" {...f("email")} />
      </label>
      <label className="field">
        <span>Пароль</span>
        <input
          required
          type="password"
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          {...f("password")}
        />
      </label>
      {mode === "login" && (
        <p className="small muted" style={{ margin: 0 }}>
          Забыли пароль? Напишите в <Link href="/contacts">поддержку</Link> — поможем восстановить доступ.
        </p>
      )}
      {error && <p className="error">{error}</p>}
      <button className="btn btn-block" disabled={busy}>
        {mode === "login" ? "Войти" : "Зарегистрироваться"}
      </button>
      <p className="center small">
        {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
        <button type="button" className="link-btn" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Зарегистрироваться" : "Войти"}
        </button>
      </p>
    </form>
  );
}
