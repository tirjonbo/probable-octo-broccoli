// Настройки сайта, редактируемые в админке. Модуль чистый — типы и значения по умолчанию.

export type FaqItem = { q: string; a: string };

export type Settings = {
  site: {
    name: string;
    tagline: string;
    phone: string;
    telegram: string;
    instagram: string;
    email: string;
    address: string;
    hours: string;
    company: string;
  };
  delivery: { city: string; price: number; days: string };
  certificates: { nominals: number[]; validity: string };
  home: { badge: string; heroTitle: string; heroText: string; buttonLabel: string; buttonLink: string };
  seo: { title: string; description: string };
  faq: FaqItem[];
  legal: { offer: string; privacy: string };
};

export const DEFAULT_SETTINGS: Settings = {
  site: {
    name: "Страницы",
    tagline: "Фотокниги с доставкой по Ташкенту",
    phone: "+998 00 000 00 00",
    telegram: "",
    instagram: "",
    email: "",
    address: "г. Ташкент",
    hours: "Ежедневно с 9:00 до 20:00",
    company: "",
  },
  delivery: { city: "Ташкент", price: 50_000, days: "1–2 дня после изготовления" },
  certificates: { nominals: [200_000, 300_000, 500_000, 1_000_000], validity: "1 год" },
  home: {
    badge: "Печать от 3 дней",
    heroTitle: "Ваши фотографии заслуживают страниц, а не папки на телефоне",
    heroText:
      "Загрузите снимки, выберите оформление — редактор сам разложит их по страницам. Останется поправить детали и оформить заказ.",
    buttonLabel: "Создать фотокнигу",
    buttonLink: "/catalog/photobook",
  },
  seo: {
    title: "Страницы — фотокниги, журналы и календари в Ташкенте",
    description:
      "Соберите фотокнигу онлайн за вечер: загрузите фото, выберите оформление и получите печатную книгу с доставкой по Ташкенту.",
  },
  faq: [
    {
      q: "Сколько времени занимает изготовление?",
      a: "Фотокниги — 5–7 рабочих дней, журналы и календари — 3–5, открытки — 2–4. Доставка по Ташкенту — ещё 1–2 дня.",
    },
    {
      q: "Нужно ли сразу собрать всю книгу?",
      a: "Нет. Проект сохраняется автоматически. Зарегистрируйтесь, чтобы открыть его позже с любого устройства.",
    },
    {
      q: "Какие фотографии подходят для печати?",
      a: "JPEG, PNG или WebP до 15 МБ. Для фото на всю страницу 30×30 см желательно не меньше 2400 пикселей по короткой стороне.",
    },
    {
      q: "Как оплатить заказ?",
      a: "Наличными курьеру при получении. Онлайн-оплата через Payme и Click появится позже.",
    },
    { q: "Куда вы доставляете?", a: "Пока только по Ташкенту, курьером." },
    {
      q: "Можно ли изменить заказ после оформления?",
      a: "Да, пока заказ не передан в печать. Напишите или позвоните нам — поправим.",
    },
    {
      q: "Как работает подарочный сертификат?",
      a: "После оплаты код появляется на странице заказа. Им можно оплатить заказ полностью или частично, остаток сохраняется.",
    },
    {
      q: "Что делать, если книга пришла с браком?",
      a: "Сфотографируйте дефект и напишите нам в течение 14 дней. Перепечатаем бесплатно.",
    },
  ],
  legal: {
    offer:
      "Черновик. Полный текст оферты будет опубликован до начала приёма заказов.\n\n1. Предмет\nИсполнитель изготавливает фотопродукцию по макету, который покупатель собирает на сайте, и доставляет её по Ташкенту.\n\n2. Оформление и оплата\nЗаказ считается принятым после подтверждения менеджером по телефону. Оплата — наличными курьеру при получении.\n\n3. Изготовление и доставка\nСроки указаны на странице «Доставка и оплата».\n\n4. Возврат и брак\nТовар изготовлен по индивидуальному заказу. При браке печати изделие перепечатывается бесплатно.",
    privacy:
      "Черновик. Полный текст будет опубликован до начала приёма заказов.\n\nМы собираем имя, телефон, адрес доставки и загруженные фотографии только для изготовления и доставки заказа. Фотографии доступны лишь вам и сотрудникам производства и не передаются третьим лицам.",
  },
};

/** Накладывает сохранённые значения на значения по умолчанию (новые поля получают дефолт). */
export function mergeSettings(saved: Partial<Record<keyof Settings, unknown>>): Settings {
  const out = structuredClone(DEFAULT_SETTINGS) as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const v = saved[key];
    if (v === undefined || v === null) continue;
    const def = DEFAULT_SETTINGS[key];
    if (Array.isArray(def)) out[key] = Array.isArray(v) ? v : def;
    else if (typeof v === "object" && !Array.isArray(v)) out[key] = { ...(def as object), ...(v as object) };
  }
  return out as Settings;
}

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Проверяет присланные из админки настройки. */
export function validateSettings(x: Record<string, Record<string, unknown>>): Settings {
  const d = DEFAULT_SETTINGS;
  const s = x.site ?? {};
  const nominals = (Array.isArray(x.certificates?.nominals) ? x.certificates.nominals : [])
    .map(num)
    .filter((n: number) => n > 0)
    .sort((a: number, b: number) => a - b);
  const faq = (Array.isArray(x.faq) ? (x.faq as unknown as FaqItem[]) : [])
    .map((f) => ({ q: str(f?.q, 300), a: str(f?.a, 3000) }))
    .filter((f) => f.q && f.a);
  const result: Settings = {
    site: {
      name: str(s.name, 60) || d.site.name,
      tagline: str(s.tagline, 160),
      phone: str(s.phone, 40),
      telegram: str(s.telegram, 60).replace(/^@|^https?:\/\/t\.me\//, ""),
      instagram: str(s.instagram, 60).replace(/^@|^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, ""),
      email: str(s.email, 120),
      address: str(s.address, 300),
      hours: str(s.hours, 120),
      company: str(s.company, 300),
    },
    delivery: {
      city: str(x.delivery?.city, 60) || d.delivery.city,
      price: num(x.delivery?.price),
      days: str(x.delivery?.days, 120),
    },
    certificates: { nominals: nominals.length ? nominals : d.certificates.nominals, validity: str(x.certificates?.validity, 60) },
    home: {
      badge: str(x.home?.badge, 60),
      heroTitle: str(x.home?.heroTitle, 200) || d.home.heroTitle,
      heroText: str(x.home?.heroText, 600),
      buttonLabel: str(x.home?.buttonLabel, 60),
      buttonLink: str(x.home?.buttonLink, 200),
    },
    seo: { title: str(x.seo?.title, 160) || d.seo.title, description: str(x.seo?.description, 400) },
    faq,
    legal: { offer: str(x.legal?.offer, 50_000), privacy: str(x.legal?.privacy, 50_000) },
  };
  return result;
}

/** Ссылки только относительные или http(s) — защита от javascript: в баннерах и кнопках. */
export function safeLink(href: string): string {
  const h = href.trim();
  if (h.startsWith("/") && !h.startsWith("//")) return h;
  if (/^https?:\/\//i.test(h)) return h;
  return "/";
}
