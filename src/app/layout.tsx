import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getUser } from "@/lib/auth";
import { cartCount } from "@/lib/shop";

export const metadata: Metadata = {
  title: { default: "Страницы — фотокниги, журналы и календари", template: "%s · Страницы" },
  description: "Соберите фотокнигу онлайн за вечер: загрузите фото, выберите оформление и получите печатную книгу с доставкой по Ташкенту.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const count = user ? cartCount(user.id) : 0;
  return (
    <html lang="ru">
      <body>
        <Header cartCount={count} signedIn={!!user?.email} isAdmin={user?.role === "admin"} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
