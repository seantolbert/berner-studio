import { describe, expect, it } from "vitest";
import {
  ensureString,
  normalizeProductCore,
  normalizeProductSummary,
  normalizeTemplate,
  normalizeVariant,
  normalizeImage,
  toBoardRowOrders,
  toBoardSize,
  toBoardStrips,
} from "@/services/productsShared";

describe("productsShared helpers", () => {
  it("ensures string values", () => {
    expect(ensureString("abc")).toBe("abc");
    expect(ensureString(123)).toBe("123");
    expect(ensureString(null)).toBeNull();
    expect(ensureString(NaN)).toBeNull();
  });

  it("normalizes product summary", () => {
    const summary = normalizeProductSummary({
      slug: "test",
      name: "Test Product",
      price_cents: "1234",
      primary_image_url: "/img.jpg",
      card_label: "New",
    });
    expect(summary).toEqual({
      slug: "test",
      name: "Test Product",
      price_cents: 1234,
      primary_image_url: "/img.jpg",
      card_label: "New",
    });
  });

  it("normalizes product core", () => {
    const product = normalizeProductCore({
      id: 1,
      slug: "core",
      name: "Core Product",
      price_cents: "5678",
      category: "boards",
      status: "published",
      primary_image_url: "/image.jpg",
      short_desc: "short",
      long_desc: "long",
      card_label: "Featured",
    });
    expect(product).toMatchObject({
      id: "1",
      slug: "core",
      name: "Core Product",
      price_cents: 5678,
      category: "boards",
      status: "published",
      primary_image_url: "/image.jpg",
      short_desc: "short",
      long_desc: "long",
      card_label: "Featured",
    });
  });

  it("normalizes variants", () => {
    const variant = normalizeVariant({
      id: 42,
      color: "Red",
      size: "M",
      sku: "SKU-1",
      price_cents_override: "4321",
      status: "published",
    });
    expect(variant).toEqual({
      id: "42",
      color: "Red",
      size: "M",
      sku: "SKU-1",
      price_cents_override: 4321,
      status: "published",
    });
  });

  it("normalizes images", () => {
    const image = normalizeImage({
      id: 99,
      url: "/img.png",
      alt: "Alt text",
      color: "Blue",
    });
    expect(image).toEqual({
      id: "99",
      url: "/img.png",
      alt: "Alt text",
      color: "Blue",
    });
  });

  it("normalizes templates", () => {
    const template = normalizeTemplate({
      id: 5,
      name: "Template",
      size: "small",
      strip3_enabled: true,
      strips: [
        ["a", "b"],
        ["c", null],
      ],
      order: [{ stripNo: 1, reflected: false }],
    });
    expect(template).toMatchObject({
      id: "5",
      name: "Template",
      size: "small",
      strip3Enabled: true,
      layout: {
        strips: [
          ["a", "b"],
          ["c", null],
        ],
        order: [{ stripNo: 1, reflected: false }],
      },
    });
  });

  it("converts board sizes safely", () => {
    expect(toBoardSize("regular")).toBe("regular");
    expect(toBoardSize("unknown")).toBe("regular");
  });

  it("converts board row orders safely", () => {
    expect(
      toBoardRowOrders([
        { stripNo: 2, reflected: true },
        { stripNo: "3", reflected: false },
        { stripNo: null },
      ])
    ).toEqual([
      { stripNo: 2, reflected: true },
      { stripNo: 3, reflected: false },
      { stripNo: 1, reflected: false },
    ]);
  });

  it("converts board strips with null guards", () => {
    expect(
      toBoardStrips([
        ["a", 1, null],
        [{}, "b"],
      ])
    ).toEqual([
      ["a", null, null],
      [null, "b"],
    ]);
  });
});
