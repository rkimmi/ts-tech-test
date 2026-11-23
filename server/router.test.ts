import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { withDB } from "./testing.ts";
import { createApp } from "./router.ts";

const postInsight = async (
  app: ReturnType<typeof createApp>,
  body: string,
) => {
  const res = await app.handle(
    new Request("http://localhost/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
  );
  if (!res) throw new Error("No response from app");
  return { status: res.status, body: await res.json() };
};

describe("POST /insights", () => {
  describe("with invalid fields", () => {
    withDB((fixture) => {
      it("returns 400 with field errors and stores nothing", async () => {
        const app = createApp(fixture);
        const res = await postInsight(
          app,
          JSON.stringify({ brandId: "x", text: "   " }),
        );

        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          error: {
            formErrors: [],
            fieldErrors: {
              brandId: [expect.any(String)],
              text: [expect.any(String)],
            },
          },
        });
        expect(fixture.insights.selectAll()).toEqual([]);
      });

      it("reports missing and out-of-range fields", async () => {
        const app = createApp(fixture);
        const res = await postInsight(app, JSON.stringify({ brandId: -1 }));

        expect(res.status).toBe(400);
        expect(Object.keys(res.body.error.fieldErrors).sort()).toEqual([
          "brandId",
          "text",
        ]);
        expect(res.body.error.formErrors).toEqual([]);
      });
    });
  });

  describe("with a body that is not JSON", () => {
    withDB((fixture) => {
      it("returns 400 with a form-level error", async () => {
        const app = createApp(fixture);
        const res = await postInsight(app, "not json");

        expect(res.status).toBe(400);
        expect(res.body.error.formErrors).toHaveLength(1);
        expect(res.body.error.fieldErrors).toEqual({});
        expect(fixture.insights.selectAll()).toEqual([]);
      });
    });
  });

  describe("with a valid body", () => {
    withDB((fixture) => {
      it("returns 201 with the created insight", async () => {
        const app = createApp(fixture);
        const res = await postInsight(
          app,
          JSON.stringify({ brandId: 2, text: "  Insightful  " }),
        );

        expect(res.status).toBe(201);
        expect(res.body).toEqual({
          id: 1,
          brandId: 2,
          text: "Insightful",
          date: expect.any(String),
        });
        expect(fixture.insights.selectAll()).toHaveLength(1);
      });
    });
  });
});
