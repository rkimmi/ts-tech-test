import * as oak from "@oak/oak";
import { CreateInsightRequest } from "@suittracker/lib/dtos";
import listInsights from "./operations/list-insights.ts";
import lookupInsight from "./operations/lookup-insight.ts";
import createInsight from "./operations/create-insight.ts";
import { toInsightDto } from "$mappers/insight.ts";
import type { HasDBClient } from "./shared.ts";

export const createRouter = ({ db }: HasDBClient): oak.Router => {
  const router = new oak.Router();

  router.get("/_health", (ctx) => {
    ctx.response.body = "OK";
    ctx.response.status = 200;
  });

  router.get("/insights", (ctx) => {
    const result = listInsights({ db });
    ctx.response.body = result.map(toInsightDto);
    ctx.response.status = 200;
  });

  router.get("/insights/:id", (ctx) => {
    const params = ctx.params as Record<string, any>;
    const result = lookupInsight({ db, id: params.id });
    if (!result) {
      ctx.response.status = 404;
      ctx.response.body = { error: `Insight ${params.id} not found` };
      return;
    }
    ctx.response.body = toInsightDto(result);
    ctx.response.status = 200;
  });

  router.post("/insights", async (ctx) => {
    const body = await ctx.request.body.json().catch(() => undefined);
    const parsed = CreateInsightRequest.safeParse(body);

    if (!parsed.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: parsed.error.flatten() };
      return;
    }

    const result = createInsight({
      db,
      brand: parsed.data.brandId,
      text: parsed.data.text,
    });
    ctx.response.status = 201;
    ctx.response.body = toInsightDto(result);
  });

  router.get("/insights/delete", (ctx) => {
    // TODO
  });

  return router;
};

export const createApp = (deps: HasDBClient): oak.Application => {
  const router = createRouter(deps);
  const app = new oak.Application();
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
};
