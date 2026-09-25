"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container section center">
      <h1>Что-то пошло не так</h1>
      <p className="muted">Мы уже знаем об ошибке. Попробуйте обновить страницу.</p>
      <div className="row" style={{ justifyContent: "center" }}>
        <button className="btn" onClick={reset}>Обновить</button>
        <Link href="/" className="btn btn-ghost">На главную</Link>
      </div>
    </div>
  );
}
