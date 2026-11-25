import { describe, expect, it } from "vitest";
import { formatDate } from "./format-date.ts";

// Note: Expects tests run with TZ=UTC
// Below normalises unicode spaces as these can vary by runtime
const format = (date: Date) => formatDate(date).replace(/\s/g, " ");

describe("formatDate", () => {
  it("formats a morning time with weekday, month, day, year and time", () => {
    expect(format(new Date("2026-11-25T09:05:00.000Z"))).toBe(
      "Wed, Nov 25, 2026, 09:05 AM",
    );
  });

  it("formats an afternoon time as PM", () => {
    expect(format(new Date("2026-01-03T15:30:00.000Z"))).toBe(
      "Sat, Jan 3, 2026, 03:30 PM",
    );
  });

  it("formats midnight as 12 AM", () => {
    expect(format(new Date("2026-02-01T00:00:00.000Z"))).toBe(
      "Sun, Feb 1, 2026, 12:00 AM",
    );
  });

  it("formats a non UTC date with an offset into the local time zone", () => {
    expect(format(new Date("2026-11-25T22:05:00+13:00"))).toBe(
      "Wed, Nov 25, 2026, 09:05 AM",
    );
  });
});
