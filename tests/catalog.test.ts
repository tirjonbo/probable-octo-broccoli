import { test } from "node:test";
import assert from "node:assert/strict";
import { deliveryPrice, getProduct, normalizeConfig, priceFor, FREE_DELIVERY_FROM } from "../src/lib/catalog.ts";

const book = getProduct("photobook")!;

test("базовая цена фотокниги — формат без доплат", () => {
  assert.equal(priceFor(book, normalizeConfig(book, {})), 2490);
});

test("доплаты за обложку, бумагу и страницы складываются", () => {
  const c = normalizeConfig(book, { format: "30x30", cover: "linen", paper: "silk", pages: 30 });
  assert.equal(priceFor(book, c), 4290 + 900 + 600 + 390);
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

test("доставка бесплатна от порога", () => {
  assert.equal(deliveryPrice("courier", FREE_DELIVERY_FROM - 1), 490);
  assert.equal(deliveryPrice("courier", FREE_DELIVERY_FROM), 0);
});
