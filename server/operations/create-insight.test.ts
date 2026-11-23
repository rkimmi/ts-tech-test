import { beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { withDB } from "../testing.ts";
import type { Insight } from "$models/insight.ts";
import createInsight from "./create-insight.ts";

describe("creating an insight", () => {
  describe("into an empty DB", () => {
    withDB((fixture) => {
      let result: Insight;
      let before: Date;

      beforeAll(() => {
        before = new Date();
        result = createInsight({ ...fixture, brand: 3, text: "Insightful" });
      });

      it("returns the created insight with a generated id and timestamp", () => {
        expect(result).toEqual({
          id: 1,
          brand: 3,
          text: "Insightful",
          createdAt: expect.any(Date),
        });
        expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
      });

      it("persists the insight", () => {
        expect(fixture.insights.selectAll()).toEqual([
          {
            id: 1,
            brand: 3,
            text: "Insightful",
            createdAt: result.createdAt.toISOString(),
          },
        ]);
      });
    });
  });

  describe("with text containing SQL metacharacters", () => {
    withDB((fixture) => {
      const text = "it's a '); DROP TABLE insights; --";
      let result: Insight;

      beforeAll(() => {
        result = createInsight({ ...fixture, brand: 1, text });
      });

      it("stores the text verbatim", () => {
        expect(result.text).toBe(text);
        expect(fixture.insights.selectAll()).toHaveLength(1);
      });
    });
  });
});
