import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container section center">
      <h1>Страница не найдена</h1>
      <p className="muted">Возможно, ссылка устарела или проект был удалён.</p>
      <Link href="/" className="btn">
        На главную
      </Link>
    </div>
  );
}
