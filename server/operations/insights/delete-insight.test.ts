import { beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { withDB } from "../../testing.ts";
import deleteInsight from "./delete-insight.ts";

describe("deleting an insight", () => {
  describe("that exists", () => {
    withDB((fixture) => {
      let result: boolean;

      beforeAll(() => {
        fixture.insights.insert([
          { brand: 1, createdAt: new Date().toISOString(), text: "One" },
          { brand: 2, createdAt: new Date().toISOString(), text: "Two" },
        ]);
        result = deleteInsight({ ...fixture, id: 1 });
      });

      it("returns true", () => {
        expect(result).toBe(true);
      });

      it("removes only that insight", () => {
        expect(fixture.insights.selectAll().map((row) => row.id)).toEqual([2]);
      });
    });
  });

  describe("that does not exist", () => {
    withDB((fixture) => {
      it("returns false", () => {
        expect(deleteInsight({ ...fixture, id: 99 })).toBe(false);
      });
    });
  });
});
