"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./api";
import { Field, useSaver } from "./ui";

type C = { id: string; name: string; phone: string; email: string | null; role: string };

export function ClientEditor({ client, isSelf }: { client: C; isSelf: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [password, setPassword] = useState("");
  const info = useSaver();
  const pw = useSaver();
  const role = useSaver();
  const patch = (b: object) => api(`/api/admin/users/${client.id}`, "PATCH", b);

  return (
    <div className="stack">
      <form
        className="card stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await info.run(() => patch({ name, phone }))) router.refresh();
        }}
      >
        <h3>Данные</h3>
        <Field label="Имя">
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Телефон">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
        </Field>
        {client.email && <div className="small muted">E-mail для входа: {client.email}</div>}
        <div className="row">
          <button className="btn btn-sm" disabled={info.busy}>Сохранить</button>
          {info.saved && <span style={{ color: "var(--ok)" }}>Сохранено</span>}
          {info.error && <span className="error">{info.error}</span>}
        </div>
      </form>

      {client.email && (
        <>
          <form
            className="card stack"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await pw.run(() => patch({ password }))) setPassword("");
            }}
          >
            <h3>Новый пароль</h3>
            <p className="muted small" style={{ margin: 0 }}>
              Если клиент забыл пароль: задайте новый и сообщите ему. Клиент выйдет со всех устройств.
            </p>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} placeholder="минимум 8 символов" aria-label="Новый пароль" />
            <div className="row">
              <button className="btn btn-sm btn-ghost" disabled={pw.busy || password.length < 8}>Задать пароль</button>
              {pw.saved && <span style={{ color: "var(--ok)" }}>Пароль изменён</span>}
              {pw.error && <span className="error">{pw.error}</span>}
            </div>
          </form>

          <div className="card stack">
            <h3>Доступ</h3>
            <p className="small" style={{ margin: 0 }}>
              {client.role === "admin" ? "Администратор — видит всю админку." : "Покупатель."}
            </p>
            {!isSelf && (
              <button
                className="btn btn-sm btn-ghost"
                disabled={role.busy}
                onClick={async () => {
                  const next = client.role === "admin" ? "customer" : "admin";
                  if (!confirm(next === "admin" ? "Выдать права администратора?" : "Снять права администратора?")) return;
                  if (await role.run(() => patch({ role: next }))) router.refresh();
                }}
              >
                {client.role === "admin" ? "Снять права администратора" : "Сделать администратором"}
              </button>
            )}
            {role.error && <span className="error">{role.error}</span>}
          </div>
        </>
      )}
    </div>
  );
}
