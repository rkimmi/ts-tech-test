import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { withDB } from "../testing.ts";

describe("insights table createdAt", () => {
  withDB((fixture) => {
    const insertWithCreatedAt = (createdAt: string) =>
      fixture.insights.insert([{ brand: 1, createdAt, text: "Hi" }]);

    it("accepts a UTC ISO string", () => {
      expect(() => insertWithCreatedAt("2026-11-25T09:05:00.000Z")).not
        .toThrow();
    });

    it("rejects a timestamp without a time zone", () => {
      expect(() => insertWithCreatedAt("2026-11-25 09:05:00")).toThrow(
        "CHECK constraint failed",
      );
    });

    it("rejects a non UTC timestamp", () => {
      expect(() => insertWithCreatedAt("2026-11-25T22:05:00.000+13:00"))
        .toThrow("CHECK constraint failed");
    });

    it("rejects a value that is not a timestamp", () => {
      expect(() => insertWithCreatedAt("garbage")).toThrow(
        "CHECK constraint failed",
      );
    });

    it("rejects an impossible date", () => {
      expect(() => insertWithCreatedAt("2026-02-30T09:05:00.000Z")).toThrow(
        "CHECK constraint failed",
      );
    });
  });
});
