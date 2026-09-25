"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS = [
  { href: "/admin", label: "Сводка", exact: true },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/clients", label: "Клиенты" },
  { href: "/admin/products", label: "Продукты и цены" },
  { href: "/admin/banners", label: "Баннеры" },
  { href: "/admin/promos", label: "Промокоды" },
  { href: "/admin/certificates", label: "Сертификаты" },
  { href: "/admin/reviews", label: "Отзывы" },
  { href: "/admin/settings", label: "Настройки сайта" },
];

export function AdminNav({ newOrders, siteName }: { newOrders: number; siteName: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <aside className={`admin-nav ${open ? "open" : ""}`}>
      <div className="spread">
        <Link href="/admin" className="logo" style={{ fontSize: "1.2rem" }}>
          {siteName} · админка
        </Link>
        <button className="burger admin-burger" aria-label="Меню" onClick={() => setOpen((v) => !v)}>
          ☰
        </button>
      </div>
      <nav>
        {ITEMS.map((i) => {
          const active = i.exact ? path === i.href : path.startsWith(i.href);
          return (
            <Link key={i.href} href={i.href} className={active ? "active" : ""}>
              {i.label}
              {i.href === "/admin/orders" && newOrders > 0 && <span className="badge-inline">{newOrders}</span>}
            </Link>
          );
        })}
        <hr />
        <Link href="/" target="_blank">
          Открыть сайт ↗
        </Link>
        <Link href="/account/password">Сменить пароль</Link>
        <a href="/api/admin/backup">Скачать резервную копию</a>
      </nav>
    </aside>
  );
}
