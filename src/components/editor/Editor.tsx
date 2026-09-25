"use client";
import "./editor.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfigFields } from "@/components/Configurator";
import { type ProjectConfig, getProduct, priceFor, rub } from "@/lib/catalog";
import {
  LAYOUTS,
  type LayoutId,
  type Page,
  type ProjectData,
  THEMES,
  autofill,
  filledSlots,
  resizePages,
  setLayout,
} from "@/lib/project";
import { uploadPhoto } from "./upload";

type Project = { id: string; product: string; title: string; config: ProjectConfig; data: ProjectData };

/** Откуда перетаскивают фото: из библиотеки или из другого слота. */
type DragSource = { photo: string; from?: { page: number; slot: number } | "cover" };

export const photoUrl = (id: string) => `/api/uploads/${id}`;

export function Editor({ initial, signedIn }: { initial: Project; signedIn: boolean }) {
  const product = getProduct(initial.product)!;
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [config, setConfig] = useState(initial.config);
  const [data, setData] = useState(initial.data);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [tab, setTab] = useState<"photos" | "design" | "params">("photos");
  const [picked, setPicked] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ page: number; slot: number } | "cover" | null>(null);
  const [uploading, setUploading] = useState({ done: 0, total: 0, errors: [] as string[] });
  const [preview, setPreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const drag = useRef<DragSource | null>(null);
  const first = useRef(true);

  const theme = THEMES.find((t) => t.id === data.theme) ?? THEMES[0];
  const aspect = product.formats.find((f) => f.id === config.format)?.aspect ?? 1;
  const spreads = product.kind === "book";

  // ---------- Автосохранение ----------
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveState("dirty");
    const t = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/projects/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, config, data }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [title, config, data, initial.id]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  const changeConfig = (c: ProjectConfig) => {
    setConfig(c);
    setData((d) => resizePages(d, c.pages));
  };

  // ---------- Фото ----------
  const usage = useMemo(() => {
    const m = new Map<string, number>();
    const bump = (id: string | null) => id && m.set(id, (m.get(id) ?? 0) + 1);
    bump(data.cover.photo);
    data.pages.forEach((p) => p.photos.forEach(bump));
    return m;
  }, [data]);

  async function onFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploading({ done: 0, total: list.length, errors: [] });
    // По 3 файла параллельно — быстро и без перегрузки сервера.
    const queue = [...list];
    const worker = async () => {
      while (queue.length) {
        const file = queue.shift()!;
        try {
          const id = await uploadPhoto(file);
          setData((d) => ({ ...d, library: [...d.library, id] }));
        } catch (e) {
          setUploading((u) => ({ ...u, errors: [...u.errors, `${file.name}: ${(e as Error).message}`] }));
        }
        setUploading((u) => ({ ...u, done: u.done + 1 }));
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  const updatePage = useCallback((index: number, fn: (p: Page) => Page) => {
    setData((d) => ({ ...d, pages: d.pages.map((p, i) => (i === index ? fn(p) : p)) }));
  }, []);

  /** Кладёт фото в слот; если фото пришло из другого слота — меняет местами. */
  function place(target: { page: number; slot: number } | "cover", src: DragSource) {
    setData((d) => {
      const pages = d.pages.map((p) => ({ ...p, photos: [...p.photos] }));
      const cover = { ...d.cover };
      const get = (t: typeof target) => (t === "cover" ? cover.photo : pages[t.page].photos[t.slot]);
      const put = (t: typeof target, v: string | null) => {
        if (t === "cover") cover.photo = v;
        else pages[t.page].photos[t.slot] = v;
      };
      const previous = get(target);
      put(target, src.photo);
      if (src.from) put(src.from, previous ?? null);
      return { ...d, cover, pages };
    });
    setPicked(null);
  }

  function clearSelected() {
    if (!selected) return;
    if (selected === "cover") setData((d) => ({ ...d, cover: { ...d.cover, photo: null } }));
    else updatePage(selected.page, (p) => ({ ...p, photos: p.photos.map((x, i) => (i === selected.slot ? null : x)) }));
    setSelected(null);
  }

  function removeFromLibrary(id: string) {
    setData((d) => ({
      ...d,
      library: d.library.filter((x) => x !== id),
      cover: { ...d.cover, photo: d.cover.photo === id ? null : d.cover.photo },
      pages: d.pages.map((p) => ({ ...p, photos: p.photos.map((x) => (x === id ? null : x)) })),
    }));
    if (picked === id) setPicked(null);
  }

  function onSlotClick(target: { page: number; slot: number } | "cover") {
    if (picked) return place(target, { photo: picked });
    setSelected((s) => (JSON.stringify(s) === JSON.stringify(target) ? null : target));
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        clearSelected();
      }
      if (e.key === "Escape") {
        setSelected(null);
        setPicked(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------- Размер холста ----------
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(900);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCanvasW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const perRow = spreads ? 2 : 1;
  let pageW = Math.min(440, (canvasW - 8) / perRow);
  if (pageW / aspect > 520) pageW = 520 * aspect;
  const pageH = pageW / aspect;

  const groups: number[][] = [];
  for (let i = 0; i < data.pages.length; i += perRow) groups.push(Array.from({ length: Math.min(perRow, data.pages.length - i) }, (_, k) => i + k));

  const price = priceFor(product, config);
  const { filled, total } = filledSlots(data);
  const emptySlots = total - filled;

  async function addToCart() {
    setAdding(true);
    // Дожидаемся сохранения, чтобы в корзину попала актуальная версия.
    await fetch(`/api/projects/${initial.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, config, data }),
    });
    setSaveState("saved");
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: initial.id }),
    });
    if (res.ok) {
      router.push("/cart");
      router.refresh();
    } else setAdding(false);
  }

  const pageProps = { width: pageW, height: pageH, theme, drag, onDrop: place, onSlotClick, selected };

  return (
    <div className="ed">
      <div className="ed-top">
        <Link href={signedIn ? "/account/projects" : "/catalog"} className="btn btn-ghost btn-sm" aria-label="Выйти из редактора">
          ←
        </Link>
        <input className="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} aria-label="Название проекта" />
        <span className="muted small">
          {{ saved: "Сохранено", dirty: "Изменения…", saving: "Сохраняем…", error: "Ошибка сохранения" }[saveState]}
        </span>
        <div style={{ flex: 1 }} />
        <span className="muted small">
          {product.title} · {rub(price)}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={() => setPreview(true)}>
          Предпросмотр
        </button>
        <button className="btn btn-sm" onClick={addToCart} disabled={adding}>
          {adding ? "Добавляем…" : "В корзину"}
        </button>
      </div>

      <div className="ed-body">
        <aside className="ed-side">
          <div className="tabs">
            {(
              [
                ["photos", "Фото"],
                ["design", "Оформление"],
                ["params", "Параметры"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="ed-panel">
            {tab === "photos" && (
              <PhotosPanel
                library={data.library}
                usage={usage}
                picked={picked}
                setPicked={setPicked}
                onFiles={onFiles}
                uploading={uploading}
                drag={drag}
                onRemove={removeFromLibrary}
                onAutofill={() => setData((d) => autofill(d))}
                emptySlots={emptySlots}
              />
            )}
            {tab === "design" && (
              <div className="stack">
                <div className="muted small">Тема</div>
                <div className="ed-themes">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      className="ed-theme"
                      aria-pressed={t.id === data.theme}
                      style={{ background: t.background, color: t.ink, fontFamily: t.font }}
                      onClick={() => setData((d) => ({ ...d, theme: t.id }))}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <label className="field">
                  <span>Надпись на обложке</span>
                  <input value={data.cover.title} maxLength={60} onChange={(e) => setData((d) => ({ ...d, cover: { ...d.cover, title: e.target.value } }))} />
                </label>
                <label className="field">
                  <span>Подзаголовок</span>
                  <input value={data.cover.subtitle} maxLength={60} onChange={(e) => setData((d) => ({ ...d, cover: { ...d.cover, subtitle: e.target.value } }))} />
                </label>
              </div>
            )}
            {tab === "params" && (
              <div className="stack">
                <ConfigFields product={product} config={config} onChange={changeConfig} />
                <p className="ed-hint">При уменьшении числа страниц последние страницы удаляются вместе с фото на них.</p>
              </div>
            )}
          </div>
        </aside>

        <div className="ed-canvas" ref={canvasRef}>
          {selected && (
            <div className="notice row small" style={{ position: "sticky", top: 0, zIndex: 5, marginBottom: 12, justifyContent: "space-between" }}>
              Фото выбрано. Перетащите его в другое место или
              <button className="btn btn-ghost btn-sm" onClick={clearSelected}>
                Убрать со страницы
              </button>
            </div>
          )}
          {picked && (
            <div className="notice small" style={{ position: "sticky", top: 0, zIndex: 5, marginBottom: 12 }}>
              Коснитесь места на странице, чтобы вставить выбранное фото. Esc — отмена.
            </div>
          )}

          <div className="muted small center" style={{ marginBottom: 8 }}>
            Обложка
          </div>
          <div className="ed-spread">
            <CoverView {...pageProps} cover={data.cover} />
          </div>
          <div style={{ height: 28 }} />

          {groups.map((g, gi) => (
            <div key={gi}>
              <div className="ed-spread">
                {g.map((i) => (
                  <PageView key={i} index={i} page={data.pages[i]} {...pageProps} />
                ))}
              </div>
              <div className="ed-pagebar">
                {g.map((i) => (
                  <PageControls key={i} index={i} page={data.pages[i]} onChange={(fn) => updatePage(i, fn)} unit={product.kind === "cards" ? "Открытка" : product.kind === "calendar" ? "Лист" : "Стр."} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview && <Preview data={data} aspect={aspect} spreads={spreads} onClose={() => setPreview(false)} />}
    </div>
  );
}

// ---------- Панель фото ----------

function PhotosPanel(props: {
  library: string[];
  usage: Map<string, number>;
  picked: string | null;
  setPicked: (id: string | null) => void;
  onFiles: (f: FileList) => void;
  uploading: { done: number; total: number; errors: string[] };
  drag: React.MutableRefObject<DragSource | null>;
  onRemove: (id: string) => void;
  onAutofill: () => void;
  emptySlots: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const { uploading } = props;
  const busy = uploading.done < uploading.total;
  return (
    <div>
      <div
        className={`ed-drop ${over ? "over" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          props.onFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
      >
        <strong style={{ color: "var(--ink)" }}>Загрузить фото</strong>
        <div className="small">или перетащите файлы сюда</div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files && props.onFiles(e.target.files)} />
      </div>
      {uploading.total > 0 && (
        <div className="small" style={{ marginTop: 8 }}>
          {busy ? `Загружаем ${uploading.done} из ${uploading.total}…` : `Загружено: ${uploading.total - uploading.errors.length}`}
          {uploading.errors.map((e) => (
            <div key={e} className="error">
              {e}
            </div>
          ))}
        </div>
      )}
      <div className="spread" style={{ marginTop: 16 }}>
        <span className="small muted">В проекте: {props.library.length}</span>
        <button className="btn btn-sm" onClick={props.onAutofill} disabled={props.library.length === 0}>
          Автозаполнение
        </button>
      </div>
      {props.emptySlots > 0 && props.library.length > 0 && <p className="ed-hint">Пустых мест: {props.emptySlots}</p>}
      <div className="ed-lib">
        {props.library.map((id) => (
          <button
            key={id}
            className={`ed-lib-item ${props.picked === id ? "picked" : ""}`}
            draggable
            onDragStart={() => (props.drag.current = { photo: id })}
            onClick={() => props.setPicked(props.picked === id ? null : id)}
            onDoubleClick={() => confirm("Удалить фото из проекта?") && props.onRemove(id)}
            title="Перетащите на страницу или нажмите, затем выберите место. Двойной клик — удалить."
          >
            <img src={photoUrl(id)} alt="" loading="lazy" />
            {props.usage.get(id) ? <span className="used">×{props.usage.get(id)}</span> : null}
          </button>
        ))}
      </div>
      <p className="ed-hint">Перетащите фото на страницу. На телефоне — нажмите на фото, затем на место на странице.</p>
    </div>
  );
}

// ---------- Страницы ----------

type PageViewProps = {
  width: number;
  height: number;
  theme: (typeof THEMES)[number];
  drag: React.MutableRefObject<DragSource | null>;
  onDrop: (target: { page: number; slot: number } | "cover", src: DragSource) => void;
  onSlotClick: (target: { page: number; slot: number } | "cover") => void;
  selected: { page: number; slot: number } | "cover" | null;
};

function Slot({
  target,
  rect,
  photo,
  props,
}: {
  target: { page: number; slot: number } | "cover";
  rect: [number, number, number, number];
  photo: string | null;
  props: PageViewProps;
}) {
  const [over, setOver] = useState(false);
  const isSelected = JSON.stringify(props.selected) === JSON.stringify(target);
  return (
    <button
      className={`ed-slot ${photo ? "" : "empty"} ${over ? "over" : ""} ${isSelected ? "selected" : ""}`}
      style={{ left: `${rect[0] * 100}%`, top: `${rect[1] * 100}%`, width: `${rect[2] * 100}%`, height: `${rect[3] * 100}%` }}
      draggable={!!photo}
      onDragStart={() => photo && (props.drag.current = { photo, from: target })}
      onDragOver={(e) => {
        if (props.drag.current) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (props.drag.current) props.onDrop(target, props.drag.current);
        props.drag.current = null;
      }}
      onClick={() => props.onSlotClick(target)}
      aria-label={photo ? "Фото на странице" : "Пустое место для фото"}
    >
      {photo ? <img src={photoUrl(photo)} alt="" /> : "+ фото"}
    </button>
  );
}

function PageView({ index, page, ...props }: PageViewProps & { index: number; page: Page }) {
  const slots = LAYOUTS[page.layout].slots;
  return (
    <div
      className={`ed-page ${page.layout === "text" ? "text-only" : ""}`}
      style={{ width: props.width, height: props.height, background: props.theme.background, color: props.theme.ink, fontFamily: props.theme.font }}
    >
      {slots.map((rect, s) => (
        <Slot key={s} target={{ page: index, slot: s }} rect={page.caption && page.layout !== "text" ? [rect[0], rect[1] * 0.94, rect[2], rect[3] * 0.94] : rect} photo={page.photos[s] ?? null} props={props} />
      ))}
      {page.caption && <div className="ed-caption">{page.caption}</div>}
    </div>
  );
}

function CoverView({ cover, ...props }: PageViewProps & { cover: ProjectData["cover"] }) {
  return (
    <div className="ed-page" style={{ width: props.width, height: props.height, background: props.theme.background, color: props.theme.ink, fontFamily: props.theme.font }}>
      <Slot target="cover" rect={[0.1, 0.08, 0.8, 0.6]} photo={cover.photo} props={props} />
      <div className="ed-cover-title">
        <div className="t">{cover.title}</div>
        <div className="s">{cover.subtitle}</div>
      </div>
    </div>
  );
}

function PageControls({ index, page, onChange, unit }: { index: number; page: Page; onChange: (fn: (p: Page) => Page) => void; unit: string }) {
  return (
    <div className="ctl">
      <span>
        {unit} {index + 1}
      </span>
      <select value={page.layout} onChange={(e) => onChange((p) => setLayout(p, e.target.value as LayoutId))} aria-label="Макет страницы">
        {Object.entries(LAYOUTS).map(([id, l]) => (
          <option key={id} value={id}>
            {l.label}
          </option>
        ))}
      </select>
      <input value={page.caption} maxLength={120} placeholder="Подпись" onChange={(e) => onChange((p) => ({ ...p, caption: e.target.value }))} aria-label="Подпись" />
    </div>
  );
}

// ---------- Предпросмотр ----------

function Preview({ data, aspect, spreads, onClose }: { data: ProjectData; aspect: number; spreads: boolean; onClose: () => void }) {
  // Кадр 0 — обложка, дальше развороты/страницы.
  const perRow = spreads ? 2 : 1;
  const frames = 1 + Math.ceil(data.pages.length / perRow);
  const [i, setI] = useState(0);
  const [vw, setVw] = useState(1000);
  const [vh, setVh] = useState(700);
  useEffect(() => {
    const upd = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    upd();
    window.addEventListener("resize", upd);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((x) => Math.min(frames - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", upd);
      window.removeEventListener("keydown", onKey);
    };
  }, [frames, onClose]);

  const theme = THEMES.find((t) => t.id === data.theme) ?? THEMES[0];
  const cols = i === 0 ? 1 : perRow;
  let w = Math.min((vw - 48) / cols, 700);
  if (w / aspect > vh - 180) w = (vh - 180) * aspect;
  const noop = () => {};
  const props: PageViewProps = { width: w, height: w / aspect, theme, drag: { current: null }, onDrop: noop, onSlotClick: noop, selected: null };
  const pageIdx = i === 0 ? [] : Array.from({ length: perRow }, (_, k) => (i - 1) * perRow + k).filter((k) => k < data.pages.length);

  return (
    <div className="ed-preview" role="dialog" aria-label="Предпросмотр">
      <div className="bar">
        <span>{i === 0 ? "Обложка" : spreads ? `Разворот ${i} из ${frames - 1}` : `Страница ${i} из ${frames - 1}`}</span>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          Закрыть
        </button>
      </div>
      <div className="stage" style={{ pointerEvents: "none" }}>
        <div className="ed-spread">
          {i === 0 ? <CoverView {...props} cover={data.cover} /> : pageIdx.map((k) => <PageView key={k} index={k} page={data.pages[k]} {...props} />)}
        </div>
      </div>
      <div className="nav">
        <button className="btn btn-ghost" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
          ← Назад
        </button>
        <span className="small">
          {i + 1} / {frames}
        </span>
        <button className="btn btn-ghost" onClick={() => setI((x) => Math.min(frames - 1, x + 1))} disabled={i === frames - 1}>
          Вперёд →
        </button>
      </div>
    </div>
  );
}
