import * as oak from "@oak/oak";
import { createInsightsRouter } from "./routes/insights.ts";
import type { HasDBClient } from "./shared.ts";

export const createRouter = (deps: HasDBClient): oak.Router => {
  const router = new oak.Router();

  router.get("/_health", (ctx) => {
    ctx.response.body = "OK";
    ctx.response.status = 200;
  });

  const insightsRouter = createInsightsRouter(deps);
  router.use(insightsRouter.routes(), insightsRouter.allowedMethods());

  return router;
};

export const createApp = (deps: HasDBClient): oak.Application => {
  const router = createRouter(deps);
  const app = new oak.Application();
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
};
