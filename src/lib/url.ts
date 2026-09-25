/** Публичный адрес сайта для sitemap и robots. Задаётся переменной SITE_URL. */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
