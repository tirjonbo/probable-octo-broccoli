// Структура проекта, которую редактирует пользователь. Хранится в БД как JSON.

export type LayoutId = "full" | "two-v" | "two-h" | "three" | "four" | "text";

/** Слоты макета в долях страницы: [x, y, w, h]. */
export const LAYOUTS: Record<LayoutId, { label: string; slots: [number, number, number, number][] }> = {
  full: { label: "1 фото", slots: [[0.06, 0.06, 0.88, 0.88]] },
  "two-v": {
    label: "2 рядом",
    slots: [
      [0.06, 0.06, 0.42, 0.88],
      [0.52, 0.06, 0.42, 0.88],
    ],
  },
  "two-h": {
    label: "2 друг под другом",
    slots: [
      [0.06, 0.06, 0.88, 0.42],
      [0.06, 0.52, 0.88, 0.42],
    ],
  },
  three: {
    label: "3 фото",
    slots: [
      [0.06, 0.06, 0.88, 0.5],
      [0.06, 0.6, 0.42, 0.34],
      [0.52, 0.6, 0.42, 0.34],
    ],
  },
  four: {
    label: "4 фото",
    slots: [
      [0.06, 0.06, 0.42, 0.42],
      [0.52, 0.06, 0.42, 0.42],
      [0.06, 0.52, 0.42, 0.42],
      [0.52, 0.52, 0.42, 0.42],
    ],
  },
  text: { label: "Только текст", slots: [] },
};

export type Page = { layout: LayoutId; photos: (string | null)[]; caption: string };

export type Theme = { id: string; label: string; background: string; ink: string; font: string };

export const THEMES: Theme[] = [
  { id: "paper", label: "Бумага", background: "#faf7f2", ink: "#2b2622", font: "Georgia, serif" },
  { id: "white", label: "Белый", background: "#ffffff", ink: "#1b1b1b", font: "system-ui, sans-serif" },
  { id: "night", label: "Ночь", background: "#1f2226", ink: "#f1ede6", font: "system-ui, sans-serif" },
  { id: "sage", label: "Шалфей", background: "#e6ebe3", ink: "#27332a", font: "Georgia, serif" },
  { id: "blush", label: "Пудра", background: "#f4e6e1", ink: "#3b2723", font: "Georgia, serif" },
];

export type ProjectData = {
  theme: string;
  cover: { photo: string | null; title: string; subtitle: string };
  pages: Page[];
  /** id загруженных фото в порядке добавления. */
  library: string[];
};

export function emptyPage(layout: LayoutId = "full"): Page {
  return { layout, photos: LAYOUTS[layout].slots.map(() => null), caption: "" };
}

export function emptyProject(pageCount: number, title = "Наша история"): ProjectData {
  return {
    theme: THEMES[0].id,
    cover: { photo: null, title, subtitle: new Date().getFullYear().toString() },
    pages: Array.from({ length: pageCount }, () => emptyPage()),
    library: [],
  };
}

/** Приводит количество страниц к нужному, сохраняя уже заполненные. */
export function resizePages(data: ProjectData, pageCount: number): ProjectData {
  const pages = data.pages.slice(0, pageCount);
  while (pages.length < pageCount) pages.push(emptyPage());
  return { ...data, pages };
}

export function setLayout(page: Page, layout: LayoutId): Page {
  const n = LAYOUTS[layout].slots.length;
  const kept = page.photos.filter(Boolean) as string[];
  return { ...page, layout, photos: Array.from({ length: n }, (_, i) => kept[i] ?? null) };
}

/**
 * Раскладывает фото из библиотеки по страницам: обложка получает первое фото,
 * остальные распределяются равномерно с чередованием макетов.
 */
export function autofill(data: ProjectData): ProjectData {
  const photos = [...data.library];
  if (photos.length === 0) return data;
  const cover = { ...data.cover, photo: data.cover.photo ?? photos[0] };
  const pageCount = data.pages.length;
  const usable = Math.min(photos.length, pageCount * 4);
  const rotation: Record<number, LayoutId[]> = {
    1: ["full"],
    2: ["two-v", "two-h"],
    3: ["three"],
    4: ["four"],
  };
  let cursor = 0;
  const pages = data.pages.map((page, i) => {
    // Равномерно: странице i достаётся ceil((i+1)·N/P) − ceil(i·N/P) фото — первая страница никогда не пустая.
    const count = Math.ceil(((i + 1) * usable) / pageCount) - Math.ceil((i * usable) / pageCount);
    if (count === 0) return { ...emptyPage(page.caption ? "text" : "full"), caption: page.caption };
    const options = rotation[count];
    const layout = options[i % options.length];
    const slice = photos.slice(cursor, cursor + count);
    cursor += count;
    return { layout, photos: slice, caption: page.caption };
  });
  return { ...data, cover, pages };
}

export function filledSlots(data: ProjectData): { filled: number; total: number } {
  let filled = 0;
  let total = 0;
  for (const p of data.pages) {
    total += p.photos.length;
    filled += p.photos.filter(Boolean).length;
  }
  return { filled, total };
}

/** Проверяет, что пришедший с клиента JSON похож на ProjectData. */
export function isProjectData(x: unknown): x is ProjectData {
  if (!x || typeof x !== "object") return false;
  const d = x as ProjectData;
  return (
    typeof d.theme === "string" &&
    !!d.cover &&
    typeof d.cover.title === "string" &&
    Array.isArray(d.pages) &&
    Array.isArray(d.library) &&
    d.pages.every((p) => p && p.layout in LAYOUTS && Array.isArray(p.photos) && typeof p.caption === "string")
  );
}
