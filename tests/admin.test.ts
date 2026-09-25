import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PRODUCTS, recalcTotals, validateProduct } from "../src/lib/catalog.ts";
import { DEFAULT_SETTINGS, mergeSettings, safeLink, validateSettings } from "../src/lib/config.ts";

const base = () => structuredClone(DEFAULT_PRODUCTS[0]) as unknown as Record<string, unknown>;

test("стартовые продукты проходят проверку", () => {
  for (const p of DEFAULT_PRODUCTS) assert.doesNotThrow(() => validateProduct(p as unknown as Record<string, unknown>));
});

test("продукт: размеры в см задают пропорции", () => {
  const p = base();
  p.formats = [{ id: "a", label: "A4", price: 1000, width: 21, height: 29.7 }];
  const v = validateProduct(p);
  assert.equal(v.formats[0].aspect, 21 / 29.7);
});

test("продукт: понятные ошибки на плохие данные", () => {
  assert.throws(() => validateProduct({ ...base(), slug: "Фото Книга" }), /латиница/);
  assert.throws(() => validateProduct({ ...base(), formats: [] }), /Форматы/);
  assert.throws(() => validateProduct({ ...base(), covers: [{ id: "x", label: "a", price: 0 }, { id: "x", label: "b", price: 0 }] }), /повторяется/);
  assert.throws(() => validateProduct({ ...base(), pages: { min: 30, max: 20, step: 1, included: 0, pricePerStep: 0 } }), /максимум/);
  assert.throws(() => validateProduct({ ...base(), color: "red" }), /Цвет/);
});

test("пересчёт заказа после правок менеджера", () => {
  const t = recalcTotals([{ price: 100_000, qty: 2 }, { price: 30_000, qty: 1 }], { discount: 10_000, delivery_price: 50_000, certificate_used: 0 });
  assert.deepEqual(t, { subtotal: 230_000, total: 270_000 });
  assert.equal(recalcTotals([{ price: 10, qty: 1 }], { discount: 0, delivery_price: 0, certificate_used: 999 }).total, 0);
});

test("настройки: новые поля получают значения по умолчанию", () => {
  const s = mergeSettings({ site: { name: "Моя студия" } });
  assert.equal(s.site.name, "Моя студия");
  assert.equal(s.site.hours, DEFAULT_SETTINGS.site.hours);
  assert.equal(s.delivery.price, DEFAULT_SETTINGS.delivery.price);
});

test("настройки: очистка и нормализация", () => {
  const s = validateSettings({
    site: { name: "  X  ", telegram: "https://t.me/shop", instagram: "@studio" },
    delivery: { city: "Ташкент", price: "45000", days: "" },
    certificates: { nominals: [500000, "abc", 100000] },
    faq: [{ q: "Вопрос", a: "Ответ" }, { q: "", a: "без вопроса" }],
  } as never);
  assert.equal(s.site.name, "X");
  assert.equal(s.site.telegram, "shop");
  assert.equal(s.site.instagram, "studio");
  assert.equal(s.delivery.price, 45000);
  assert.deepEqual(s.certificates.nominals, [100000, 500000]);
  assert.equal(s.faq.length, 1);
});

test("ссылки баннеров: запрещены javascript: и чужие протоколы", () => {
  assert.equal(safeLink("/catalog"), "/catalog");
  assert.equal(safeLink("https://t.me/x"), "https://t.me/x");
  assert.equal(safeLink("javascript:alert(1)"), "/");
  assert.equal(safeLink("//evil.com"), "/");
});
