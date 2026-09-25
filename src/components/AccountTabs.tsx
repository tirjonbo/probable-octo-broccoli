"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function AccountTabs() {
  const path = usePathname();
  const router = useRouter();
  return (
    <div className="tabs spread">
      <div className="row" style={{ gap: 4 }}>
        <Link href="/account" className={path === "/account" ? "active" : ""}>
          Заказы
        </Link>
        <Link href="/account/projects" className={path === "/account/projects" ? "active" : ""}>
          Проекты
        </Link>
      </div>
      <button
        className="link-btn small"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        }}
      >
        Выйти
      </button>
    </div>
  );
}
