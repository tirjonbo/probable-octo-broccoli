import { test } from "node:test";
import assert from "node:assert/strict";
import { autofill, emptyProject, filledSlots, isProjectData, resizePages, setLayout } from "../src/lib/project.ts";

const withPhotos = (pages: number, n: number) => ({
  ...emptyProject(pages),
  library: Array.from({ length: n }, (_, i) => `p${i}`),
});

test("автозаполнение использует каждое фото ровно один раз", () => {
  for (const [pages, n] of [[20, 7], [20, 20], [20, 45], [10, 40]]) {
    const d = autofill(withPhotos(pages, n));
    const used = d.pages.flatMap((p) => p.photos).filter(Boolean);
    assert.equal(used.length, n, `${pages} стр., ${n} фото`);
    assert.equal(new Set(used).size, n);
    assert.equal(d.cover.photo, "p0");
  }
});

test("лишние фото не помещаются — максимум 4 на страницу", () => {
  const d = autofill(withPhotos(10, 60));
  assert.equal(filledSlots(d).filled, 40);
});

test("смена макета сохраняет фото, пока хватает мест", () => {
  const p = { layout: "four" as const, photos: ["a", "b", null, "c"], caption: "" };
  assert.deepEqual(setLayout(p, "two-v").photos, ["a", "b"]);
  assert.deepEqual(setLayout(p, "three").photos, ["a", "b", "c"]);
});

test("resizePages добавляет и обрезает страницы", () => {
  const d = emptyProject(20);
  assert.equal(resizePages(d, 30).pages.length, 30);
  assert.equal(resizePages(d, 10).pages.length, 10);
});

test("валидация данных проекта", () => {
  assert.ok(isProjectData(emptyProject(4)));
  assert.ok(!isProjectData({ theme: "x" }));
  assert.ok(!isProjectData({ ...emptyProject(1), pages: [{ layout: "evil", photos: [], caption: "" }] }));
});

test("при нехватке фото первая страница всё равно заполнена", () => {
  const d = autofill(withPhotos(20, 8));
  assert.ok(d.pages[0].photos[0]);
});
