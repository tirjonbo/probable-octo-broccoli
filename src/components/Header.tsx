"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/catalog", label: "Каталог" },
  { href: "/certificates", label: "Сертификаты" },
  { href: "/delivery", label: "Доставка и оплата" },
  { href: "/faq", label: "Вопросы" },
  { href: "/contacts", label: "Контакты" },
];

export function Header({ cartCount, signedIn, isAdmin }: { cartCount: number; signedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  if (pathname.startsWith("/editor/")) return null;
  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          Стр<b>а</b>ницы
        </Link>
        <nav className={`nav ${open ? "open" : ""}`}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} style={pathname.startsWith(l.href) ? { color: "var(--ink)" } : undefined}>
              {l.label}
            </Link>
          ))}
          {isAdmin && <Link href="/admin">Админка</Link>}
        </nav>
        <div className="header-actions">
          <Link href={signedIn ? "/account" : "/login"} className="btn btn-ghost btn-sm">
            {signedIn ? "Кабинет" : "Войти"}
          </Link>
          <Link href="/cart" className="btn btn-sm cart-link" aria-label="Корзина">
            Корзина
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
          <button className="burger" aria-label="Меню" onClick={() => setOpen((v) => !v)}>
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
