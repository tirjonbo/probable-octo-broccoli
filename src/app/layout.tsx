import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getUser } from "@/lib/auth";
import { getSettings } from "@/lib/content-store";
import { cartCount } from "@/lib/shop";

export function generateMetadata(): Metadata {
  const { seo, site } = getSettings();
  return {
    title: { default: seo.title, template: `%s · ${site.name}` },
    description: seo.description,
    openGraph: { title: seo.title, description: seo.description, siteName: site.name, locale: "ru_RU", type: "website" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const count = user ? cartCount(user.id) : 0;
  return (
    <html lang="ru">
      <body>
        <Header siteName={getSettings().site.name} cartCount={count} signedIn={!!user?.email} isAdmin={user?.role === "admin"} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
