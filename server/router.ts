import * as oak from "@oak/oak";
import { createInsightsRouter } from "./routes/insights.ts";
import type { HasDBClient } from "./shared.ts";
import { errorHandler, type Logger, requestLogger } from "./middleware.ts";

const createV1Router = (deps: HasDBClient): oak.Router => {
  const router = new oak.Router();
  const insightsRouter = createInsightsRouter(deps);
  router.use(insightsRouter.routes(), insightsRouter.allowedMethods());
  return router;
};

export const createRouter = (deps: HasDBClient): oak.Router => {
  const router = new oak.Router();

  router.get("/_health", (ctx) => {
    ctx.response.body = "OK";
    ctx.response.status = 200;
  });

  const v1 = createV1Router(deps);
  router.use("/v1", v1.routes(), v1.allowedMethods());

  // Point unversioned paths to v1 by default
  router.use(v1.routes(), v1.allowedMethods());

  return router;
};

export type AppDeps = HasDBClient & {
  logger?: Logger;
};

export const createApp = (
  { logger = console, ...deps }: AppDeps,
): oak.Application => {
  const router = createRouter(deps);
  const app = new oak.Application();
  app.use(requestLogger(logger));
  app.use(errorHandler(logger));
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
};
