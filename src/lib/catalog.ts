// Каталог продуктов и расчёт цен. Модуль чистый — используется и на сервере, и в браузере.

export type OptionChoice = { id: string; label: string; price: number; hint?: string };

export type Format = {
  id: string;
  label: string;
  /** Соотношение сторон страницы (ширина / высота) — используется редактором. */
  aspect: number;
  price: number;
  /** Размер в сантиметрах — для админки; aspect считается из них. */
  width?: number;
  height?: number;
};

export type ProductKind = "book" | "calendar" | "cards";

export const PRODUCT_KINDS: Record<ProductKind, string> = {
  book: "Книга / журнал (развороты)",
  calendar: "Календарь (листы)",
  cards: "Открытки (карточки)",
};

export type Product = {
  slug: string;
  /** id картинки из медиатеки или null — тогда рисуется иллюстрация. */
  image: string | null;
  active: boolean;
  sort: number;
  title: string;
  short: string;
  description: string;
  color: string;
  kind: ProductKind;
  formats: Format[];
  covers: OptionChoice[];
  papers: OptionChoice[];
  pages: { min: number; max: number; step: number; included: number; pricePerStep: number };
  features: string[];
  productionDays: string;
};

type SeedProduct = Omit<Product, "image" | "active" | "sort">;

const SEED: SeedProduct[] = [
  {
    slug: "photobook",
    title: "Фотокнига",
    short: "Классическая книга с раскладкой на разворот",
    description:
      "Твёрдая обложка, плотные страницы, которые раскрываются на 180°. Подходит для семейного архива, путешествий и первого года малыша.",
    color: "#d9c7b0",
    kind: "book",
    formats: [
      { id: "20x20", label: "20 × 20 см", aspect: 1, price: 290_000 },
      { id: "30x30", label: "30 × 30 см", aspect: 1, price: 490_000 },
      { id: "30x21", label: "30 × 21 см, альбомная", aspect: 30 / 21, price: 390_000 },
      { id: "21x30", label: "21 × 30 см, книжная", aspect: 21 / 30, price: 390_000 },
    ],
    covers: [
      { id: "hard", label: "Твёрдая печатная", price: 0 },
      { id: "linen", label: "Лён с тиснением", price: 100_000, hint: "Ткань на выбор из 6 цветов" },
      { id: "leather", label: "Экокожа", price: 160_000 },
    ],
    papers: [
      { id: "matte", label: "Матовая 250 г", price: 0 },
      { id: "silk", label: "Шёлковая 300 г", price: 70_000 },
      { id: "layflat", label: "Layflat (без разрыва на сгибе)", price: 170_000 },
    ],
    pages: { min: 20, max: 100, step: 10, included: 20, pricePerStep: 45_000 },
    features: ["Раскрытие на 180°", "Цифровая печать", "Готово за 5–7 дней"],
    productionDays: "5–7 рабочих дней",
  },
  {
    slug: "magazine",
    title: "Фотожурнал",
    short: "Лёгкий журнал в мягкой обложке",
    description:
      "Тонкий и лёгкий формат: удобно заказывать сериями — по одному журналу на каждый сезон или поездку.",
    color: "#c7d3cc",
    kind: "book",
    formats: [
      { id: "21x28", label: "21 × 28 см", aspect: 21 / 28, price: 150_000 },
      { id: "15x20", label: "15 × 20 см", aspect: 15 / 20, price: 115_000 },
    ],
    covers: [
      { id: "soft", label: "Мягкая матовая", price: 0 },
      { id: "softlam", label: "Мягкая с софт-тач ламинацией", price: 30_000 },
    ],
    papers: [
      { id: "matte", label: "Матовая 170 г", price: 0 },
      { id: "gloss", label: "Глянцевая 170 г", price: 0 },
    ],
    pages: { min: 24, max: 60, step: 4, included: 24, pricePerStep: 15_000 },
    features: ["Скоба или клей", "Лёгкий и тонкий", "Удобно сериями"],
    productionDays: "3–5 рабочих дней",
  },
  {
    slug: "calendar",
    title: "Настенный календарь",
    short: "12 месяцев с вашими фотографиями",
    description:
      "Перекидной календарь на пружине: обложка и 12 месяцев. Можно отметить дни рождения и важные даты.",
    color: "#e3cfc6",
    kind: "calendar",
    formats: [
      { id: "a4", label: "A4 вертикальный", aspect: 21 / 29.7, price: 170_000 },
      { id: "a3", label: "A3 вертикальный", aspect: 29.7 / 42, price: 260_000 },
    ],
    covers: [{ id: "spiral", label: "Металлическая пружина", price: 0 }],
    papers: [
      { id: "matte", label: "Матовая 250 г", price: 0 },
      { id: "silk", label: "Шёлковая 300 г", price: 35_000 },
    ],
    pages: { min: 13, max: 13, step: 1, included: 13, pricePerStep: 0 },
    features: ["Любой месяц старта", "Свои праздники", "Пружина и подвес"],
    productionDays: "3–5 рабочих дней",
  },
  {
    slug: "cards",
    title: "Набор открыток",
    short: "Открытки и карточки с фото",
    description:
      "Плотные карточки с закруглёнными углами — для приглашений, благодарностей и коллекции любимых кадров.",
    color: "#d6d0e3",
    kind: "cards",
    formats: [
      { id: "10x15", label: "10 × 15 см", aspect: 10 / 15, price: 70_000 },
      { id: "15x15", label: "15 × 15 см", aspect: 1, price: 90_000 },
    ],
    covers: [{ id: "envelope", label: "Крафт-конверт", price: 0 }],
    papers: [
      { id: "matte", label: "Матовый картон 350 г", price: 0 },
      { id: "cotton", label: "Хлопковая бумага", price: 45_000 },
    ],
    pages: { min: 10, max: 50, step: 10, included: 10, pricePerStep: 40_000 },
    features: ["Двусторонняя печать", "Закруглённые углы", "Конверт в комплекте"],
    productionDays: "2–4 рабочих дня",
  },
];

/** Стартовый каталог — записывается в базу при первом запуске, дальше редактируется в админке. */
export const DEFAULT_PRODUCTS: Product[] = SEED.map((p, i) => ({ ...p, image: null, active: true, sort: i }));

/** Способы оплаты. Онлайн-оплата — заглушка до подключения Payme/Click. */
export const PAYMENT_METHODS = [
  { id: "cash", label: "Наличными курьеру", hint: "Оплата при получении", available: true },
  { id: "payme", label: "Payme", hint: "Скоро", available: false },
  { id: "click", label: "Click", hint: "Скоро", available: false },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export type ProjectConfig = { format: string; cover: string; paper: string; pages: number };

export function defaultConfig(p: Product): ProjectConfig {
  return { format: p.formats[0].id, cover: p.covers[0].id, paper: p.papers[0].id, pages: p.pages.min };
}

/** Проверяет и нормализует конфигурацию; кидает ошибку на неизвестные значения. */
export function normalizeConfig(p: Product, c: Partial<ProjectConfig>): ProjectConfig {
  const d = defaultConfig(p);
  const format = c.format ?? d.format;
  const cover = c.cover ?? d.cover;
  const paper = c.paper ?? d.paper;
  if (!p.formats.some((f) => f.id === format)) throw new Error("Неизвестный формат");
  if (!p.covers.some((f) => f.id === cover)) throw new Error("Неизвестная обложка");
  if (!p.papers.some((f) => f.id === paper)) throw new Error("Неизвестная бумага");
  let pages = Math.round(Number(c.pages ?? d.pages));
  if (!Number.isFinite(pages)) pages = d.pages;
  pages = Math.min(p.pages.max, Math.max(p.pages.min, pages));
  pages = p.pages.min + Math.round((pages - p.pages.min) / p.pages.step) * p.pages.step;
  return { format, cover, paper, pages };
}

export function priceFor(p: Product, c: ProjectConfig): number {
  const format = p.formats.find((f) => f.id === c.format)!;
  const cover = p.covers.find((f) => f.id === c.cover)!;
  const paper = p.papers.find((f) => f.id === c.paper)!;
  const extraSteps = Math.max(0, Math.ceil((c.pages - p.pages.included) / p.pages.step));
  return format.price + cover.price + paper.price + extraSteps * p.pages.pricePerStep;
}

export function describeConfig(p: Product, c: ProjectConfig): string {
  const format = p.formats.find((f) => f.id === c.format)?.label;
  const cover = p.covers.find((f) => f.id === c.cover)?.label;
  const paper = p.papers.find((f) => f.id === c.paper)?.label;
  const unit = p.kind === "cards" ? "шт." : p.kind === "calendar" ? "листов" : "стр.";
  return [format, cover, paper, `${c.pages} ${unit}`].filter(Boolean).join(" · ");
}

export function minPrice(p: Product): number {
  return Math.min(...p.formats.map((f) => f.price));
}

export function money(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n).replace(/\u00a0/g, " ") + " сум";
}

/** Дата и время в часовом поясе Ташкента. SQLite хранит UTC без суффикса. */
export function formatDate(sqlUtc: string, withTime = true): string {
  const d = new Date(sqlUtc.includes("T") ? sqlUtc : sqlUtc.replace(" ", "T") + "Z");
  return d.toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Приводит узбекский номер к виду +998 XX XXX XX XX; null — если номер некорректный. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 9) d = "998" + d;
  if (d.length !== 12 || !d.startsWith("998")) return null;
  return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
}

export const ORDER_STATUSES = {
  new: "Новый",
  confirmed: "Подтверждён",
  printing: "В печати",
  shipped: "У курьера",
  delivered: "Доставлен",
  cancelled: "Отменён",
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

/** Пересчёт суммы заказа после правок менеджера. */
export function recalcTotals(
  items: { price: number; qty: number }[],
  o: { discount: number; delivery_price: number; certificate_used: number },
): { subtotal: number; total: number } {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return { subtotal, total: Math.max(0, subtotal - o.discount + o.delivery_price - o.certificate_used) };
}

// ---------- Проверка продукта из админки ----------

const int = (v: unknown, name: string, min = 0) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < min) throw new Error(`${name}: укажите число не меньше ${min}`);
  return n;
};
const text = (v: unknown, name: string, max = 300, required = true) => {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  if (required && !s) throw new Error(`Заполните поле «${name}»`);
  return s;
};

function options(v: unknown, name: string): OptionChoice[] {
  if (!Array.isArray(v) || v.length === 0) throw new Error(`${name}: нужен хотя бы один вариант`);
  const ids = new Set<string>();
  return v.map((o: Record<string, unknown>, i) => {
    const id = text(o?.id, `${name} №${i + 1}: id`, 40);
    if (ids.has(id)) throw new Error(`${name}: повторяется id «${id}»`);
    ids.add(id);
    const hint = text(o?.hint, "Подсказка", 120, false);
    return { id, label: text(o?.label, `${name} №${i + 1}: название`, 120), price: int(o?.price, `${name}: цена`), ...(hint ? { hint } : {}) };
  });
}

/** Приводит присланный из админки продукт к корректному виду или кидает ошибку с понятным текстом. */
export function validateProduct(x: Record<string, unknown>): Product {
  const slug = text(x.slug, "Адрес (slug)", 60);
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Адрес (slug): только латиница в нижнем регистре, цифры и дефис");
  const kind = x.kind as ProductKind;
  if (!(kind in PRODUCT_KINDS)) throw new Error("Выберите тип продукта");
  const formatsRaw = x.formats;
  if (!Array.isArray(formatsRaw) || formatsRaw.length === 0) throw new Error("Форматы: нужен хотя бы один");
  const fids = new Set<string>();
  const formats: Format[] = formatsRaw.map((f: Record<string, unknown>, i) => {
    const id = text(f?.id, `Формат №${i + 1}: id`, 40);
    if (fids.has(id)) throw new Error(`Форматы: повторяется id «${id}»`);
    fids.add(id);
    const width = Number(f?.width);
    const height = Number(f?.height);
    const sized = width > 0 && height > 0;
    const aspect = sized ? width / height : Number(f?.aspect);
    if (!(aspect > 0.2 && aspect < 5)) throw new Error(`Формат «${id}»: некорректные размеры`);
    return {
      id,
      label: text(f?.label, `Формат №${i + 1}: название`, 120),
      aspect,
      price: int(f?.price, "Формат: цена"),
      ...(sized ? { width, height } : {}),
    };
  });
  const pg = (x.pages ?? {}) as Record<string, unknown>;
  const pages = {
    min: int(pg.min, "Страниц минимум", 1),
    max: int(pg.max, "Страниц максимум", 1),
    step: int(pg.step, "Шаг страниц", 1),
    included: int(pg.included, "Страниц в базовой цене", 0),
    pricePerStep: int(pg.pricePerStep, "Цена за шаг", 0),
  };
  if (pages.max < pages.min) throw new Error("Страниц максимум должно быть не меньше минимума");
  if (pages.max > 400) throw new Error("Страниц максимум — не больше 400");
  const color = text(x.color, "Цвет", 20);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("Цвет в формате #RRGGBB");
  return {
    slug,
    image: typeof x.image === "string" && x.image ? x.image : null,
    active: x.active !== false,
    sort: Math.round(Number(x.sort)) || 0,
    title: text(x.title, "Название", 80),
    short: text(x.short, "Короткое описание", 160, false),
    description: text(x.description, "Описание", 2000, false),
    color,
    kind,
    formats,
    covers: options(x.covers, "Обложки"),
    papers: options(x.papers, "Бумага"),
    pages,
    features: Array.isArray(x.features)
      ? x.features.map((f) => text(f, "Преимущество", 80, false)).filter(Boolean).slice(0, 6)
      : [],
    productionDays: text(x.productionDays, "Срок изготовления", 60, false),
  };
}
