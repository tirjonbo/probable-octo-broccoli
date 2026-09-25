import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/content-store";
import { siteUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/catalog", "/certificates", "/delivery", "/faq", "/contacts", "/offer", "/privacy"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...listProducts(true).map((p) => ({ url: `${base}/catalog/${p.slug}` })),
  ];
}
