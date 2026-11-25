import * as oak from "@oak/oak";
import {
  type CreateInsightErrorResponse,
  CreateInsightRequest,
  type CreateInsightResponse,
  type ListInsightsResponse,
} from "@suittracker/lib/dtos";
import { InsightId } from "@suittracker/lib/utils";
import {
  createInsight,
  deleteInsight,
  listInsights,
  lookupInsight,
} from "$operations/insights/index.ts";
import { toInsightDto } from "$mappers/insight.ts";
import type { HasDBClient } from "../shared.ts";

export const createInsightsRouter = ({ db }: HasDBClient): oak.Router => {
  const router = new oak.Router({ prefix: "/insights" });

  router.get("/", (ctx) => {
    const result = listInsights({ db });
    const response: ListInsightsResponse = { items: result.map(toInsightDto) };
    ctx.response.body = response;
    ctx.response.status = 200;
  });

  router.get("/:id", (ctx) => {
    const parsedId = InsightId.safeParse(ctx.params.id);
    if (!parsedId.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: `Invalid insight id: ${ctx.params.id}` };
      return;
    }
    const id = parsedId.data;
    const result = lookupInsight({ db, id });
    if (!result) {
      ctx.response.status = 404;
      ctx.response.body = { error: `Insight ${id} not found` };
      return;
    }
    ctx.response.body = toInsightDto(result);
    ctx.response.status = 200;
  });

  router.post("/", async (ctx) => {
    const body = await ctx.request.body.json().catch(() => undefined);
    const parsed = CreateInsightRequest.safeParse(body);

    if (!parsed.success) {
      ctx.response.status = 400;
      const response: CreateInsightErrorResponse = {
        error: parsed.error.flatten(),
      };
      ctx.response.body = response;
      return;
    }

    const result = createInsight({
      db,
      brand: parsed.data.brandId,
      text: parsed.data.text,
    });
    const response: CreateInsightResponse = toInsightDto(result);
    ctx.response.status = 201;
    ctx.response.body = response;
  });

  router.delete("/:id", (ctx) => {
    const parsedId = InsightId.safeParse(ctx.params.id);
    if (!parsedId.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: `Invalid insight id: ${ctx.params.id}` };
      return;
    }
    const id = parsedId.data;
    if (!deleteInsight({ db, id })) {
      ctx.response.status = 404;
      ctx.response.body = { error: `Insight ${id} not found` };
      return;
    }
    ctx.response.status = 204;
  });

  return router;
};
