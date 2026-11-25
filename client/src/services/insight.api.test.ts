import { afterEach, describe, expect, it, vi } from "vitest";
import { listInsights } from "./insight.api.ts";

const respondWithDate = (date: string) =>
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({ items: [{ id: 1, brandId: 1, text: "Hi", date }] }),
    ),
  );

describe("listInsights", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads a UTC date", async () => {
    respondWithDate("2026-11-25T09:05:00.000Z");
    const { items } = await listInsights();
    expect(items[0].date.toISOString()).toBe("2026-11-25T09:05:00.000Z");
  });

  it("reads a date with timezone offset", async () => {
    respondWithDate("2026-11-25T22:05:00.000+13:00");
    const { items } = await listInsights();
    expect(items[0].date.toISOString()).toBe("2026-11-25T09:05:00.000Z");
  });

  it("rejects if dates have no time zone", async () => {
    respondWithDate("2026-11-25T09:05:00.000");
    await expect(listInsights()).rejects.toThrow();
  });

  it("rejects if any date is not a timestamp", async () => {
    respondWithDate("garbage");
    await expect(listInsights()).rejects.toThrow();
  });
});
