import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/editor", "/account", "/cart", "/checkout", "/orders"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
