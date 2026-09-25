import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PRODUCTS, money, normalizeConfig, normalizePhone, priceFor } from "../src/lib/catalog.ts";

const book = DEFAULT_PRODUCTS.find((p) => p.slug === "photobook")!;

test("базовая цена фотокниги — формат без доплат", () => {
  assert.equal(priceFor(book, normalizeConfig(book, {})), 290_000);
});

test("доплаты за обложку, бумагу и страницы складываются", () => {
  const c = normalizeConfig(book, { format: "30x30", cover: "linen", paper: "silk", pages: 30 });
  assert.equal(priceFor(book, c), 490_000 + 100_000 + 70_000 + 45_000);
});

test("число страниц ограничивается и округляется до шага", () => {
  assert.equal(normalizeConfig(book, { pages: 5 }).pages, 20);
  assert.equal(normalizeConfig(book, { pages: 999 }).pages, 100);
  assert.equal(normalizeConfig(book, { pages: 34 }).pages, 30);
});

test("неизвестные значения отклоняются", () => {
  assert.throws(() => normalizeConfig(book, { format: "1x1" }));
  assert.throws(() => normalizeConfig(book, { cover: "gold" }));
});

test("сумы форматируются с пробелами", () => {
  assert.equal(money(290000), "290 000 сум");
});

test("узбекские номера нормализуются", () => {
  assert.equal(normalizePhone("+998 90 123-45-67"), "+998 90 123 45 67");
  assert.equal(normalizePhone("901234567"), "+998 90 123 45 67");
  assert.equal(normalizePhone("+7 900 123 45 67"), null);
  assert.equal(normalizePhone("12345"), null);
});
