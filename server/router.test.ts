import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { withDB } from "./testing.ts";
import { createApp } from "./router.ts";

const postInsight = async (
  app: ReturnType<typeof createApp>,
  body: string,
) => {
  const res = await app.handle(
    new Request("http://localhost/v1/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
  );
  if (!res) throw new Error("No response from app");
  return { status: res.status, body: await res.json() };
};

describe("POST /v1/insights", () => {
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

const deleteInsightReq = async (
  app: ReturnType<typeof createApp>,
  id: string,
) => {
  const res = await app.handle(
    new Request(`http://localhost/v1/insights/${id}`, { method: "DELETE" }),
  );
  if (!res) throw new Error("No response from app");
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : undefined };
};

describe("DELETE /v1/insights/:id", () => {
  withDB((fixture) => {
    it("returns 400 for an invalid id", async () => {
      const res = await deleteInsightReq(createApp(fixture), "abc");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid insight id: abc" });
    });

    it("returns 404 when the insight does not exist", async () => {
      const res = await deleteInsightReq(createApp(fixture), "42");
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Insight 42 not found" });
    });

    it("returns 204 and removes the insight", async () => {
      fixture.insights.insert([
        { brand: 1, createdAt: new Date().toISOString(), text: "Bye" },
      ]);
      const [{ id }] = fixture.insights.selectAll();

      const res = await deleteInsightReq(createApp(fixture), String(id));

      expect(res.status).toBe(204);
      expect(res.body).toBeUndefined();
      expect(fixture.insights.selectAll()).toEqual([]);
    });
  });
});

describe("GET /v1/insights", () => {
  withDB((fixture) => {
    it("returns the insights as items within an object", async () => {
      fixture.insights.insert([
        { brand: 3, createdAt: new Date().toISOString(), text: "Hi" },
      ]);

      const res = await createApp(fixture).handle(
        new Request("http://localhost/v1/insights"),
      );
      if (!res) throw new Error("No response from app");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        items: [
          { id: 1, brandId: 3, text: "Hi", date: expect.any(String) },
        ],
      });
    });
  });
});

describe("unversioned paths", () => {
  withDB((fixture) => {
    it("are served by v1", async () => {
      fixture.insights.insert([
        { brand: 3, createdAt: new Date().toISOString(), text: "Hi" },
      ]);
      const app = createApp(fixture);

      const get = async (path: string) => {
        const res = await app.handle(new Request(`http://localhost${path}`));
        if (!res) throw new Error("No response from app");
        return { status: res.status, body: await res.json() };
      };

      const unversioned = await get("/insights");
      expect(unversioned.status).toBe(200);
      expect(unversioned.body).toEqual((await get("/v1/insights")).body);
    });
  });
});
